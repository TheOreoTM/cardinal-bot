import { Listener, type ContextMenuCommandSuccessPayload } from '@sapphire/framework';
import { logSuccessCommand } from '#utils/utils';

export class UserListener extends Listener {
	public async run(payload: ContextMenuCommandSuccessPayload) {
		logSuccessCommand(payload);

		await this.container.db.command.create({
			data: {
				authorId: payload.interaction.user.id,
				name: payload.command.name
			}
		});
	}
}
