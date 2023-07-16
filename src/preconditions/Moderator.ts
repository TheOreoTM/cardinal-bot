import { PermissionsPrecondition } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { isAdmin, isModerator } from '#utils/functions';

export class UserPermissionsPrecondition extends PermissionsPrecondition {
	public override async handle(message: GuildMessage): PermissionsPrecondition.AsyncResult {
		// TODO: Change this to non-async after changing the function
		const allowed = (await isAdmin(message.member)) || (await isModerator(message.member));

		return allowed
			? this.ok()
			: this.error({
					identifier: `staffError`,
					message: `This command is only for moderators`
			  });
	}
}
