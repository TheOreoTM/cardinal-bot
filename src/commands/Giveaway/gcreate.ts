import { CardinalCommand, CardinalEmbedBuilder, Timestamp, type GiveawayData, GiveawayManager } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { days } from '#utils/common';
import { ApplyOptions } from '@sapphire/decorators';
import { EmbedLimits } from '@sapphire/discord.js-utilities';
import type { Args } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Duration } from '@sapphire/time-utilities';
import { userMention, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

const MaxWinnerAmount = 10;
const MinWinnerAmount = 1;
const MaxDescriptionLength = 256;
const MinDescriptionLength = 1;
const MaxDurationAmount = days(30);
@ApplyOptions<CardinalCommand.Options>({
	description: 'Create a giveaway',
	detailedDescription: {
		extendedHelp: 'Start a giveaway',
		usages: ['Duration WinnerAmount Prize'],
		explainedUsage: [
			['Duration', 'How long the giveaway should last'],
			['WinnerAmount', 'A number between 1 and 10'],
			['Prize', 'The prize you want to giveaway']
		],
		examples: ['2d 1 Nitro']
	},
	preconditions: ['Staff']
})
export class UserCommand extends CardinalCommand {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: CardinalCommand.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) =>
					option
						.setName('prize')
						.setDescription('The prize you want to giveaway')
						.setMaxLength(EmbedLimits.MaximumTitleLength)
						.setRequired(true)
				)
				.addNumberOption((option) =>
					option
						.setName('winner_amount')
						.setDescription('The amount of winners')
						.setMaxValue(MaxWinnerAmount)
						.setMinValue(MinWinnerAmount)
						.setRequired(true)
				)
				.addStringOption((option) =>
					option.setName('duration').setDescription('How long you want the giveaway for. (eg. 2d, 1w, 4h)').setRequired(true)
				)
				.addStringOption((option) =>
					option
						.setName('description')
						.setDescription('The description you want the giveaway to have')
						.setMaxLength(MaxDescriptionLength)
						.setMinLength(MinDescriptionLength)
				)
		);
	}

	// Message command
	public async messageRun(message: GuildMessage, args: Args) {
		const duration = await args.pick('duration').catch(() => null);
		const winnerAmount = await args.pick('number').catch(() => null);
		const prize = await args.rest('string').catch(() => null);

		if (!duration || !winnerAmount || !prize) {
			return send(message, {
				embeds: [
					new CardinalEmbedBuilder()
						.setStyle('fail')
						.setDescription(`Please provide all the arguments in the valid format\n*Hint: run \`help gcreate\`*`)
				]
			});
		}

		if (winnerAmount > MaxWinnerAmount || winnerAmount < MinWinnerAmount) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Winner Amount should be less than 10 and greater than 1')]
			});
		}

		if (duration.offset > MaxDurationAmount) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Duration amount should be less than 30 days')]
			});
		}

		const expiresAt: Date = new Date(Date.now() + duration.offset);
		const formattedEndTime = new Timestamp(expiresAt.getTime());

		const channel = message.channel;
		const description = [];
		description.push(`Ends: ${formattedEndTime.getRelativeTime()} (${formattedEndTime.getLongDateTime()})`);
		description.push(`Hosted by: ${message.author}`);
		description.push(`Participants: **0**`);
		description.push(`Winners: **${winnerAmount}**`);
		const msg = await channel.send({
			components: [this.createJoinButton()],
			embeds: [new CardinalEmbedBuilder().setStyle('default').setTitle(prize).setDescription(description.join('\n'))]
		});

		if (message.deletable) message.delete();
		return this.createGiveaway({
			prize,
			winnerAmount,
			expiresAt,
			messageId: msg.id,
			channelId: msg.channelId,
			guildId: msg.guildId,
			description: null,
			hosterId: message.author.id
		});
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: CardinalCommand.ChatInputCommandInteraction) {
		const winnerAmount = interaction.options.getNumber('winner_amount', true);
		const stringDuration = interaction.options.getString('duration', true);
		const prize = interaction.options.getString('prize', true);
		const giveawayDescription = interaction.options.getString('description', false);
		const duration = new Duration(stringDuration);

		const expiresAt: Date = new Date(Date.now() + duration.offset);
		const formattedEndTime = new Timestamp(expiresAt.getTime());

		const description = [];
		if (giveawayDescription) description.push(`${giveawayDescription}\n`);
		description.push(`Ends: ${formattedEndTime.getRelativeTime()} (${formattedEndTime.getLongDateTime()})`);
		description.push(`Hosted by: ${userMention(interaction.member.id)}`);
		description.push(`Participants: **0**`);
		description.push(`Winners: **${winnerAmount}**`);

		if (!interaction.channel) {
			await interaction.reply({
				ephemeral: true,
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setTitle(prize).setDescription(`Something went wrong`)]
			});
			return;
		}

		interaction.reply({
			ephemeral: true,
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Created giveaway`)]
		});

		const msg = await interaction.channel?.send({
			components: [this.createJoinButton()],
			embeds: [new CardinalEmbedBuilder().setStyle('default').setTitle(prize).setDescription(description.join('\n'))]
		});

		return this.createGiveaway({
			prize,
			winnerAmount,
			expiresAt,
			messageId: msg.id,
			channelId: msg.channelId,
			guildId: msg.guildId,
			description: giveawayDescription,
			hosterId: interaction.user.id
		});
	}

	private createJoinButton() {
		const button = new ButtonBuilder().setCustomId(`gw-join`).setLabel('Join').setEmoji('🎉').setStyle(ButtonStyle.Success);

		return new ActionRowBuilder<ButtonBuilder>().addComponents(button);
	}

	private async createGiveaway(data: Partial<GiveawayData>) {
		const gwData = new GiveawayManager(data).toDatabase();
		const offset = gwData.expiresAt.getTime() - Date.now();
		this.container.tasks.create('EndGiveawayTask', { giveawayMessageId: gwData.messageId }, offset);
		await this.container.db.giveaway.create({
			data: gwData
		});
	}
}
