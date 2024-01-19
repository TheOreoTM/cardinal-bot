import { CardinalCommand } from '#lib/structures';
import type { InteractionOrMessage } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import { ApplicationCommandType, Message } from 'discord.js';

@ApplyOptions<CardinalCommand.Options>({
	description: 'Get the invite link for the bot',
	detailedDescription: {
		extendedHelp: 'ADD'
	}
})
export class UserCommand extends CardinalCommand {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: CardinalCommand.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});

		// Register Context Menu command available from any message
		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.Message
		});

		// Register Context Menu command available from any user
		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.User
		});
	}

	// Message command
	public async messageRun(message: CardinalCommand.Message) {
		return this.sendPing(message);
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: CardinalCommand.ChatInputCommandInteraction) {
		return this.sendPing(interaction);
	}

	// Context Menu command
	public async contextMenuRun(interaction: CardinalCommand.ContextMenuCommandInteraction) {
		return this.sendPing(interaction);
	}

	private async sendPing(interactionOrMessage: InteractionOrMessage) {
		const pingMessage =
			interactionOrMessage instanceof Message
				? await send(interactionOrMessage, { content: 'Ping?' })
				: await interactionOrMessage.reply({ content: 'Ping?', fetchReply: true });

		const content = `Pong! WS Latency ${Math.round(this.container.client.ws.ping)}ms. API Latency ${
			pingMessage.createdTimestamp - interactionOrMessage.createdTimestamp
		}ms.`;

		if (interactionOrMessage instanceof Message) {
			return send(interactionOrMessage, { content });
		}

		return interactionOrMessage.editReply({
			content: content
		});
	}
}
