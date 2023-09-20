import { type CardinalCommand } from '#lib/structures';
import type { InteractionOrMessage, InteractionOrMessageCommand } from '#lib/types';
import { isTrainee } from '#utils/functions';
import { Precondition, type MessageCommand, type ChatInputCommand, type ContextMenuCommand } from '@sapphire/framework';

export class UserPrecondition extends Precondition {
	public override async messageRun(message: CardinalCommand.Message, command: MessageCommand) {
		return await this.check(message, command);
	}

	public override async chatInputRun(interaction: CardinalCommand.ChatInputCommandInteraction, command: ChatInputCommand) {
		return await this.check(interaction, command);
	}

	public override async contextMenuRun(interaction: CardinalCommand.ContextMenuCommandInteraction, command: ContextMenuCommand) {
		return await this.check(interaction, command);
	}

	async check(interactionOrMessage: InteractionOrMessage, command: InteractionOrMessageCommand) {
		command; // unused
		const member = interactionOrMessage.member;
		if (!member || !interactionOrMessage.guild)
			return this.error({
				identifier: 'ModCommand',
				message: 'You are not allowed to use this command'
			});

		// const allowed =
		// 	(await interactionOrMessage.guild.settings.restrictions.checkMemberAllowed(command.name, interactionOrMessage.member.id)) ||
		// 	(await interactionOrMessage.guild.settings.restrictions.checkRoleAllowed(command.name, interactionOrMessage.member.roles.cache));

		// if (allowed) return this.ok();

		const staffAllowed = await isTrainee(member);
		const restrictionAllowed =
			(await interactionOrMessage.guild.settings.restrictions.checkMemberAllowed(command.name, member.id)) ||
			interactionOrMessage.guild.settings.restrictions.checkChannelAllowed(command.name, interactionOrMessage.channel!.id) ||
			(await interactionOrMessage.guild.settings.restrictions.checkRoleAllowed(command.name, member.roles.cache));

		const valid = staffAllowed || restrictionAllowed;

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
