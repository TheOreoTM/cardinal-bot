import type { MessageCommandSuccessPayload } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';
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

		this.container.client.analytics.commandUsedCount;
	}
}
