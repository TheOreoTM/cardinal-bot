import { GiveawayManager } from '#lib/structures';
import { seconds } from '#utils/common';
import { ApplyOptions } from '@sapphire/decorators';
import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';

@ApplyOptions<ScheduledTask.Options>({
	interval: seconds(5),
	enabled: true
})
export class GiveawayExpireTask extends ScheduledTask {
	public override async run() {
		const now = new Date();
		const giveaways = await this.container.db.giveaway.findMany({
			where: {
				expiresAt: {
					lte: now
				},
				expired: false
			}
		});

		await this.container.db.giveaway.updateMany({
			where: {
				expiresAt: {
					lte: now
				}
			},
			data: {
				expired: true
			}
		});

		giveaways.forEach(async (giveaway) => {
			const gw = GiveawayManager.fromDatabase(giveaway);
			await gw.end();
		});
	}
}
