import { CardinalEmbedBuilder } from '#lib/structures';
import { CardinalEvents } from '#lib/types';
import { formatRoles } from '#utils/formatters';
import { sendTemporaryMessage } from '#utils/functions';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener, type MessageCommandErrorPayload, UserError } from '@sapphire/framework';
import ms from 'enhanced-ms';

@ApplyOptions<Listener.Options>({
	event: CardinalEvents.MessageSubcommandError
})
export class UserListener extends Listener {
	public override async run(error: UserError, { message }: MessageCommandErrorPayload) {
		let content: string = '';
		if (error instanceof UserError) {
			if (Reflect.get(Object(error.context), 'silent')) return;

			if (error.identifier === 'preconditionCooldown') {
				const { remaining } = error.context as { remaining: number };
				return await sendTemporaryMessage(message, {
					content: `${message.author}, a little too quick there. Wait ${ms(remaining)}`
				});
			}
			if (error.identifier === 'preconditionUserPermissions') {
				const { missing } = error.context as { missing: [] };
				content = `You need \`${formatRoles(missing).join('` `')}\` permission${missing.length - 1 === 0 ? '' : '(s)'} to run this command`;
			}

			await sendTemporaryMessage(message, {
				embeds: [
					new CardinalEmbedBuilder()
						.setDescription(content.length === 0 ? error.message : content)
						.setTitle(error.identifier)
						.setStyle('fail')
				]
			});
		}
		return undefined;
	}
}
