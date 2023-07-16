import { CardinalEvents } from '#lib/types';
import { LongLivingReactionCollector } from '#utils/LongLivingReactionCollector';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import type { BaseController } from './BaseController';
import { BaseGame } from './BaseGame';
import { CardinalEmbedBuilder } from '#lib/structures';

export abstract class BaseReactionGame<T> extends BaseGame<T> {
	public readonly reactions: readonly string[];
	public readonly listener: LongLivingReactionCollector;
	public readonly reactionTime: number;

	public constructor(
		message: Message,
		playerA: BaseController<T>,
		playerB: BaseController<T>,
		reactions: readonly string[],
		reactionTime: number,
		turn = BaseGame.getTurn()
	) {
		super(message, playerA, playerB, turn);
		this.reactions = reactions;
		this.reactionTime = reactionTime;
		this.listener = new LongLivingReactionCollector();
	}

	protected async onStart(): Promise<unknown> {
		try {
			this.message = await send(this.message, {
				embeds: [new CardinalEmbedBuilder().setStyle('loading').setDescription('Setting up the game')]
			});
			for (const reaction of this.reactions) await this.message.react(reaction);
			// let buttons: ButtonBuilder[] = [];
			// for (const reaction of this.reactions)
			//   buttons.push(
			//     new ButtonBuilder()
			//       .setEmoji(reaction)
			//       .setStyle(ButtonStyle.Secondary)
			//       .setCustomId(Math.random().toString())
			//   );
			// const chunks = chunk(buttons, 3);
			// const rows: ActionRowBuilder<ButtonBuilder>[] = [];

			// for (const chunk of chunks) {
			//   const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			//     ...chunk
			//   );
			//   rows.push(row);
			// }
			//
			// await this.message.edit({ components: rows });
		} catch {
			await send(this.message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Something went wrong while setting up the game')]
			}).catch((error) => this.client.emit(CardinalEvents.Error, error));
		}

		return super.onStart();
	}

	protected get finished(): boolean {
		return this.listener.ended;
	}

	protected onEnd(): Promise<unknown> {
		this.listener.end();
		return super.onEnd();
	}
}
