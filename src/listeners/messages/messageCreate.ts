import { CardinalEvents } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<Listener.Options>({
	event: CardinalEvents.MessageCreate
})
export class UserEvent extends Listener {
	public override run(message: Message) {
		// If the message was sent by a webhook, return:
		if (message.webhookId !== null) return;

		// If the message was sent by the system, return:
		if (message.system) return;

		// If the message was sent by a bot, return:
		if (message.author.bot) return;

		// Emit UserMessage
		this.container.client.emit(CardinalEvents.UserMessage, message);
	}
}
