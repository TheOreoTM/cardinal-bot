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
					lt: now
				}
			}
		});

		await this.container.db.giveaway.deleteMany({
			where: {
				expiresAt: {
					lt: now
				}
			}
		});

		for (const giveaway of giveaways) {
			console.log(giveaway);
			const gw = GiveawayManager.fromDatabase(giveaway);
			await gw.end();
		}
	}
}
