import { CardinalSubcommand, PermissionsPrecondition } from '#lib/structures';
import type { InteractionOrMessage, InteractionOrMessageCommand } from '#lib/types';
import { isModerator } from '#utils/functions';

export class UserPermissionsPrecondition extends PermissionsPrecondition {
	public override async handle(
		iom: InteractionOrMessage,
		command: InteractionOrMessageCommand | CardinalSubcommand
	): PermissionsPrecondition.AsyncResult {
		// TODO: Change this to non-async after changing the function
		if (!iom.guild || !iom.member) return this.error();

		const allowed =
			(await isModerator(iom.member)) ||
			(await iom.guild.settings.restrictions.checkMemberAllowed(command.name, iom.member.id)) ||
			(await iom.guild.settings.restrictions.checkRoleAllowed(command.name, iom.member.roles.cache));

		return allowed
			? this.ok()
			: this.error({
					identifier: `staffError`,
					message: `This command is only for moderators`
			  });
	}
}
