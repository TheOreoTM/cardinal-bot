import { CardinalEmbedBuilder } from '#lib/structures';
import type { CardinalEvents } from '#lib/types';
import { seconds } from '#utils/common';
import { sendTemporaryMessage } from '#utils/functions';
import type { MessageCommandDeniedPayload } from '@sapphire/framework';
import { Identifiers, Listener, type UserError } from '@sapphire/framework';
import ms from 'enhanced-ms';

const cooldownMessageCooldown = new Set();

export class UserEvent extends Listener<typeof CardinalEvents.MessageCommandDenied> {
	public async run({ context, message: content, identifier }: UserError, { message }: MessageCommandDeniedPayload) {
		// `context: { silent: true }` should make UserError silent:
		// Use cases for this are for example permissions error when running the `eval` command.
		if (Reflect.get(Object(context), 'silent')) return;
		if (identifier === Identifiers.PreconditionCooldown) {
			let send = !cooldownMessageCooldown.has(message.author.id);
			const { remaining } = context as { remaining: number };

			if (send) {
				cooldownMessageCooldown.add(message.author.id);
				await sendTemporaryMessage(
					message,
					{
						content: `${message.author}, a little too quick there. Wait ${ms(remaining) ?? '1 second'}`
					},
					seconds(7)
				);

				setTimeout(() => cooldownMessageCooldown.delete(message.author.id), seconds(5));
			}
		}
		const embed = new CardinalEmbedBuilder().setStyle('fail').setDescription(content);
		return sendTemporaryMessage(message, { embeds: [embed], allowedMentions: { users: [message.author.id], roles: [] } }, seconds(7));
	}
}
