import { CardinalEmbedBuilder, CardinalPaginatedMessageEmbedFields, ModerationCommand, Timestamp } from '#lib/structures';
import { sendInteractionOrMessage } from '#utils/functions';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import type { GuildMember } from 'discord.js';

@ApplyOptions<ModerationCommand.Options>({
	description: 'View notes of a user',
	name: 'notes',
	detailedDescription: {
		extendedHelp: 'View all the notes of a user that the staff team have given',
		usages: ['User', 'User Page'],
		examples: ['@theoreotm 2', '@thekiro']
	}
})
export class notesCommand extends ModerationCommand {
	public registerApplicationCommands(registry: ModerationCommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addUserOption((option) => option.setName('member').setDescription('The member you want to view the notes for').setRequired(true))
				.addNumberOption((option) => option.setName('page').setDescription('The page you want to view'))
		);
	}

	public async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const target = await args.pick('member').catch(() => null);
		if (!target) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid member')]
			});
		}
		const page = await args.pick('number').catch(() => 1);

		return this.viewNotes(message, target, page);
	}

	public async chatInputRun(interaction: ModerationCommand.ChatInputCommandInteraction) {
		const target = interaction.options.getMember('member');
		if (!target) {
			return interaction.reply({
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid member')]
			});
		}
		const page = interaction.options.getNumber('page', false);

		return this.viewNotes(interaction, target, page ?? 1);
	}

	private async viewNotes(
		interactionOrMessage: ModerationCommand.Message | ModerationCommand.ChatInputCommandInteraction,
		target: GuildMember,
		page = 1
	) {
		const notes = await this.container.db.note.findMany({
			where: {
				guildId: target.guild.id,
				userId: target.id
			}
		});

		console.log(notes);
		if (!notes || notes.length === 0) {
			return sendInteractionOrMessage(interactionOrMessage, {
				embeds: [new CardinalEmbedBuilder().setStyle('info').setDescription('No notes')]
			});
		}

		const itemsPerPage = 10; // Number of items per page
		const pages = Math.ceil(notes.length / itemsPerPage);
		const embeds = [];

		for (let i = 0; i < pages; i++) {
			const startIndex = i * itemsPerPage;
			const endIndex = Math.min(startIndex + itemsPerPage, notes.length);
			const embed = new CardinalEmbedBuilder()
				.setStyle('default')
				.setTitle(`${notes.length} Notes`)
				.setAuthor({ iconURL: target.displayAvatarURL(), name: `Notes for ${getTag(target.user)} (${target.id})` });

			console.log(startIndex, endIndex);
			for (let j = startIndex; j < endIndex; j++) {
				const note = notes[j];
				const formatter = new Timestamp(note.createdAt.getTime());
				embed.addFields({
					name: `Note: ${note.noteId} | Moderator: ${note.staffName}`,
					value: `${note.note} - ${formatter.getLongDateTime()}`
				});
			}

			embeds.push(embed);
		}

		const display = new CardinalPaginatedMessageEmbedFields();
		display.setIndex(page);

		embeds.forEach((embed) => {
			display.addPageEmbed(embed);
		});

		display.pageIndexPrefix = 'Page';

		return display.run(interactionOrMessage);
	}
}
