import { CardinalCommand, CardinalEmbedBuilder, GiveawayManager } from '#lib/structures';
import type { InteractionOrMessage } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { ApplicationCommandType, Message, type Snowflake } from 'discord.js';

@ApplyOptions<CardinalCommand.Options>({
	description: 'End a giveaway',
	detailedDescription: {
		extendedHelp: `End an ongoing giveaway`,
		usages: ['Message'],
		explainedUsage: [['Message', 'The message id of the giveaway message']],
		examples: ['1168516600937316463']
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
				.addStringOption((o) => o.setName('message_id').setDescription('The message id of the giveaway message').setRequired(true))
		);

		// Register Context Menu command available from any message
		registry.registerContextMenuCommand({
			name: 'End Giveaway',
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
		return this.endGiveaway(giveawayMessage.id, message);
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: CardinalCommand.ChatInputCommandInteraction) {
		const messageId = interaction.options.getString('message_id', true);
		return this.endGiveaway(messageId, interaction);
	}

	// Context Menu command
	public async contextMenuRun(interaction: CardinalCommand.ContextMenuCommandInteraction) {
		const targetMessageId = interaction.targetId;
		return this.endGiveaway(targetMessageId, interaction);
	}

	private async endGiveaway(giveawayMessageId: Snowflake, interactionOrMessage: InteractionOrMessage) {
		const data = await this.container.db.giveaway.findUnique({
			where: {
				messageId: giveawayMessageId
			}
		});

		if (!data || data.expired) {
			interactionOrMessage instanceof Message
				? send(interactionOrMessage, {
						embeds: [
							new CardinalEmbedBuilder()
								.setStyle('fail')
								.setDescription('Provide a valid giveaway message id, and make sure the giveaway has not ended')
						]
				  })
				: interactionOrMessage.reply({
						embeds: [
							new CardinalEmbedBuilder()
								.setStyle('fail')
								.setDescription('Provide a valid giveaway message id, and make sure the giveaway has ended')
						],
						ephemeral: true
				  });
			return;
		}

		const giveaway = new GiveawayManager(data);
		giveaway.end();

		if (!(interactionOrMessage instanceof Message)) {
			interactionOrMessage.reply({
				embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription('Ended the giveaway')],
				ephemeral: true
			});
		}
	}
}
