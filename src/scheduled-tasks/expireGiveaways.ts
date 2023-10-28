import { GiveawayManager } from '#lib/structures';
import { seconds } from '#utils/common';
import { ApplyOptions } from '@sapphire/decorators';
import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';

@ApplyOptions<ScheduledTask.Options>({
	interval: seconds(3),
	enabled: true
})
export class GiveawayExpireTask extends ScheduledTask {
	public override async run() {
		const now = new Date();
		const giveaways = await this.container.db.giveaway.findMany({
			where: {
				expiresAt: {
					lte: now
				}
			}
		});

		await this.container.db.giveaway.deleteMany({
			where: {
				expiresAt: {
					lte: now
				}
			}
		});

		console.log('hi i ran');
		giveaways.forEach(async (giveaway) => {
			const gw = GiveawayManager.fromDatabase(giveaway);
			console.log(giveaway);
			await gw.end();
		});
	}
}
