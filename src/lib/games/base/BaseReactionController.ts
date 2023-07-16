import { CardinalEvents } from '#lib/types';
import type { LLRCData } from '#utils/LongLivingReactionCollector';
import { getEmojiString } from '#utils/functions';
import { container } from '@sapphire/framework';
import { cast } from '@sapphire/utilities';
import { RESTJSONErrorCodes } from 'discord-api-types/v9';
import { DiscordAPIError } from 'discord.js';
import { BaseController } from './BaseController';
import type { BaseReactionGame } from './BaseReactionGame';

export abstract class BaseReactionController<T> extends BaseController<T> {
	public readonly userId: string;

	public constructor(name: string, userId: string) {
		super(name);
		this.userId = userId;
	}

	protected async collectAvailableReaction(): Promise<string | null> {
		const game = cast<BaseReactionGame<T>>(this.game);
		return new Promise((resolve) => {
			game.listener.setTime(game.reactionTime);
			game.listener.setListener((data) => {
				if (data.userId !== this.userId) return;
				if (data.messageId !== game.message.id) return;

				const emoji = this.resolveCollectedData(data);
				if (!emoji) return;

				if (game.reactions.includes(emoji) && this.resolveCollectedValidity(emoji)) {
					void this.removeEmoji(data, emoji, this.userId);
					game.listener.setListener(null);
					game.listener.setTime(-1);
					resolve(emoji);
				}
			});

			game.listener.setEndListener(() => {
				resolve(null);
			});
		});
	}

	protected abstract resolveCollectedValidity(collected: string): boolean;

	protected resolveCollectedData(reaction: LLRCData): string | null {
		return getEmojiString(reaction.emoji);
	}

	protected async removeEmoji(reaction: LLRCData, emoji: string, userId: string): Promise<void> {
		try {
			emoji;
			const reactionMessage = await reaction.channel.messages.fetch(reaction.messageId);
			const userReactions = reactionMessage.reactions.cache.filter((reaction) => reaction.users.cache.has(userId));
			for (const reaction of userReactions.values()) {
				await reaction.users.remove(userId);
			}
		} catch (error) {
			if (error instanceof DiscordAPIError) {
				if (error.code === RESTJSONErrorCodes.UnknownMessage || error.code === RESTJSONErrorCodes.UnknownEmoji) return;
			}

			container.client.emit(CardinalEvents.Error, error as Error);
		}
	}
}
