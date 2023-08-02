import type { CardinalEvents } from '#lib/types';
import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';

export class UserEvent extends Listener<typeof CardinalEvents.MentionPrefixOnly> {
	public async run(message: Message) {
		const prefix = await this.container.client.fetchPrefix(message);
		return message.channel.send(prefix ? `My prefix in this guild is: \`${prefix}\`` : 'Cannot find any Prefix for Message Commands.');
	}
}
