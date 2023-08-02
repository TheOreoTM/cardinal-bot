import type { MessageCommandSuccessPayload } from '@sapphire/framework';
import { Listener, LogLevel } from '@sapphire/framework';
import type { Logger } from '@sapphire/plugin-logger';
import { logSuccessCommand } from '#utils/utils';

export class UserEvent extends Listener {
	public async run(payload: MessageCommandSuccessPayload) {
		logSuccessCommand(payload);

		await this.container.db.command.create({
			data: {
				authorId: payload.message.author.id,
				name: payload.command.name
			}
		});
	}

	public onLoad() {
		this.enabled = (this.container.logger as Logger).level <= LogLevel.Debug;
		return super.onLoad();
	}
}
