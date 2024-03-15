import { CardinalCommand, Timestamp } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { formatRoles } from '#utils/formatters';
import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { ApplicationCommandType, EmbedBuilder, GuildMember, PermissionFlagsBits, User, type EmbedField } from 'discord.js';

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
		})
	}

	// Message command
	public async messageRun(message: GuildMessage, args: Args) {
		let embed;
		const member = await args.pick('member').catch(() => undefined) as GuildMember ?? await args.pick('user').catch(() => undefined) as User ?? undefined
		embed = member ? await this.whois(member) : new EmbedBuilder().setColor('Red').setTitle('Invalid Arguments provided').setDescription('<:fail:1146683470114996274> Provide a valid argument (ID / Username)')
		send(message, { embeds: [embed] })
	}

	// Chat Input (slash) command–
	public async chatInputRun(interaction: CardinalCommand.ChatInputCommandInteraction) {
		const member = interaction.options.getMember('user') as GuildMember
		const user = interaction.options.getUser('user') as User
		const { channel } = interaction
		interaction.deferReply({})
		channel?.send(`${member}`)
		channel?.send(`${user}`)
		// const embed = await this.whois(target)
		// interaction.reply({
		// 	embeds: [embed]
		// });
	}

	// Context Menu command
	public async contextMenuRun(interaction: CardinalCommand.ContextMenuCommandInteraction) {
		const { targetId, guild, client, member } = interaction;
		const target = await guild.members.fetch({ user: targetId }) ?? await client.users.fetch(targetId) ?? member
		const embed = await this.whois(target)
		interaction.reply({
			embeds: [embed]
		});
	}

	private async whois(target: GuildMember | User) {
		const type = typeof target === 'object' && 'roles' in target
		let roleFormat
		const accountCreatedTimestamp = new Timestamp((type ? target.user : target).createdTimestamp ?? 0)
		let memberJoinedTimestamp
		if (type) {
			roleFormat = this.getFormattedRoles(target)
			memberJoinedTimestamp = new Timestamp(target.joinedTimestamp ?? 0)
		}
		const fieldsdata: Array<EmbedField> = type ? [
			{ name: `Roles [${roleFormat?.roles.size}]`, value: `${target.roles.cache.size >= 200 ? "Too many  roles to display" : roleFormat?.formattedRoles ?? "None"}`, inline: false },
			{ name: "Key Permissions", value: `${type ? (this.getformatPermissions(target)).sort().join(", ") || "None" : "None"}`, inline: false },
			{ name: "Acknowledgement", value: `${type ? this.getAcknowledgment(target) : "Ghost"}`, inline: false }
		] : [{ name: "Acknowledgement", value: "Ghost", inline: false }]

		return new EmbedBuilder()
			.setColor("Blue")
			.setAuthor({ name: `${(type ? target.user : target).username}`, iconURL: `${(type ? target.user : target).displayAvatarURL({ forceStatic: true })}` })
			.setDescription(
				`${target}
				**General Information:\n**<:User:1153571122697224263> **User ID:** ${target.id}
				<:HashTag:1153571114606395483> **Username:** ${(type ? target.user : target).username} ${type ? target.nickname ? `${`(${target.nickname})`}` : '' : ''}
				<:Asterik:1153571108646309918> **Account Created**: ${accountCreatedTimestamp.getLongDate()}
				<:Bot:1153572049634197504> **Bot?**: ${(type ? target.user : target).bot === false ? "No" : "Yes"}${type ? `
				<:Role:1153574929669816350> **Highest Server Role**: ${target.roles.highest}` : ""}${type ? `
				<:Calender:1153575414556545104> **Member Since**: ${memberJoinedTimestamp?.getLongDate() ?? "0"}` : ""}`
			)
			.setFields(fieldsdata)
			.setThumbnail(`${(type ? target.user : target).displayAvatarURL({ forceStatic: false })}`)
	}

	private getformatPermissions(member: GuildMember) {
		return formatRoles(member.permissions.toArray().sort(), false)
	}

	private getFormattedRoles(member: GuildMember) {
		const roles = member.roles.cache;
		roles.sort((a, b) => b.position - a.position);
		roles.delete(member.guild.id);
		const formattedRoles = roles
			.map((role) => {
				return `<@&${role.id}>`;
			})
			.join(' ');
		return {
			formattedRoles,
			roles
		}
	}

	private getAcknowledgment(member: GuildMember): string {
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
