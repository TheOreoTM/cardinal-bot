import type { CardinalCommand } from '#lib/structures';
import { CardinalEvents } from '#lib/types';
import { setCommand } from '#utils/functions';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener, type ListenerOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<ListenerOptions>({ event: CardinalEvents.MessageCommandRun })
export class UserListener extends Listener<typeof CardinalEvents.MessageCommandRun> {
	public run(message: Message, command: CardinalCommand) {
		setCommand(message, command);
	}
}
