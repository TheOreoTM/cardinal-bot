import { Argument, type ArgumentContext } from '@sapphire/framework';
import { Duration } from '@sapphire/time-utilities';

export class UserArgument extends Argument<Duration> {
	public async run(parameter: string, context: ArgumentContext) {
		const duration = new Duration(parameter);
		if (!isNaN(duration.offset) && duration.fromNow.getTime() > Date.now()) return this.ok(duration);
		return this.error({ parameter, identifier: `InvalidDuration`, message: 'Please prodive a valid duration', context });
	}
}
