import { CardinalEvents } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';

@ApplyOptions<Listener.Options>({ event: CardinalEvents.MessageCreate })
export class UserAnalyticsEvent extends Listener {
	public run(): void {
		this.container.client.analytics.addMessage();
	}
}
