import { CardinalEmbedBuilder, ModerationCommand } from '#lib/structures';
import { ModerationType } from '#utils/moderationConstants';
import { getTag } from '#utils/utils';
import type { Modlog } from '@prisma/client';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<ModerationCommand.Options>({
	description: 'View statistics about a moderator',
	name: 'modstats',
	aliases: ['ms'],
	detailedDescription: {
		extendedHelp: 'View how many times a moderator has banned, warned and muted a member in the past week, month and lifetime ',
		usages: ['User', ''],
		examples: ['@Oreo', '']
	}
})
export class modstatsCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const target = await args.pick('member').catch(() => message.member);

		const guild = message.guild;

		const now = new Date();

		const oneWeek = new Date(now);
		oneWeek.setDate(now.getDate() - 7);

		const oneMonth = new Date(now);
		oneMonth.setDate(now.getDate() - 30);

		const modlogsPastWeek = await this.container.db.modlog.findMany({
			where: {
				staffId: target.id,
				guildId: guild.id,
				createdAt: {
					gte: oneWeek
				}
			}
		});

		const modlogsPastMonth = await this.container.db.modlog.findMany({
			where: {
				staffId: target.id,
				guildId: guild.id,
				createdAt: {
					gte: oneMonth
				}
			}
		});

		const modlogsAll = await this.container.db.modlog.findMany({
			where: {
				staffId: target.id,
				guildId: guild.id
			}
		});

		const warnsPastWeek = filterByType(modlogsPastWeek, ModerationType.Warn).length.toLocaleString();
		const warnsPastMonth = filterByType(modlogsPastMonth, ModerationType.Warn).length.toLocaleString();
		const warnsAlltime = filterByType(modlogsAll, ModerationType.Warn).length.toLocaleString();

		const mutesPastWeek = filterByType(modlogsPastWeek, ModerationType.Mute).length.toLocaleString();
		const mutesPastMonth = filterByType(modlogsPastMonth, ModerationType.Mute).length.toLocaleString();
		const mutesAlltime = filterByType(modlogsAll, ModerationType.Mute).length.toLocaleString();

		const kicksPastWeek = filterByType(modlogsPastWeek, ModerationType.Kick).length.toLocaleString();
		const kicksPastMonth = filterByType(modlogsPastMonth, ModerationType.Kick).length.toLocaleString();
		const kicksAlltime = filterByType(modlogsAll, ModerationType.Kick).length.toLocaleString();

		const bansPastWeek = filterByType(modlogsPastWeek, ModerationType.Ban).length.toLocaleString();
		const bansPastMonth = filterByType(modlogsPastMonth, ModerationType.Ban).length.toLocaleString();
		const bansAlltime = filterByType(modlogsAll, ModerationType.Ban).length.toLocaleString();

		const embed = new CardinalEmbedBuilder()
			.setStyle('default')
			.setAuthor({ name: getTag(target.user), iconURL: target.displayAvatarURL({ forceStatic: true }) })
			.setTitle('Moderation Statistics');

		embed.addFields(
			{
				name: 'Mutes (past 7 days)',
				value: mutesPastWeek,
				inline: true
			},
			{
				name: 'Mutes (past 30 days)',
				value: mutesPastMonth,
				inline: true
			},
			{
				name: 'Mutes (all time)',
				value: mutesAlltime,
				inline: true
			}
		);

		embed.addFields(
			{
				name: 'Bans (past 7 days)',
				value: bansPastWeek,
				inline: true
			},
			{
				name: 'Bans (past 30 days)',
				value: bansPastMonth,
				inline: true
			},
			{
				name: 'Bans (all time)',
				value: bansAlltime,
				inline: true
			}
		);

		embed.addFields(
			{
				name: 'Kicks (past 7 days)',
				value: kicksPastWeek,
				inline: true
			},
			{
				name: 'Kicks (past 30 days)',
				value: kicksPastMonth,
				inline: true
			},
			{
				name: 'Kicks (all time)',
				value: kicksAlltime,
				inline: true
			}
		);

		embed.addFields(
			{
				name: 'Warns (past 7 days)',
				value: warnsPastWeek,
				inline: true
			},
			{
				name: 'Warns (past 30 days)',
				value: warnsPastMonth,
				inline: true
			},
			{
				name: 'Warns (all time)',
				value: warnsAlltime,
				inline: true
			}
		);

		embed.addFields(
			{
				name: 'Total (past 7 days)',
				value: modlogsPastWeek.length.toLocaleString(),
				inline: true
			},
			{
				name: 'Total (past 30 days)',
				value: modlogsPastMonth.length.toLocaleString(),
				inline: true
			},
			{
				name: 'Total (all time)',
				value: modlogsAll.length.toLocaleString(),
				inline: true
			}
		);

		return send(message, {
			embeds: [embed]
		});
	}
}

function filterByType(modlogs: Modlog[], targetType: ModerationType) {
	return modlogs.filter((modlog) => modlog.type === targetType);
}
