import { seconds } from '#utils/common';
import { ApplyOptions } from '@sapphire/decorators';
import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';

@ApplyOptions<ScheduledTask.Options>({
	name: 'UpdateAnalyticsTask',
	interval: seconds(30),
	customJobOptions: {
		removeOnComplete: true
	}
})
export class UpdateAnalyticsTask extends ScheduledTask {
	public async run() {
		this.container.client.analytics.updateUserCount();
	}
}
