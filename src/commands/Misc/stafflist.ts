import { ApplyOptions } from '@sapphire/decorators';
import { Message } from 'discord.js';
import { CardinalCommand, CardinalEmbedBuilder } from '#lib/structures';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<CardinalCommand.Options>({
	description: 'Show the staff list',
	name: 'stafflist',
	detailedDescription: {
		extendedHelp: 'View all the admins, mods, staff and trainees in the server',
		usages: [''],
		examples: ['']
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
		interactionOrMessage: CardinalCommand.Message | CardinalCommand.ChatInputCommandInteraction | CardinalCommand.ContextMenuCommandInteraction
	) {
		const { guild } = interactionOrMessage;

		await guild.members.fetch();

		const adminRoleId = await interactionOrMessage.guild?.settings.roles.admin();
		const modRoleId = await interactionOrMessage.guild?.settings.roles.moderator();
		const staffRoleId = await interactionOrMessage.guild?.settings.roles.staff();
		const traineeRoleId = await interactionOrMessage.guild?.settings.roles.trainee();

		const adminRole = guild?.roles.cache.get(adminRoleId ?? '0');
		const modRole = guild?.roles.cache.get(modRoleId ?? '0');
		const staffRole = guild?.roles.cache.get(staffRoleId ?? '0');
		const traineeRole = guild?.roles.cache.get(traineeRoleId ?? '0');

		const admins = adminRole?.members.map((m) => m.id) ?? [];
		const mods = modRole?.members.map((m) => m.id) ?? [];
		const staffs = staffRole?.members.map((m) => m.id) ?? [];
		const trainees = traineeRole?.members.map((m) => m.id) ?? [];

		const adminSet = new Set(admins);
		const modSet = new Set(mods);
		const staffSet = new Set(staffs);
		// const traineeSet = new Set(trainees);

		const cleanedMods = mods.filter((userId) => !adminSet.has(userId));
		const cleanedStaffs = staffs.filter((userId) => !adminSet.has(userId) && !modSet.has(userId));
		const cleanedTrainees = trainees.filter((userId) => !adminSet.has(userId) && !modSet.has(userId) && !staffSet.has(userId));

		const embed = new CardinalEmbedBuilder()
			.setStyle('default')
			.setAuthor({ iconURL: guild.iconURL({ forceStatic: true }) ?? undefined, name: `${guild.name} - Staff Roles ` });
		if (admins.length && adminRole)
			embed.addFields({
				name: adminRole.name.slice(0, 256),
				value: `<@${admins.join('> <@')}>`
			});
		if (cleanedMods.length && modRole)
			embed.addFields({
				name: modRole.name.slice(0, 256),
				value: `<@${cleanedMods.join('> <@')}>`
			});
		if (cleanedStaffs.length && staffRole)
			embed.addFields({
				name: staffRole.name.slice(0, 256),
				value: `<@${cleanedStaffs.join('> <@')}>`
			});
		if (cleanedTrainees.length && traineeRole)
			embed.addFields({
				name: traineeRole.name.slice(0, 256),
				value: `<@${cleanedTrainees.join('> <@')}>`
			});

		return interactionOrMessage instanceof Message
			? send(interactionOrMessage, {
					embeds: [embed]
			  })
			: interactionOrMessage.reply({ embeds: [embed] });
	}
}
