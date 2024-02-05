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
		const users = this.container.client.guilds.cache.reduce((acc, val) => acc + (val.memberCount ?? 0), 0);

		this.container.client.analytics.updateChannelCount();
		this.container.client.analytics.updateGuildCount();
		this.container.client.analytics.updateUserCount(users);
		this.container.client.analytics.updateGatewayPing();

		const allMsgs = await this.container.db.message.count();
		this.container.client.analytics.updateTrackedMessageCount(allMsgs);
	}
}
