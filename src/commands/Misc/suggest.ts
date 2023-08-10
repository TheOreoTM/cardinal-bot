import { CardinalCommand, CardinalEmbedBuilder, CardinalIndexBuilder } from '#lib/structures';
import { SuggestionStatus } from '#lib/types';
import { CardinalEmojis } from '#utils/constants';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { EmbedLimits } from '@sapphire/discord.js-utilities';
import { send } from '@sapphire/plugin-editable-commands';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

@ApplyOptions<CardinalCommand.Options>({
	description: '',
	name: 'suggest',
	detailedDescription: {
		extendedHelp: '',
		usages: [],
		examples: []
	}
})
export class suggestCommand extends CardinalCommand {
	public override async messageRun(message: CardinalCommand.Message, args: CardinalCommand.Args) {
		const suggestion = await args.rest('string').catch(() => {
			return this.error({
				identifier: 'NoSuggestion',
				message: 'Provide a valid suggestion',
				context: {
					silent: false
				}
			});
		});

		const { guild, member } = message;

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
					return send(message, `${CardinalEmojis.Success} ***Submitted your suggestion***`);
				});
		} catch (error) {
			return send(message, `${CardinalEmojis.Fail} Something went wrong`);
		} finally {
			return;
		}
	}
}
