import { ApplyOptions } from '@sapphire/decorators';
import { EmbedBuilder, GuildMember, Message } from 'discord.js';
import { CardinalCommand } from '#lib/structures';

@ApplyOptions<CardinalCommand.Options>({
	description: '',
	name: 'stafflist',
	detailedDescription: {
		extendedHelp: '',
		usages: [],
		examples: []
	}
})
export class stafflistCommand extends CardinalCommand {
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
		return this.sendStaffList(message);
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: CardinalCommand.ChatInputCommandInteraction) {
		return this.sendStaffList(interaction);
	}

	private async sendStaffList(
		interactionOrMessage: Message | CardinalCommand.ChatInputCommandInteraction | CardinalCommand.ContextMenuCommandInteraction
	) {
		const adminRoleId = await interactionOrMessage.guild?.settings.roles.admin();
		const modRoleId = await interactionOrMessage.guild?.settings.roles.moderator();
		const staffRoleId = await interactionOrMessage.guild?.settings.roles.staff();
		const traineeRoleId = await interactionOrMessage.guild?.settings.roles.trainee();

		const roleIds = [adminRoleId, modRoleId, staffRoleId, traineeRoleId];

		const membersByRole = new Map<string, GuildMember[]>();

		for (const roleId of roleIds) {
			const role = interactionOrMessage.guild?.roles.cache.get(roleId ?? '0');
			if (role) {
				membersByRole.set(
					role.id,
					role.members.map((m) => m)
				);
			}
		}

		const embed = new EmbedBuilder().setTitle('Staff Members').setColor('#3498db');

		const roleNames = ['Admins', 'Moderators', 'Staff', 'Trainees'];

		for (let i = 0; i < roleIds.length; i++) {
			const roleId = roleIds[i];
			const roleName = roleNames[i];

			const members = membersByRole.get(roleId ?? '0');

			if (members) {
				const filteredMembers = members.filter((member) => {
					// Check if the member has ONLY this role and no higher roles in the hierarchy
					const higherRoles = roleIds.slice(0, i);
					const lowerRoles = roleIds.slice(i + 1);
					return (
						membersByRole.get(roleId ?? '0')?.includes(member) &&
						!higherRoles.some((higherRoleId) => membersByRole.get(higherRoleId ?? '0')?.includes(member)) &&
						!lowerRoles.some((lowerRoleId) => membersByRole.get(lowerRoleId ?? '0')?.includes(member))
					);
				});

				if (filteredMembers.length > 0) {
					const memberNames = filteredMembers.map((member) => member.displayName).join(', ');
					embed.addFields({ name: roleName, value: memberNames });
				}
			}
		}

		await interactionOrMessage.reply({ embeds: [embed] });
	}
}
