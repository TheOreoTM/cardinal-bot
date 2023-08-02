import { Listener, LogLevel, type ContextMenuCommandSuccessPayload } from '@sapphire/framework';
import type { Logger } from '@sapphire/plugin-logger';
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

	public onLoad() {
		this.enabled = (this.container.logger as Logger).level <= LogLevel.Debug;
		return super.onLoad();
	}
}
