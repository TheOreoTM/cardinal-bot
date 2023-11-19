import { CardinalEvents } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import type { GuildMember } from 'discord.js';

@ApplyOptions<Listener.Options>({ event: CardinalEvents.GuildMemberRemove })
export class UserEvent extends Listener<typeof CardinalEvents.GuildMemberRemove> {
	public override async run(member: GuildMember) {
		await this.container.db.memberActivity.create({
			data: {
				userId: member.id,
				action: 'LEAVE',
				guildId: member.guild.id
			}
		});
	}
}
