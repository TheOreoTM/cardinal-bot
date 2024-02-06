import { logSuccessCommand } from '#utils/utils';
import { Listener, type ChatInputCommandSuccessPayload } from '@sapphire/framework';

export class UserListener extends Listener {
	public async run(payload: ChatInputCommandSuccessPayload) {
		logSuccessCommand(payload);

		await this.container.db.command.create({
			data: {
				authorId: payload.interaction.user.id,
				name: payload.command.name
			}
		});
	}
}
