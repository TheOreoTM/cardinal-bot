import { CardinalEmbedBuilder, CardinalSubcommand } from '#lib/structures';
import { PermissionLevels, RestrictionAction, type GuildMessage } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import { Args } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Role, GuildMember } from 'discord.js';

@ApplyOptions<CardinalSubcommand.Options>({
	permissionLevel: PermissionLevels.Moderator,
	name: 'restriction',
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
			messageRun: 'deny'
		},
		{
			name: 'delete',
			messageRun: 'delete'
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
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide either a valid role or a member')]
			});
		}

		// Permission Nodes do not allow allows for the @everyone role:
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

		await message.guild.settings.restrictions.add(target, command.name, action);

		return send(message, {
			embeds: [
				new CardinalEmbedBuilder()
					.setStyle('success')
					.setDescription(`Updated restrictions for ${target} for the command \`${command.name}\``)
			]
		});
	}

	public async remove(message: CardinalSubcommand.Message) {}

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
