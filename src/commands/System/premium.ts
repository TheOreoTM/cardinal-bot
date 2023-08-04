import { ApplyOptions } from '@sapphire/decorators';
import { Message } from 'discord.js';
import { CardinalCommand, CardinalEmbedBuilder } from '#lib/structures';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<CardinalCommand.Options>({
	description: 'Info about Cardinal Premium',
	name: 'premium',
	detailedDescription: {
		extendedHelp: 'View some information about the premium plan for cardinal',
		usages: [''],
		examples: ['']
	}
})
export class premiumCommand extends CardinalCommand {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: CardinalCommand.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});
	}
	// Message command
	public async messageRun(message: CardinalCommand.Message) {
		return this.sendMessage(message);
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: CardinalCommand.ChatInputCommandInteraction) {
		return this.sendMessage(interaction);
	}

	private async sendMessage(
		interactionOrMessage: Message | CardinalCommand.ChatInputCommandInteraction | CardinalCommand.ContextMenuCommandInteraction
	) {
		const embed = new CardinalEmbedBuilder().setStyle('info').setDescription('*Coming Soon :tm:*');

		if (interactionOrMessage instanceof Message) {
			return send(interactionOrMessage, { embeds: [embed] });
		}

		return interactionOrMessage.reply({
			embeds: [embed]
		});
	}
}
