import type { CardinalCommand } from '#lib/structures';
import type { InteractionOrMessage } from '#lib/types';
import { isTrainee } from '#utils/functions';
import { Precondition } from '@sapphire/framework';

export class UserPrecondition extends Precondition {
	public override async messageRun(message: CardinalCommand.Message) {
		return await this.check(message);
	}

	public override async chatInputRun(interaction: CardinalCommand.ChatInputCommandInteraction) {
		return await this.check(interaction);
	}

	public override async contextMenuRun(interaction: CardinalCommand.ContextMenuCommandInteraction) {
		return await this.check(interaction);
	}

	async check(interactionOrMessage: InteractionOrMessage) {
		const member = interactionOrMessage.member;
		if (!member)
			return this.error({
				identifier: 'ModCommand',
				message: 'You are not allowed to use this command'
			});

		const valid = await isTrainee(member);
		return valid
			? this.ok()
			: this.error({
					identifier: 'ModCommand',
					message: 'You are not allowed to use this command'
			  });
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		ModerationCommand: never;
	}
}
