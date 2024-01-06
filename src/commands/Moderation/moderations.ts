import { CardinalEmbedBuilder, CardinalPaginatedMessageEmbedFields, ModerationCommand } from '#lib/structures';
import { capitalizeWords } from '#utils/formatters';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import { DurationFormatter } from '@sapphire/time-utilities';

@ApplyOptions<ModerationCommand.Options>({
	description: 'View ongoing moderation actions',
	name: 'moderations',
	detailedDescription: {
		extendedHelp: 'Take a look at the list of all temporary moderation actions that are currently active',
		usages: [''],
		examples: ['']
	}
})
export class moderationsCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message) {
		const prisma = this.container.db;
		const guildId = message.guildId;
		const bans = await prisma.ban.findMany({
			where: { modlog: { guildId }, expiresAt: { not: null } },
			select: { modlog: true, expiresAt: true }
		});
		const mutes = await prisma.mute.findMany({
			where: { modlog: { guildId }, expiresAt: { not: null } },
			select: { modlog: true, expiresAt: true }
		});

		const moderations = [...bans, ...mutes];

		if (!moderations.length) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('info').setDescription('There are no active moderations')]
			});
		}

		const itemsPerPage = 10; // Number of items per page
		const pages = Math.ceil(moderations.length / itemsPerPage);

		const embeds = [];

		for (let i = 0; i < pages; i++) {
			const startIndex = i * itemsPerPage;
			const endIndex = Math.min(startIndex + itemsPerPage, moderations.length);
			const embed = new CardinalEmbedBuilder().setStyle('default').setTitle(`${moderations.length} Active Moderations`);

			const formatter = new DurationFormatter();

			for (let j = startIndex; j < endIndex; j++) {
				const moderation = moderations[j];
				const msTillExpires = new Date(moderation.expiresAt!.getTime() - Date.now());
				embed.addFields({
					name: `${j + 1}. ${moderation.modlog.memberName}`,
					value: `${capitalizeWords(moderation.modlog.type)} | Time Remaining: ${formatter.format(msTillExpires.getTime())}`
				});
			}

			embeds.push(embed);
		}

		const display = new CardinalPaginatedMessageEmbedFields();

		embeds.forEach((embed) => {
			display.addPageEmbed(embed);
		});

		return display.run(message, message.author);
	}
}
