import { Precondition, type PreconditionResult } from '@sapphire/framework';
import type { ChatInputCommandInteraction, Guild } from 'discord.js';
import type { GuildContextMenuInteraction, GuildMessage } from '#lib/types';

export class UserPrecondition extends Precondition {
	public override messageRun(message: GuildMessage) {
		return this.isCommunity(message.guild);
	}

	public override chatInputRun(interaction: ChatInputCommandInteraction<'cached'>) {
		return this.isCommunity(interaction.guild);
	}

	public override contextMenuRun(interaction: GuildContextMenuInteraction) {
		return this.isCommunity(interaction.guild);
	}

	private isCommunity(guild: Guild): PreconditionResult {
		return guild.features.includes('COMMUNITY')
			? this.ok()
			: this.error({
					message: "This server doesn't look like community server, this command is reserved for community servers!"
			  });
	}
}
