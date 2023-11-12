import { CardinalCommand, CardinalEmbedBuilder, CardinalIndexBuilder } from '#lib/structures';
import { SuggestionStatus, type InteractionOrMessage } from '#lib/types';
import { CardinalEmojis } from '#utils/constants';
import { sendInteractionOrMessage } from '#utils/functions';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { EmbedLimits } from '@sapphire/discord.js-utilities';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

@ApplyOptions<CardinalCommand.Options>({
	description: 'Send a suggestion',
	name: 'suggest',
	detailedDescription: {
		extendedHelp: 'Send a suggestion to a channel specified by the server administrators and wait for a response from the staff',
		usages: ['Suggestion'],
		examples: ['Add a channel to send memes']
	}
})
export class suggestCommand extends CardinalCommand {
	public registerApplicationCommands(registry: CardinalCommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) => option.setName('suggestion').setDescription('The suggestion you want to send').setRequired(true))
		);
	}

	public async messageRun(message: CardinalCommand.Message, args: CardinalCommand.Args) {
		const suggestion = await args.rest('string').catch(() => {
			return this.error({
				identifier: 'NoSuggestion',
				message: 'Provide a valid suggestion',
				context: {
					silent: false
				}
			});
		});

		return this.suggest(message, suggestion);
	}

	public async chatInputRun(interaction: CardinalCommand.ChatInputCommandInteraction) {
		const suggestion = interaction.options.getString('suggestion', true);

		return this.suggest(interaction, suggestion);
	}

	private async suggest(interactionOrMessage: InteractionOrMessage, suggestion: string) {
		const { guild, member } = interactionOrMessage;

		const suggestionChannel = await guild.settings.channels.suggestion();

		if (!suggestionChannel)
			return this.error({
				identifier: 'NoSuggestionChannel',
				message: 'This server doesnt have a suggestion channel set up'
			});

		const suggestionId = await new CardinalIndexBuilder().suggestionId(guild.id);
		const manageSuggestionButton = new ButtonBuilder()
			.setStyle(ButtonStyle.Secondary)
			.setLabel('Respond')
			.setCustomId(`manageSuggestion-${suggestionId}`);
		const suggestionEmbed = new CardinalEmbedBuilder()
			.setStyle('default')
			.setAuthor({ iconURL: member.displayAvatarURL(), name: getTag(member.user) })
			.setTitle(`Suggestion #${suggestionId}`)
			.setDescription(suggestion.slice(0, EmbedLimits.MaximumDescriptionLength));

		try {
			suggestionChannel
				.send({
					embeds: [suggestionEmbed],
					components: [new ActionRowBuilder<ButtonBuilder>().addComponents(manageSuggestionButton)]
				})
				.then(async (suggestionMessage) => {
					const shouldCreateThread = guild.settings.createSuggestionThread;

					if (shouldCreateThread) await suggestionMessage.startThread({ name: `Suggestion ${suggestionId} Discussion` });

					await this.container.db.suggestion.create({
						data: {
							guildId: guild.id,
							memberDisplayAvatarURL: member.displayAvatarURL(),
							memberId: member.id,
							memberName: getTag(member.user),
							status: SuggestionStatus.Pending,
							suggestionId: suggestionId,
							text: suggestion
						}
					});
					return sendInteractionOrMessage(interactionOrMessage, `${CardinalEmojis.Success} ***Submitted your suggestion***`);
				});
		} catch (error) {
			return sendInteractionOrMessage(interactionOrMessage, `${CardinalEmojis.Fail} Something went wrong`);
		} finally {
			return;
		}
	}
}
