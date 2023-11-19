import { CardinalEvents } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import type { GuildMember } from 'discord.js';

@ApplyOptions<Listener.Options>({ event: CardinalEvents.GuildMemberAdd })
export class UserEvent extends Listener<typeof CardinalEvents.GuildMemberAdd> {
	public override async run(member: GuildMember) {
		await this.container.db.memberActivity.create({
			data: {
				userId: member.id,
				action: 'JOIN',
				guildId: member.guild.id
			}
		});
	}
}
