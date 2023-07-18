import { ApplyOptions } from '@sapphire/decorators';
import { Message, User } from 'discord.js';
import { CardinalCommand, CardinalEmbedBuilder } from '#lib/structures';
import type { InteractionOrMessage } from '#lib/types';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<CardinalCommand.Options>({
	description: 'Register',
	name: 'register',
	detailedDescription: {
		extendedHelp: '',
		usages: [],
		examples: []
	}
})
export class registerCommand extends CardinalCommand {
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
		return this.registerUser(message.member.user, message);
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: CardinalCommand.ChatInputCommandInteraction) {
		return this.registerUser(interaction.member.user, interaction);
	}

	private async registerUser(user: User, interactionOrMessage: InteractionOrMessage) {
		const userData = await this.container.db.user.findUnique({ where: { userId: user.id } });
		if (userData) {
			if (interactionOrMessage instanceof Message) {
				return await send(interactionOrMessage, {
					embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('You are already registered')]
				});
			}
			return interactionOrMessage.reply({
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('You are already registered')],
				ephemeral: true
			});
		}

		const newUser = await this.container.db.user.create({ data: { userId: user.id } });
		const embed = new CardinalEmbedBuilder()
			.setStyle('success')
			.setDescription(`You are now successfully registered. Welcome to Cardinal, user \`#${newUser.id}\`.`);
		return interactionOrMessage instanceof Message
			? send(interactionOrMessage, { embeds: [embed] })
			: interactionOrMessage.reply({ embeds: [embed] });
	}
}
