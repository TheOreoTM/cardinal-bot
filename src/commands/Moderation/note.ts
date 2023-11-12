import { CardinalEmbedBuilder, CardinalIndexBuilder, ModerationCommand } from '#lib/structures';
import type { GuildMessage, InteractionOrMessage } from '#lib/types';
import { sendInteractionOrMessage } from '#utils/functions';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { GuildMember } from 'discord.js';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Add a note for a user',
	name: 'note',
	detailedDescription: {
		extendedHelp: 'Add a note for a user that can be viewed by any staff member'
	}
})
export class NoteCommand extends ModerationCommand {
	public registerApplicationCommands(registry: ModerationCommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addUserOption((option) => option.setName('membe').setDescription('The member you want to add the note for').setRequired(true))
				.addStringOption((option) => option.setName('note').setDescription('The note you want to add').setRequired(true))
		);
	}

	public async messageRun(message: GuildMessage, args: Args) {
		const target = await args.pick('member').catch(() => null);
		if (!target) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid member')]
			});
		}
		const note = await args.rest('string').catch(() => null);
		if (!note || note.length === 0) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid note')]
			});
		}

		return this.addNote(message, note, target, message.member);
	}

	public async chatInputRun(interaction: ModerationCommand.ChatInputCommandInteraction) {
		const target = interaction.options.getMember('member');
		const note = interaction.options.getString('note', true);

		if (!target) {
			return interaction.reply({
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid member')]
			});
		}
		return this.addNote(interaction, note, target, interaction.member);
	}

	private async addNote(interactionOrMessage: InteractionOrMessage, note: string, target: GuildMember, staff: GuildMember) {
		await this.container.db.note.create({
			data: {
				guildId: staff.guild.id,
				note,
				staffId: staff.id,
				staffName: staff.user.username,
				userId: target.id,
				noteId: await CardinalIndexBuilder.noteId(target.id, target.guild.id)
			}
		});

		return await sendInteractionOrMessage(interactionOrMessage, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Added note for ${getTag(target.user)}`)]
		});
	}
}
