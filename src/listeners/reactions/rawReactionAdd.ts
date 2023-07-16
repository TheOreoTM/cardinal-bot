import { CardinalEvents } from '#lib/types';
import type { LLRCData } from '#utils/LongLivingReactionCollector';
import { getEmojiString } from '#utils/functions';
import { ApplyOptions } from '@sapphire/decorators';
import { canReadMessages, isGuildBasedChannel } from '@sapphire/discord.js-utilities';
import { Listener, type ListenerOptions } from '@sapphire/framework';
import { GatewayDispatchEvents, type GatewayMessageReactionAddDispatch } from 'discord-api-types/v9';
import type { TextChannel } from 'discord.js';

@ApplyOptions<ListenerOptions>({
	event: GatewayDispatchEvents.MessageReactionAdd,
	emitter: 'ws'
})
export class UserListener extends Listener {
	public run(raw: GatewayMessageReactionAddDispatch['d']) {
		const channel = this.container.client.channels.cache.get(raw.channel_id) as TextChannel | undefined;
		if (!channel || !isGuildBasedChannel(channel) || !canReadMessages(channel) || raw.member?.user?.bot) return;

		const data: LLRCData = {
			channel,
			emoji: {
				animated: raw.emoji.animated ?? false,
				id: raw.emoji.id,
				managed: raw.emoji.managed ?? null,
				name: raw.emoji.name,
				requireColons: raw.emoji.require_colons ?? null,
				roles: raw.emoji.roles || null,
				// eslint-disable-next-line @typescript-eslint/dot-notation
				user: (raw.emoji.user && this.container.client.users['_add'](raw.emoji.user)) ?? {
					id: raw.user_id
				}
			},
			guild: channel.guild,
			messageId: raw.message_id,
			userId: raw.user_id
		};

		for (const llrc of this.container.client.llrCollectors) {
			llrc.send(data);
		}

		const emoji = getEmojiString(data.emoji);
		if (emoji === null) return;

		this.container.client.emit(CardinalEvents.RawReactionAdd, data, emoji);
	}
}
