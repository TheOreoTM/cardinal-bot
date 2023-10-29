import { CardinalCommand, CardinalEmbedBuilder, GiveawayManager } from '#lib/structures';
import type { InteractionOrMessage } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { ApplicationCommandType, Message, type Snowflake } from 'discord.js';

@ApplyOptions<CardinalCommand.Options>({
	description: 'Reroll a giveaway',
	detailedDescription: {
		extendedHelp: 'ADD'
	}
})
export class UserCommand extends CardinalCommand {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: CardinalCommand.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((o) => o.setName('message_id').setDescription('The message id of the giveaway message').setRequired(true))
		);

		// Register Context Menu command available from any message
		registry.registerContextMenuCommand({
			name: 'Reroll Giveaway',
			type: ApplicationCommandType.Message
		});
	}

	// Message command
	public async messageRun(message: Message, args: Args) {
		const giveawayMessage = await args.pick('message').catch(() => null);
		if (!giveawayMessage) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a giveaway message id')]
			});
		}
		return this.rerollGiveaway(giveawayMessage.id, message);
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: CardinalCommand.ChatInputCommandInteraction) {
		const messageId = interaction.options.getString('message_id', true);
		return this.rerollGiveaway(messageId, interaction);
	}

	// Context Menu command
	public async contextMenuRun(interaction: CardinalCommand.ContextMenuCommandInteraction) {
		const targetMessageId = interaction.targetId;
		return this.rerollGiveaway(targetMessageId, interaction);
	}

	private async rerollGiveaway(giveawayMessageId: Snowflake, interactionOrMessage: InteractionOrMessage) {
		const data = await this.container.db.giveaway.findUnique({
			where: {
				messageId: giveawayMessageId
			}
		});

		if (!data) {
			interactionOrMessage instanceof Message
				? send(interactionOrMessage, {
						embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid giveaway message id')]
				  })
				: interactionOrMessage.reply({
						embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid giveaway message id')],
						ephemeral: true
				  });
			return;
		}
		const giveaway = new GiveawayManager(data);
		const newWinners = giveaway.reroll(); // TODO: Implement logic in DB to store the winners
		giveaway.end({ reroll: true, winnersList: newWinners });

		if (!(interactionOrMessage instanceof Message)) {
			interactionOrMessage.reply({
				embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription('Rerolled the giveaway')],
				ephemeral: true
			});
		}
	}
}
