import { ApplyOptions } from '@sapphire/decorators';
import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';

interface UnlockChannelTaskPaylod {
	guildId: string;
	channelId: string;
}

@ApplyOptions<ScheduledTask.Options>({
	name: 'UnlockChannelTask',
	customJobOptions: { removeOnComplete: true }
})
export class UnlockChannelTask extends ScheduledTask {
	public async run(payload: UnlockChannelTaskPaylod) {
		this.container.logger.info('[UnlockChannelTask] Started');
	}
}

// Add the return type declaration in Augments.d.ts
