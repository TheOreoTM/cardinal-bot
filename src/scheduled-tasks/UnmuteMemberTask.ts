import { CardinalIndexBuilder, Modlog } from '#lib/structures';
import { ModerationType } from '#utils/moderationConstants';
import { getGuild, getMember } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';

export interface UnmuteMemberTaskPaylod {
	muteId: number;
}

@ApplyOptions<ScheduledTask.Options>({
	name: 'UnmuteMemberTask',
	enabled: true,
	bullJobsOptions: {
		removeOnComplete: true
	}
})
export class UnmuteMemberTask extends ScheduledTask {
	public async run(payload: UnmuteMemberTaskPaylod) {
		this.container.logger.info('[UnmuteMemberTask] Started');
		const mute = await this.container.db.mute.findUnique({
			where: {
				id: payload.muteId
			},
			select: {
				modlog: true,
				removedRoles: true
			}
		});

		this.container.db.mute.deleteMany({
			where: { id: payload.muteId }
		});

		if (!mute) {
			return console.log('no mute', payload.muteId);
		}

		const guild = await getGuild(mute.modlog.guildId);
		if (!guild) return this.container.logger.warn('[UnmuteMemberTask] Returned bc no guild');
		const muteRole =
			guild.roles.cache.get(await guild.settings.roles.mute()) ?? guild.roles.cache.find((role) => role.name.toLowerCase() == 'muted');
		if (!muteRole) return this.container.logger.warn('[UnmuteMemberTask] Returned bc no muterole');
		const member = await getMember(guild, mute.modlog.memberId);
		if (!member) return this.container.logger.warn('[UnmuteMemberTask] Returned bc no member');
		const staff = guild.members.me ?? (await guild.members.fetchMe());

		this.container.logger.info('[UnmuteMemberTask] Removed roles expire mute:', mute.removedRoles);
		await member.roles.set(mute.removedRoles);

		const modlog = new Modlog({
			member,
			staff,
			type: ModerationType.Unmute,
			reason: 'Mute expired',
			caseId: await new CardinalIndexBuilder().modlogId(member.guild.id)
		});
		await modlog.createUnmute();
	}
}

declare module '@sapphire/plugin-scheduled-tasks' {
	interface ScheduledTasks {
		UnmuteMemberTask: never;
	}
}
