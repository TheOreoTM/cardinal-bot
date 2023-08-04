import { CardinalEmbedBuilder, CardinalPaginatedMessageEmbedFields, ModerationCommand, Timestamp } from '#lib/structures';
import { CardinalColors } from '#utils/constants';
import { capitalizeWords } from '#utils/formatters';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<ModerationCommand.Options>({
	description: 'View modlogs of a user',
	name: 'modlogs',
	aliases: ['ml', 'modlog'],
	detailedDescription: {
		extendedHelp: 'View all the actions a moderator has performed on a user (modnicks, warns, mutes, bans, etc)',
		usages: ['', 'User'],
		examples: ['', '@Oreo']
	}
})
export class modlogCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const target = await args.pick('user').catch(() => null);

		if (!target) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`Provide a valid user`)]
			});
		}

		const modlogs = await this.container.db.modlog.findMany({
			where: { memberId: target.id, guildId: message.guild.id }
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
				name: `${totalLogs} Modlogs for ${target.username} (${target.id})`,
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
					name: `Case ${log.id}`,
					value: field.join('\n')
				});
			}

			pageEmbed.addPageEmbed(embed);
		}

		pageEmbed.embedFooterSeparator = ' • ';
		pageEmbed.pageIndexPrefix = 'Page';

		return await pageEmbed.run(message);
	}
}
