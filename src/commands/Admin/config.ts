import { CardinalEmbedBuilder, ModerationCommand } from '#lib/structures';
import type { Prisma } from '@prisma/client';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Configure the settings for the server.',
	name: 'config',
	// aliases: ['conf', 'configuration'],
	detailedDescription: {
		extendedHelp: '',
		usages: [],
		examples: []
	}
})
export class setupCommand extends ModerationCommand {
	public override registerApplicationCommands(registry: ModerationCommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addRoleOption((option) =>
					option //
						.setName('trainee_role')
						.setDescription('The role that should be considered as trainee')
				)
				.addRoleOption((option) =>
					option //
						.setName('staff_role')
						.setDescription('The role that should be considered as staff')
				)
				.addRoleOption((option) =>
					option //
						.setName('mod_role')
						.setDescription('The role that should be considered as moderator')
				)
				.addRoleOption((option) =>
					option //
						.setName('admin_role')
						.setDescription('The role that should be considered as admin')
				)
				.addRoleOption((option) =>
					option //
						.setName('mute_role')
						.setDescription('The role that should be given when muting someone')
				)
		);
	}

	public override async chatInputRun(interaction: ModerationCommand.ChatInputCommandInteraction) {
		const trainee_role = interaction.options.getRole('trainee_role');
		const staff_role = interaction.options.getRole('staff_role');
		const mod_role = interaction.options.getRole('mod_role');
		const admin_role = interaction.options.getRole('admin_role');
		const mute_role = interaction.options.getRole('mute_role');

		let data: Prisma.GuildCreateInput = {
			guildId: interaction.guildId
		};
		if (trainee_role) data.roleTrainee = trainee_role.id;
		if (staff_role) data.roleStaff = staff_role.id;
		if (mod_role) data.roleModerator = mod_role.id;
		if (admin_role) data.roleAdmin = admin_role.id;
		if (mute_role) data.roleMuted = mute_role.id;

		const embed = new CardinalEmbedBuilder().setStyle('success').setDescription('Updated server configuration');

		await this.container.db.guild.upsert({
			where: {
				guildId: interaction.guildId
			},
			create: data,
			update: data
		});

		interaction.reply({ embeds: [embed] });
	}
}
