import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { CardinalEvents } from '#lib/types';
import type { GuildMember, Role } from 'discord.js';
import type { Nullish } from '@sapphire/utilities';

@ApplyOptions<Listener.Options>({
	event: CardinalEvents.GuildMemberAdd
})
export class UserEvent extends Listener<typeof CardinalEvents.GuildMemberAdd> {
	public override async run(member: GuildMember) {
		const result = await this.container.db.mute.findMany({
			where: {
				modlog: { guildId: member.guild.id, memberId: member.id }
			}
		});

		if (result.length) {
			let muteRole: Role | Nullish;
			const muteRoleId = await member.guild.settings.roles.mute();
			if (muteRoleId) {
				muteRole = member.roles.cache.get(muteRoleId) ?? (await member.guild.roles.fetch(muteRoleId));
			} else {
				muteRole = member.guild.roles.cache.find((r) => r.name.toLowerCase() === 'muted');
			}

			if (!muteRole) return;

			await member.roles.add(muteRole, 'Mute bypass');
		}
	}
}
