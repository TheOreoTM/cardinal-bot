import { CardinalEmbedBuilder, CardinalPaginatedMessageEmbedFields, ModerationCommand, Timestamp } from '#lib/structures';
import { CardinalColors } from '#utils/constants';
import { capitalizeWords } from '#utils/formatters';
import { ModerationType } from '#utils/moderationConstants';
import { getTag } from '#utils/utils';
import type { Prisma } from '@prisma/client';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import { GuildMember } from 'discord.js';

@ApplyOptions<ModerationCommand.Options>({
	description: 'View modlogs of a user',
	name: 'modlogs',
	aliases: ['ml', 'modlog'],
	flags: ['warns', 'bans', 'modnicks', 'afk', 'mutes', 'kick', 'serious'],
	detailedDescription: {
		extendedHelp: 'View all the actions a moderator has performed on a user (modnicks, warns, mutes, bans, etc)',
		usages: ['', 'User', 'User Flags'],
		examples: ['', '@Oreo', '@clink --warns --mutes', '@shane --serious'],
		explainedUsage: [
			['Flags', 'There are 7 flags that you can use to filter the modlogs, they are listed below.'],
			['--warns', 'Will show warns and unwarns in the modlog list'],
			['--bans', 'Will show bans and unban in the modlog list'],
			['--kicks', 'Will show kicks in the modlog list'],
			['--mutes', 'Will show mutes and unmutes in the modlog list'],
			['--modnicks', 'Will show modnicks in the modlog list'],
			['--afk', 'Will show afkclears and afkresets in the modlog list'],
			['--serious', 'Equivalent to running "--warns --kicks --mutes --bans"']
		]
	}
})
export class modlogCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		let includeBans = args.getFlags('bans');
		let includeWarns = args.getFlags('warns');
		let includeMutes = args.getFlags('mutes');
		let includeKicks = args.getFlags('kicks');
		const includeAfk = args.getFlags('afk');
		const includeModnicks = args.getFlags('modnicks');
		const includeSerious = args.getFlags('serious');

		if (includeSerious) {
			includeBans = true;
			includeWarns = true;
			includeMutes = true;
			includeKicks = true;
		}

		const anyFilter = args.getFlags('mutes', 'bans', 'warns', 'modnicks', 'afk', 'kicks', 'serious');

		const filter: ModerationType[] = [];

		if (includeBans) filter.push(ModerationType.Ban, ModerationType.Unban);
		if (includeWarns) filter.push(ModerationType.Warn, ModerationType.Unwarn);
		if (includeMutes) filter.push(ModerationType.Mute, ModerationType.Unmute);
		if (includeKicks) filter.push(ModerationType.Kick);
		if (includeAfk) filter.push(ModerationType.AfkClear, ModerationType.AfkReset);
		if (includeModnicks) filter.push(ModerationType.Modnick);

		const targetArg = await args.pick('member').catch(() => args.pick('user').catch(() => null));

		if (!targetArg) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`Provide a valid user`)]
			});
		}

		const target = targetArg instanceof GuildMember ? targetArg.user : targetArg;

		const where: Prisma.ModlogWhereInput = {
			memberId: target.id,
			guildId: message.guild.id
		};

		if (anyFilter) {
			where.type = { in: filter };
		}

		const modlogs = await this.container.db.modlog.findMany({
			where: where,
			orderBy: {
				id: 'desc'
			}
		});

		const totalLogs = modlogs.length;

		if (totalLogs === 0) {
			return await send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('info').setDescription('There are no modlogs')]
			});
		}

		const pageSize = 10;
		const totalPages = Math.ceil(totalLogs / pageSize);

		const pageEmbed = new CardinalPaginatedMessageEmbedFields();

		for (let p = 0; p < totalPages; p++) {
			const embed = new CardinalEmbedBuilder().setColor(CardinalColors.Default);

			embed.setAuthor({
				name: `${totalLogs} Modlogs for ${getTag(target)} (${target.id})`,
				iconURL: target.displayAvatarURL({ forceStatic: true })
			});

			const start = p * pageSize;
			const page = modlogs.slice(start, start + pageSize);

			for (const log of page) {
				const field = [
					`**Type:** ${capitalizeWords(log.type)}`,
					`**User:** <@${log.memberId}> (${log.memberName})`,
					`**Moderator:** <@${log.staffId}> (${log.staffName})`
				];

				log.length
					? field.push(
							`**Length:** ${log.length}`,
							`**Reason:** ${log.reason} - ${new Timestamp(log.createdAt.getTime()).getLongDateTime()}`
					  )
					: field.push(`**Reason:** ${log.reason} - ${new Timestamp(log.createdAt.getTime()).getLongDateTime()}`);

				embed.addFields({
					name: `Case ${log.caseId}`,
					value: field.join('\n')
				});
			}

			pageEmbed.addPageEmbed(embed);
		}

		return await pageEmbed.run(message);
	}
}
