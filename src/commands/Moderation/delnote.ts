import { CardinalEmbedBuilder, ModerationCommand } from '#lib/structures';
import type { InteractionOrMessage } from '#lib/types';
import { sendInteractionOrMessage } from '#utils/functions';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import type { GuildMember } from 'discord.js';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Delete a note',
	name: 'delnote',
	detailedDescription: {
		extendedHelp: 'Delete a note from a user using the noteId',
		usages: ['Member NoteID'],
		explainedUsage: [
			['Member', 'The member you want to delete the note from'],
			['NoteID', 'The ID (number) of the note from the notes embed of the user']
		],
		examples: ['@theoreotm 5']
	}
})
export class delnoteCommand extends ModerationCommand {
	public registerApplicationCommands(registry: ModerationCommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addUserOption((option) => option.setName('member').setDescription('The member you want to delete a note for').setRequired(true))
				.addNumberOption((option) => option.setName('note_id').setDescription('The ID of the note you want to delete').setRequired(true))
		);
	}

	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const target = await args.pick('member').catch(() => null);
		const noteId = await args.pick('number').catch(() => null);

		if (!target) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid member')]
			});
		}

		if (!noteId) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid noteId')]
			});
		}

		return this.delNote(message, target, noteId);
	}

	public async chatInputRun(interaction: ModerationCommand.ChatInputCommandInteraction) {
		const target = interaction.options.getMember('member');
		if (!target) {
			return interaction.reply({
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid member')]
			});
		}
		const noteId = interaction.options.getNumber('note_id', true);

		return this.delNote(interaction, target, noteId);
	}

	private async delNote(interactionOrMessage: InteractionOrMessage, target: GuildMember, noteId: number) {
		const note = await this.container.db.note.delete({
			where: {
				noteId_userId_guildId: {
					guildId: target.guild.id,
					userId: target.id,
					noteId: noteId
				}
			}
		});

		if (!note) {
			return sendInteractionOrMessage(interactionOrMessage, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('That note doesnt exist for that user')]
			});
		}
		return sendInteractionOrMessage(interactionOrMessage, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Deleted note #${noteId} for ${getTag(target.user)}`)]
		});
	}
}
