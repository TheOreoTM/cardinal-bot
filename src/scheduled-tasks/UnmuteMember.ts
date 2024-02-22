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
	customJobOptions: {
		removeOnComplete: true,
		removeOnFail: true
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
				removedRoles: true,
				id: true
			}
		});

		if (!mute) {
			this.container.logger.error('No mute found in database', payload.muteId);
			return;
		}

		const guild = await getGuild(mute.modlog.guildId);
		if (!guild) {
			this.container.logger.warn('[UnmuteMemberTask] Returned bc no guild');
			return;
		}

		const muteRole =
			guild.roles.cache.get(await guild.settings.roles.mute()) ?? guild.roles.cache.find((role) => role.name.toLowerCase() == 'muted');
		if (!muteRole) {
			this.container.logger.warn('[UnmuteMemberTask] Returned bc no muterole');
			return;
		}

		const member = await getMember(guild, mute.modlog.memberId);
		if (!member) {
			this.container.logger.warn('[UnmuteMemberTask] Returned bc no member');
			return;
		}

		const staff = guild.members.me ?? (await guild.members.fetchMe());

		await member.roles.add(mute.removedRoles).catch(() => null);
		await member.roles.remove(muteRole.id).catch(() => null);

		const modlog = new Modlog({
			member,
			staff,
			type: ModerationType.Unmute,
			reason: 'Mute expired',
			caseId: await CardinalIndexBuilder.modlogId(member.guild.id)
		});

		await modlog.createUnmute();
	}
}
