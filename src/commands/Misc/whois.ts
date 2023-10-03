import { CardinalCommand, Timestamp } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { formatRoles } from '#utils/formatters';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import { ApplicationCommandType, EmbedBuilder, GuildMember } from 'discord.js';

@ApplyOptions<CardinalCommand.Options>({
	description: 'ADD DESCRIPTION',
	detailedDescription: {
		extendedHelp: 'ADD'
	}
})
export class WhoisCommand extends CardinalCommand {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: CardinalCommand.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});

		// Register Context Menu command available from any user
		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.User
		});
	}

	// Message command
	public async messageRun(message: GuildMessage) {
		const member = message.member;
		const embed = await this.whois(member);
		send(message, { embeds: [embed] });
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: CardinalCommand.ChatInputCommandInteraction) {
		const member = interaction.member;
		const embed = await this.whois(member);
		interaction.reply({
			embeds: [embed]
		});
	}

	// Context Menu command
	public async contextMenuRun(interaction: CardinalCommand.ContextMenuCommandInteraction) {
		const member = interaction.member;
		const embed = await this.whois(member);
		interaction.reply({
			embeds: [embed]
		});
	}

	private async whois(member: GuildMember) {
		const memberTag = getTag(member.user);
		const memberAvatarURL = member.displayAvatarURL();
		const accountCreatedTimestamp = new Timestamp(member.user.createdTimestamp);
		const memberJoinedTimestamp = new Timestamp(member.joinedTimestamp ?? 0);
		const isBot = member.user.bot ? 'Yes' : 'No';
		const globalName = member.user.globalName;
		const highestServerRole = member.roles.highest;
		const roles = member.roles.cache;
		roles.delete(member.guild.id);
		const formattedRoles = roles
			.map((role) => {
				return `<@&${role.id}>`;
			})
			.join(' ');
		const formattedPerms = formatRoles(member.permissions.toArray());

		const embed = new EmbedBuilder()
			.setColor(member.displayHexColor)
			.setAuthor({ name: memberTag, iconURL: memberAvatarURL })
			.setThumbnail(memberAvatarURL)
			.setTitle(globalName)
			.addFields(
				{
					name: 'Joined',
					value: memberJoinedTimestamp.getLongDateTime(),
					inline: true
				},
				{
					name: 'Registered',
					value: accountCreatedTimestamp.getLongDateTime(),
					inline: true
				},
				{
					name: 'Information',
					value: [`Bot: ${isBot}`, `Highest Role: ${highestServerRole}`].join('\n'),
					inline: true
				},
				{
					name: `Roles [${roles.size}]`,
					value: formattedRoles,
					inline: false
				},
				{
					name: 'Permissions',
					value: formattedPerms.join(', '),
					inline: false
				}
			);

		return embed;
	}
}
