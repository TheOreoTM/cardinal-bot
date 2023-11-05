import { GiveawayManager } from '#lib/structures';
import { ApplyOptions } from '@sapphire/decorators';
import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import type { Snowflake } from 'discord.js';

interface EndGiveawayTaskPaylod {
	giveawayMessageId: Snowflake;
}

@ApplyOptions<ScheduledTask.Options>({
	name: 'EndGiveawayTaskTask',
	bullJobsOptions: { removeOnComplete: true }
})
export class EndGiveawayTask extends ScheduledTask {
	public async run(payload: EndGiveawayTaskPaylod) {
		this.container.logger.info('[EndGiveawayTask] Started');
		const giveaway = await this.container.db.giveaway.findUnique({
			where: {
				messageId: payload.giveawayMessageId
			}
		});

		if (!giveaway) {
			return console.log('no giveaway', payload.giveawayMessageId);
		}

		const gw = new GiveawayManager(giveaway);
		await gw.end();
	}
}
