import { PermissionLevel } from '#lib/decorators';
import { CardinalCommand, CardinalEmbedBuilder, CardinalSubcommand } from '#lib/structures';
import { PermissionLevels, RestrictionAction, type GuildMessage } from '#lib/types';
import type { CommandRestriction } from '@prisma/client';
import { ApplyOptions } from '@sapphire/decorators';
import { Args } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Role, GuildMember } from 'discord.js';

@ApplyOptions<CardinalSubcommand.Options>({
	permissionLevel: PermissionLevels.Moderator,
	name: 'restriction',
	aliases: ['restrict'],
	detailedDescription: {
		extendedHelp: '',
		usages: [],
		examples: []
	},
	subcommands: [
		{
			name: 'add',
			messageRun: 'add'
		},

		{
			name: 'remove',
			messageRun: 'remove'
		},
		{
			name: 'reset',
			messageRun: 'reset'
		},
		{
			name: 'show',
			messageRun: 'show'
		}
	]
})
export class restrictionCommand extends CardinalSubcommand {
	public async add(message: CardinalSubcommand.Message, args: CardinalSubcommand.Args) {
		const target = await args.pick('role').catch(() => args.pick('member').catch(() => null));
		const action = await args.pick(restrictionCommand.type);

		if (!target) {
			return send(message, {
				embeds: [
					new CardinalEmbedBuilder()
						.setStyle('fail')
						.setDescription(`Provide either a valid role, member or channel${Math.random() >= 0.8 ? `. Its not that hard man...` : ''}`)
				]
			});
		}

		// Restrictions do not allow allows for the @everyone role:
		if (target.id === message.guild.id && action === RestrictionAction.Allow) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('You cannot allow commands for the `@everyone` role')]
			});
		}

		if (!this.checkPermissions(message, target)) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`You cannot modify nor preview the restrictions for this target`)]
			});
		}

		const command = await args.pick('commandName').catch(() => null);

		if (!command) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`Provide a valid command name to update the restrictions for`)]
			});
		}

		const success = await message.guild.settings.restrictions.add(target, command.name, action);

		if (success) {
			return send(message, {
				embeds: [
					new CardinalEmbedBuilder()
						.setStyle('success')
						.setDescription(`Added restrictions for ${target} for the command \`${command.name}\``)
						.addFields({
							name: 'Info',
							value: `\`\`\`ts\n${message.guildId}-${command.name}.${action}.add(${target.id})\`\`\``
						})
				]
			});
		} else {
			return send(message, { embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Something went wrong')] });
		}
	}

	public async remove(message: CardinalSubcommand.Message, args: CardinalSubcommand.Args) {
		const target = await args.pick('role').catch(() => args.pick('member').catch(() => null));
		const action = await args.pick(restrictionCommand.type);

		if (!target) {
			return send(message, {
				embeds: [
					new CardinalEmbedBuilder()
						.setStyle('fail')
						.setDescription(`Provide either a valid role, member or channel${Math.random() >= 0.8 ? `. Its not that hard man...` : ''}`)
				]
			});
		}

		if (!this.checkPermissions(message, target)) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`You cannot modify nor preview the restrictions for this target`)]
			});
		}

		const command = await args.pick('commandName').catch(() => null);

		if (!command) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`Provide a valid command name to update the restrictions for`)]
			});
		}

		const success = await message.guild.settings.restrictions.remove(target, command.name, action);

		if (success) {
			return send(message, {
				embeds: [
					new CardinalEmbedBuilder()
						.setStyle('success')
						.setDescription(`Removed restrictions for ${target} for the command \`${command.name}\``)
						.addFields({
							name: 'Info',
							value: `\`\`\`ts\n${message.guildId}-${command.name}.${action}.remove(${target.id})\`\`\``
						})
				]
			});
		} else {
			return send(message, { embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Something went wrong')] });
		}
	}

	@PermissionLevel('Moderator')
	public async reset(message: CardinalSubcommand.Message, args: CardinalSubcommand.Args) {
		const command = await args.pick('commandName').catch(() => null);

		if (!command) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`Provide a valid command name`)]
			});
		}
		const success = await message.guild.settings.restrictions.reset(command.name);

		if (success) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Reset all restrictions for ${command.name}`)]
			});
		} else {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`Something went wrong`)]
			});
		}
	}

	@PermissionLevel('Trainee')
	public async show(message: CardinalSubcommand.Message, args: CardinalSubcommand.Args) {
		const command = await args.pick('commandName').catch(() => null);

		if (!command) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`Provide a valid command name`)]
			});
		}

		try {
			const restriction = await message.guild.settings.restrictions.findRestriction(command.name);
			const embed = this.formatRestriction(command, restriction);
			return send(message, { embeds: [embed] });
		} catch (error) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Something went wrong')]
			});
		}
	}

	private formatRestriction(command: CardinalCommand, restriction: CommandRestriction | null) {
		if (!restriction) {
			return new CardinalEmbedBuilder().setStyle('info').setDescription(`There are no restrictions for the command \`${command.name}\``);
		}

		const embed = new CardinalEmbedBuilder().setStyle('default').setAuthor({ name: `Command Restrictions for ${command.name}` });

		if (restriction.blackListedMembers) {
			const list: string[] = [];
			restriction.blackListedMembers.forEach((member) => {
				list.push(`- <@${member}>`);
			});
			embed.addFields({
				inline: true,
				name: 'Blacklisted Members (Denied)',
				value: list.length === 0 ? 'None' : list.join('\n')
			});
		}

		if (restriction.blackListedChannels) {
			const list: string[] = [];
			restriction.blackListedChannels.forEach((channel) => {
				list.push(`- <#${channel}>`);
			});
			embed.addFields({
				inline: true,
				name: 'Blacklisted Channels (Denied)',
				value: list.length === 0 ? 'None' : list.join('\n')
			});
		}

		if (restriction.blackListedRoles) {
			const list: string[] = [];
			restriction.blackListedRoles.forEach((role) => {
				list.push(`- <@&${role}>`);
			});
			embed.addFields({
				inline: true,
				name: 'Blacklisted Roles (Denied)',
				value: list.length === 0 ? 'None' : list.join('\n')
			});
		}

		if (restriction.whiteListedMembers) {
			const list: string[] = [];
			restriction.whiteListedMembers.forEach((member) => {
				list.push(`- <@${member}>`);
			});
			embed.addFields({
				inline: true,
				name: 'Whitelisted Members (Allowed)',
				value: list.length === 0 ? 'None' : list.join('\n')
			});
		}

		if (restriction.whiteListedChannels) {
			const list: string[] = [];
			restriction.whiteListedChannels.forEach((channel) => {
				list.push(`- <#${channel}>`);
			});
			embed.addFields({
				inline: true,
				name: 'Whitelisted Channels (Allowed)',
				value: list.length === 0 ? 'None' : list.join('\n')
			});
		}

		if (restriction.whiteListedRoles) {
			const list: string[] = [];
			restriction.whiteListedRoles.forEach((role) => {
				list.push(`- <@&${role}>`);
			});
			embed.addFields({
				inline: true,
				name: 'Whitelisted Roles (Allowed)',
				value: list.length === 0 ? 'None' : list.join('\n')
			});
		}

		return embed;
	}

	private checkPermissions(message: GuildMessage, target: Role | GuildMember) {
		// If it's to itself, always block
		if (message.member!.id === target.id) return false;

		// If the target is the owner, always block
		if (message.guild.ownerId === target.id) return false;

		// If the author is the owner, always allow
		if (message.author.id === message.guild.ownerId) return true;

		// Check hierarchy role positions, allow when greater, block otherwise
		const targetPosition = target instanceof Role ? target.position : target.roles.highest.position;
		const authorPosition = message.member!.roles.highest?.position ?? 0;
		return authorPosition > targetPosition;
	}

	private static type = Args.make<RestrictionAction>((parameter, { argument }) => {
		const lowerCasedParameter = parameter.toLowerCase();
		if (lowerCasedParameter === 'allow') return Args.ok(RestrictionAction.Allow);
		if (lowerCasedParameter === 'deny') return Args.ok(RestrictionAction.Deny);
		return Args.error({ argument, parameter, identifier: `Valid action types are \`allow\` and \`deny\`` });
	});
}
