import { PermissionsPrecondition } from '#lib/structures';
import type { GuildMessage } from '#lib/types';

export class UserPermissionsPrecondition extends PermissionsPrecondition {
	public handle(message: GuildMessage): PermissionsPrecondition.Result {
		return message.author.id === message.guild.ownerId
			? this.ok()
			: this.error({
					identifier: `GuildOwner`,
					message: `This command is only for the server owner`
			  });
	}
}
