import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';

export class ManualTask extends ScheduledTask {
	public constructor(context: ScheduledTask.Context, options: ScheduledTask.Options) {
		super(context, options);
	}

	public async run(payload: unknown) {
		this.container.logger.info('I ran!', payload);
	}
}

declare module '@sapphire/plugin-scheduled-tasks' {
	interface ScheduledTasks {
		manual: never;
	}
}
