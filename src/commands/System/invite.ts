import { CardinalCommand } from '#lib/structures';
import type { InteractionOrMessage } from '#lib/types';
import { CardinalEmojis } from '#utils/constants';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import { ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ButtonStyle, EmbedBuilder, Message } from 'discord.js';

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
		return this.sendInvite(message)
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: CardinalCommand.ChatInputCommandInteraction) {
		return this.sendInvite(interaction)
	}

	// Context Menu command
	public async contextMenuRun(interaction: CardinalCommand.ContextMenuCommandInteraction) {
		return this.sendInvite(interaction)
	}

	private async sendInvite(interactionOrMessage: InteractionOrMessage) {
		const invites = {
			dashboard: "https://discord.com/oauth2/authorize?client_id=740962735306702858&response_type=code&redirect_uri=https://cardinal.oreotm.xyz/callback&scope=identify+guilds",
			invite: "https://discord.com/api/oauth2/authorize?client_id=740962735306702858&permissions=1633094593750&scope=applications.commands%20bot"
		}

		const { client } = interactionOrMessage

		const object = {
			embeds: [
				new EmbedBuilder()
					.setAuthor({ name: `${client.user.username}'s Invite Links`, iconURL: `${client.user.displayAvatarURL({ forceStatic: false })}` })
					.setDescription(`The Discord bot to make moderation simple. Equipped with stats tracking, staff management, giveaway and more.`)
			],
			components: [
				new ActionRowBuilder<ButtonBuilder>()
					.addComponents(
						new ButtonBuilder()
							.setStyle(ButtonStyle.Link)
							.setLabel('Invite')
							.setEmoji(CardinalEmojis.Cardinal)
							.setURL(invites.invite),

						new ButtonBuilder()
							.setStyle(ButtonStyle.Link)
							.setLabel('Dashboard')
							.setEmoji(CardinalEmojis.Cardinal)
							.setURL(invites.dashboard)
					)
			]
		}

		return interactionOrMessage instanceof Message ? send(interactionOrMessage, object) : interactionOrMessage.reply(object)

	}
}

