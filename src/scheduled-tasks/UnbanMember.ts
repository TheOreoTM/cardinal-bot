import { CardinalIndexBuilder, Modlog } from '#lib/structures';
import { ModerationType } from '#utils/moderationConstants';
import { getGuild } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';

interface UnbanMemberTaskPaylod {
	banId: number;
}

@ApplyOptions<ScheduledTask.Options>({
	name: 'UnbanMemberTask',
	customJobOptions: {
		removeOnComplete: true
	}
})
export class UnbanMemberTask extends ScheduledTask {
	public async run(payload: UnbanMemberTaskPaylod) {
		this.container.logger.info('[UnbanMemberTask] Started');
		const ban = await this.container.db.ban.findUnique({
			where: {
				id: payload.banId
			},
			select: {
				modlog: true
			}
		});

		if (!ban) {
			console.log('no ban', payload);
			return;
		}

		await this.container.db.ban.delete({
			where: { id: payload.banId }
		});

		const guild = await getGuild(ban.modlog.guildId);
		if (!guild) return;
		let member = this.container.client.users.cache.get(ban.modlog.memberId);
		if (!member) member = await this.container.client.users.fetch(ban.modlog.memberId);
		const staff = guild.members.me ?? (await guild.members.fetchMe());

		await guild.bans.remove(member.id).catch(() => {
			return;
		});

		const modlog = new Modlog({
			member,
			staff,
			type: ModerationType.Unban,
			reason: 'Ban expired',
			caseId: await new CardinalIndexBuilder().modlogId(ban.modlog.guildId)
		});
		await modlog.createUnban();
	}
}
