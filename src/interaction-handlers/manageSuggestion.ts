import { CardinalEmbedBuilder } from '#lib/structures';
import { SuggestionStatus, type GuildButtonInteraction } from '#lib/types';
import { minutes } from '#utils/common';
import { CardinalColors, CardinalEmojis } from '#utils/constants';
import { capitalizeWords } from '#utils/formatters';
import { isTrainee } from '#utils/functions';
import { generateSendMessageAsGuildButton, getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { EmbedLimits } from '@sapphire/discord.js-utilities';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
	ButtonBuilder,
	ButtonStyle,
	type ButtonInteraction,
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	type ModalActionRowComponentBuilder,
	type Interaction,
	GuildMember
} from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonHandler extends InteractionHandler {
	public async run(interaction: GuildButtonInteraction) {
		if (!interaction.guild || !interaction.member) return;

		if (!(await isTrainee(interaction.member as GuildMember))) {
			return interaction.reply({
				content: 'You cant use this button',
				ephemeral: true
			});
		}

		const { message } = interaction;
		const suggestionId = parseInt(interaction.customId.replace('manageSuggestion-', '')) ?? 0;
		const suggestionData = await this.container.db.suggestion.findUnique({
			where: {
				guildId_suggestionId: {
					guildId: interaction.guildId,
					suggestionId: suggestionId
				}
			}
		});

		if (!suggestionData) {
			return interaction.reply({ content: `${CardinalEmojis.Fail} I cant find a suggestion with the id \`${suggestionId}\``, ephemeral: true });
		}

		const data = suggestionData;

		const approveButton = new ButtonBuilder().setCustomId('approve').setLabel('Approve').setStyle(ButtonStyle.Success);

		const rejectButton = new ButtonBuilder().setCustomId('reject').setLabel('Reject').setStyle(ButtonStyle.Danger);

		const implementButton = new ButtonBuilder().setCustomId('implement').setLabel('Implement').setStyle(ButtonStyle.Primary);

		const considerButton = new ButtonBuilder().setCustomId('consider').setLabel('Consider').setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(approveButton, rejectButton, implementButton, considerButton);

		const response = await interaction.reply({
			content: `${CardinalEmojis.Prompt} Choose the action you want to take`,
			components: [row],
			ephemeral: true,
			fetchReply: true
		});

		const collectorFilter = (i: Interaction) => {
			return i.user.id === interaction.user.id;
		};

		try {
			const suggestionAction = await response.awaitMessageComponent({ filter: collectorFilter, time: 60000 });
			const modalData = await this.getModelAnswer(suggestionAction as ButtonInteraction);
			if (!modalData) {
				return;
			}

			const customId = suggestionAction.customId as SuggestionActions;
			const previous = interaction.message.embeds[0].data as SuggestionEmbedType;
			const embed = new CardinalEmbedBuilder(previous);

			switch (customId) {
				case 'approve':
					data.status = SuggestionStatus.Approved;
					break;
				case 'reject':
					data.status = SuggestionStatus.Rejected;
					break;
				case 'consider':
					data.status = SuggestionStatus.Considered;
					break;
				case 'implement':
					data.status = SuggestionStatus.Implemented;
					break;
			}

			embed
				.setTitle(`Suggestion #${suggestionId} - ${capitalizeWords(data.status)}`)
				.setFields({
					name: `Reason from ${modalData.responderName}:`,
					value: `${modalData.reason}`
				})
				.setColor(SuggestionColors[customId]);

			data.responderId = modalData.responderId;
			data.responderName = modalData.responderName;

			message.edit({ embeds: [embed] });

			await this.container.db.suggestion.update({
				where: {
					guildId_suggestionId: {
						guildId: interaction.guildId,
						suggestionId: suggestionId
					}
				},
				data
			});

			interaction.editReply({
				content: `${CardinalEmojis.Success} ${capitalizeWords(data.status)}`,
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						approveButton.setDisabled(true).setStyle(customId === 'approve' ? ButtonStyle.Success : ButtonStyle.Secondary),
						rejectButton.setDisabled(true).setStyle(customId === 'reject' ? ButtonStyle.Success : ButtonStyle.Secondary),
						implementButton.setDisabled(true).setStyle(customId === 'implement' ? ButtonStyle.Success : ButtonStyle.Secondary),
						considerButton.setDisabled(true).setStyle(customId === 'consider' ? ButtonStyle.Success : ButtonStyle.Secondary)
					)
				]
			});

			try {
				const suggester =
					interaction.guild.members.cache.get(suggestionData.memberId) ?? (await interaction.guild.members.fetch(suggestionData.memberId));

				if (!suggester) return;

				const linkButton = new ButtonBuilder().setLabel('Go to suggestion').setStyle(ButtonStyle.Link).setURL(interaction.message.url);
				await suggester.send({
					embeds: [
						new CardinalEmbedBuilder()
							.setStyle('info')
							.setDescription(`Your suggestion \`#${suggestionId}\` has been **${data.status}**`),
						embed
					],
					components: [new ActionRowBuilder<ButtonBuilder>().addComponents(linkButton, generateSendMessageAsGuildButton(interaction.guild))]
				});

				if (interaction.message.hasThread) {
					await interaction.message.thread?.setLocked(true);
					await interaction.message.thread?.send({
						content: `${CardinalEmojis.Info} This thread has been locked because a response for the suggestion was created.`
					});
				}

				return;
			} catch (error) {
				return;
			}
		} catch (error: any) {
			if ((error.code = 'InteractionCollectorError')) {
				return response
					.edit({
						content: 'Timeout',
						components: []
					})
					.catch(() => null);
			} else {
				return response.edit({
					content: `${CardinalEmojis.Fail} Something went wrong`,
					components: []
				});
			}
		}
	}

	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId.startsWith('manageSuggestion')) return this.some();

		return this.none();
	}

	private async getModelAnswer(interaction: ButtonInteraction) {
		const modal = new ModalBuilder().setCustomId('suggestionModal').setTitle(`Suggestion Manager`);
		const reasonTextInput = new TextInputBuilder()
			.setCustomId('reason')
			.setLabel('Reason')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true)
			.setMaxLength(EmbedLimits.MaximumFieldValueLength);

		const reasonRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(reasonTextInput);

		modal.addComponents(reasonRow);

		await interaction.showModal(modal);
		const submitted = await interaction.awaitModalSubmit({ time: minutes(5) });

		if (submitted) {
			const { fields } = submitted;

			submitted.reply({ content: `Suggestion Updated Successfully`, ephemeral: true });

			const reason = fields.getTextInputValue('reason');
			const responderId = interaction.user.id;
			const responderName = getTag(interaction.user);

			return {
				reason,
				responderId,
				responderName
			};
		} else {
			return null;
		}
	}
}

type SuggestionEmbedType = {
	author: {
		icon_url: string;
		name: string;
	};
	title: string;
	description: string;
};

const SuggestionColors = {
	approve: CardinalColors.Success,
	reject: CardinalColors.Fail,
	consider: CardinalColors.Warn,
	implement: CardinalColors.Info
} as const;

type SuggestionActions = 'approve' | 'reject' | 'consider' | 'implement';
