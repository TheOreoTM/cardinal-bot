import { CardinalEmbedBuilder } from '#lib/structures';
import type { CardinalEvents } from '#lib/types';
import { seconds } from '#utils/common';
import { sendTemporaryMessage } from '#utils/functions';
import type { MessageCommandDeniedPayload } from '@sapphire/framework';
import { Listener, type UserError } from '@sapphire/framework';

export class UserEvent extends Listener<typeof CardinalEvents.MessageCommandDenied> {
	public async run({ context, message: content }: UserError, { message }: MessageCommandDeniedPayload) {
		// `context: { silent: true }` should make UserError silent:
		// Use cases for this are for example permissions error when running the `eval` command.
		if (Reflect.get(Object(context), 'silent')) return;
		const embed = new CardinalEmbedBuilder().setStyle('fail').setDescription(content);
		sendTemporaryMessage(message, { embeds: [embed], allowedMentions: { users: [message.author.id], roles: [] } }, seconds(7));
	}
}
