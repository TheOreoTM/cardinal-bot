import { CardinalCommand, Timestamp } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { formatRoles } from '#utils/formatters';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { ApplicationCommandType, EmbedBuilder, GuildMember, PermissionFlagsBits } from 'discord.js';

@ApplyOptions<CardinalCommand.Options>({
	description: 'View information about a member',
	detailedDescription: {
		extendedHelp: 'View information a member',
	},
	aliases: ['w', 'who']
})
export class WhoisCommand extends CardinalCommand {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: CardinalCommand.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addUserOption((option) =>
					option //
						.setName('member')
						.setDescription('The member you want to whois')
				)
		);

		// Register Context Menu command available from any user
		registry.registerContextMenuCommand({
			name: 'Whois',
			type: ApplicationCommandType.User
		});
	}

	// Message command
	public async messageRun(message: GuildMessage, args: Args) {
		const member = await args.pick('member').catch(() => message.member);
		const embed = await this.whois(member);
		send(message, { embeds: [embed] });
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: CardinalCommand.ChatInputCommandInteraction) {
		const member = interaction.options.getMember('member') ?? interaction.member;
		const embed = await this.whois(member);
		interaction.reply({
			embeds: [embed]
		});
	}

	// Context Menu command
	public async contextMenuRun(interaction: CardinalCommand.ContextMenuCommandInteraction) {
		const memberId = interaction.targetId;
		const member = await interaction.guild.members.fetch({ user: memberId, cache: true });
		const embed = await this.whois(member);
		interaction.reply({
			embeds: [embed]
		});
	}

	private async whois(member: GuildMember) {
		const memberTag = getTag(member.user);
		const memberAvatarURL = member.displayAvatarURL();
		const accountCreatedTimestamp = new Timestamp(member.user.createdTimestamp ?? 0);
		const memberJoinedTimestamp = new Timestamp(member.joinedTimestamp ?? 0);
		// const isBot = member.user.bot ? 'Yes' : 'No';
		const globalName = member.user.globalName;
		// const highestServerRole = member.roles.highest;
		const roles = member.roles.cache;
		roles.sort((a, b) => b.position - a.position);
		roles.delete(member.guild.id);
		const formattedRoles = roles
			.map((role) => {
				return `<@&${role.id}>`;
			})
			.join(' ');
		const formattedPerms = formatRoles(member.permissions.toArray().sort(), false);

		const embed = new EmbedBuilder()
			.setColor(member.displayHexColor)
			.setAuthor({ name: memberTag, iconURL: memberAvatarURL })
			.setThumbnail(memberAvatarURL)
			.setTitle(globalName)
			.setDescription(`${member}`)
			.addFields(
				{
					name: 'Joined',
					value: memberJoinedTimestamp.getLongDate(),
					inline: true
				},
				{
					name: 'Registered',
					value: accountCreatedTimestamp.getLongDate(),
					inline: true
				},
				// {
				// 	name: 'Information',
				// 	value: [`Bot: ${isBot}`, `Highest Role: ${highestServerRole}`].join('\n'),
				// 	inline: true
				// },
				{
					name: `Roles [${roles.size}]`,
					value: formattedRoles || 'None',
					inline: false
				},
				{
					name: 'Permissions',
					value: formattedPerms.join(', ') || 'None',
					inline: false
				},
				{
					name: "Acknowledgment",
					value: this.getAcknowledgment(member) || "Unknown",
					inline: false
				}
			);

		return embed;
	}

	private getAcknowledgment(member: GuildMember) {
        let result: string = "";
        if (member.permissions.has(PermissionFlagsBits.ViewChannel)) {
            result = "Server Member"
        };
        if (member.permissions.has(PermissionFlagsBits.KickMembers)) {
            result = "Server Moderator"
        };
        if (member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            result = "Server Manager"
        };
        if (member.permissions.has(PermissionFlagsBits.Administrator)) {
            result = "Server Admin"
        };
        if (member.id === member.guild.ownerId) {
            result = "Server Owner"
        };
        return result
    }
}
