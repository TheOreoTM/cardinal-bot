import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { CardinalEvents } from '#lib/types';
import type { Message } from 'discord.js';
import { markMessageAsDeleted } from '#utils/functions';

@ApplyOptions<Listener.Options>({
	event: CardinalEvents.MessageDelete
})
export class UserEvent extends Listener<typeof CardinalEvents.MessageDelete> {
	public override run(message: Message) {
		markMessageAsDeleted(message);
	}
}
