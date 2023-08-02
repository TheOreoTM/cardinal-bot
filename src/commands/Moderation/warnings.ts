import { CardinalEmbedBuilder, CardinalPaginatedMessageEmbedFields, ModerationCommand, Timestamp } from '#lib/structures';
import { CardinalColors } from '#utils/constants';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Get warnings for a member',
	name: 'warnings',
	aliases: ['warns'],
	detailedDescription: {
		extendedHelp: 'Get warnings for a member displayed in a paged format',
		usages: ['User', ''],
		examples: ['@Yuuki', ''],
		possibleFormats: [['test2', 'yesy1']]
	}
})
export class warningsCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const target = await args.pick('member').catch(() => message.member);

		const warnings = await this.container.db.warn.findMany({
			where: {
				modlog: {
					guildId: target.guild.id,
					memberId: target.id
				}
			},
			select: {
				warnUid: true,
				modlog: true
			}
		});

		const totalWarns = warnings.length;

		if (totalWarns === 0) {
			return await send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('info').setDescription('There are no warnings')]
			});
		}

		const pageSize = 10;
		const totalPages = Math.ceil(totalWarns / pageSize);

		const pageEmbed = new CardinalPaginatedMessageEmbedFields();

		for (let p = 0; p < totalPages; p++) {
			const embed = new CardinalEmbedBuilder().setColor(CardinalColors.Default);

			embed.setAuthor({
				name: `${totalWarns} Warnings for ${target.user.username} (${target.id})`,
				iconURL: target.displayAvatarURL({ forceStatic: true })
			});

			const start = p * pageSize;
			const page = warnings.slice(start, start + pageSize);

			for (const warn of page) {
				embed.addFields({
					name: `ID: ${warn.warnUid} | Moderator: ${warn.modlog.staffName}`,
					value: [`${warn.modlog.reason} - ${new Timestamp(warn.modlog.createdAt.getTime()).getRelativeTime()}`].join('\n')
				});
			}

			pageEmbed.addPageEmbed(embed);
		}

		pageEmbed.embedFooterSeparator = ' • ';
		pageEmbed.pageIndexPrefix = 'Page';

		return await pageEmbed.run(message);
	}
}
