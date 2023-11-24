import { InfractionManager } from '#lib/structures/classes/InfractionManager';
import type { AutomodRule } from '#lib/types/Data';
import { ApplyOptions } from '@sapphire/decorators';
import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import type { Snowflake } from 'discord.js';

interface RemoveInfractionTaskPaylod {
	// number of ms to expire
	userId: Snowflake;
	amount: number;
	rule: AutomodRule;
	duration: number;
}

@ApplyOptions<ScheduledTask.Options>({
	name: 'RemoveInfractionTask',
	customJobOptions: { removeOnComplete: true }
})
export class RemoveInfractionTask extends ScheduledTask {
	public async run(payload: RemoveInfractionTaskPaylod) {
		const instance = InfractionManager.getInstance();
		instance.removeHeat(payload.userId, payload.rule, payload.amount);
	}
}
