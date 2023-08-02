import { Modlog } from '#lib/structures';
import { seconds } from '#utils/common';
import { ModerationType } from '#utils/moderationConstants';
import { ApplyOptions } from '@sapphire/decorators';
import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';

@ApplyOptions<ScheduledTask.Options>({
	interval: seconds(5)
})
export class ExpireBanTask extends ScheduledTask {
	public override async run() {
		const { ban } = this.container.db;
		const now = new Date();
		const bans = await ban.findMany({
			where: {
				expiresAt: {
					lt: now,
					not: null
				}
			},
			select: { modlog: true, id: true }
		});

		bans.forEach(async (mute) => {
			await this.container.db.ban.delete({
				where: { id: mute.id }
			});
			const guild = this.container.client.guilds.cache.get(mute.modlog.guildId);
			if (!guild) return;
			let member = this.container.client.users.cache.get(mute.modlog.memberId);
			if (!member) member = await this.container.client.users.fetch(mute.modlog.memberId);
			const staff = guild.members.me ?? (await guild.members.fetchMe());

			await guild.bans.remove(member.id).catch(() => {
				return;
			});

			const modlog = new Modlog({ member, staff, type: ModerationType.Unban, reason: 'Ban expired' });
			await modlog.createUnban();
		});
	}
}
