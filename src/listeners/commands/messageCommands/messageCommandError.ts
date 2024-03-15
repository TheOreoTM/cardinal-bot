import { CardinalEvents } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener, type MessageCommandErrorPayload, UserError } from '@sapphire/framework';
import { handleCommandError } from '../_shared.js';

@ApplyOptions<Listener.Options>({
	event: CardinalEvents.MessageCommandError
})
export class UserListener extends Listener {
	public override async run(error: UserError, payload: MessageCommandErrorPayload) {
		handleCommandError(error, payload);
	}
}
