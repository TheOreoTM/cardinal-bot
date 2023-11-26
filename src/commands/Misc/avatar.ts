import { CardinalCommand, CardinalEmbedBuilder } from '#lib/structures';
import type { GuildMessage, InteractionOrMessage } from '#lib/types';
import { sendInteractionOrMessage } from '#utils/functions';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import { ApplicationCommandType, GuildMember } from 'discord.js';

@ApplyOptions<CardinalCommand.Options>({
	description: 'View the avatar of a user',
	detailedDescription: {
		extendedHelp: 'Shows the display avatar of a user',
		examples: ['', '@theoreotm'],
		usages: ['', 'Member']
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
				.addUserOption((option) => option.setName('target').setDescription('The member you want to view the avatar of'))
		);

		// Register Context Menu command available from any user
		registry.registerContextMenuCommand({
			name: 'View Avatar',
			type: ApplicationCommandType.User
		});
	}

	// Message command
	public async messageRun(message: GuildMessage, args: Args) {
		const target = await args.pick('member').catch(() => message.member);
		return this.showAvatar(message, target);
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: CardinalCommand.ChatInputCommandInteraction) {
		const target = interaction.options.getMember('target') ?? interaction.member;
		return this.showAvatar(interaction, target);
	}

	// Context Menu command
	public async contextMenuRun(interaction: CardinalCommand.ContextMenuCommandInteraction) {
		const targetId = interaction.targetId;
		const target = interaction.guild.members.cache.get(targetId);
		return this.showAvatar(interaction, target ?? interaction.member);
	}

	private async showAvatar(interactionOrMessage: InteractionOrMessage, target: GuildMember) {
		const avatar = target.displayAvatarURL();
		const embed = new CardinalEmbedBuilder()
			.setStyle('default')
			.setAuthor({
				name: `Server Avatar: ${getTag(target.user)}`
			})
			.setThumbnail(avatar);

		sendInteractionOrMessage(interactionOrMessage, {
			embeds: [embed]
		});
	}
}
