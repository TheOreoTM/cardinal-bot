import { Precondition } from '@sapphire/framework';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { GuildContextMenuInteraction, GuildMessage } from '#lib/types';
import { isOwner } from '#utils/functions';

export class UserPrecondition extends Precondition {
	public override messageRun(message: GuildMessage) {
		return isOwner(message.member) ? this.ok() : this.error({ context: { silent: true } });
	}

	public override chatInputRun(interaction: ChatInputCommandInteraction<'cached'>) {
		return isOwner(interaction.member) ? this.ok() : this.error({ context: { silent: true } });
	}

	public override contextMenuRun(interaction: GuildContextMenuInteraction) {
		return isOwner(interaction.member) ? this.ok() : this.error({ context: { silent: true } });
	}
}
