import { CardinalEmbedBuilder, ModerationCommand } from '#lib/structures';
import { PermissionLevels } from '#lib/types';
import { mention } from '#utils/utils';
import type { Prisma } from '@prisma/client';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Configure the settings for the server.',
	name: 'config',
	// aliases: ['conf', 'configuration'],
	permissionLevel: PermissionLevels.Administrator,
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
				.addChannelOption((option) =>
					option //
						.setName('modlog_channel')
						.setDescription('The channel where the modlogs should be sent to')
				)
		);
	}

	public override async chatInputRun(interaction: ModerationCommand.ChatInputCommandInteraction) {
		const trainee_role = interaction.options.getRole('trainee_role');
		const staff_role = interaction.options.getRole('staff_role');
		const mod_role = interaction.options.getRole('mod_role');
		const admin_role = interaction.options.getRole('admin_role');
		const mute_role = interaction.options.getRole('mute_role');
		const modlog_channel = interaction.options.getChannel('modlog_channel');

		let data: Prisma.GuildCreateInput = {
			guildId: interaction.guildId
		};
		if (trainee_role) data.roleTrainee = trainee_role.id;
		if (staff_role) data.roleStaff = staff_role.id;
		if (mod_role) data.roleModerator = mod_role.id;
		if (admin_role) data.roleAdmin = admin_role.id;
		if (mute_role) data.roleMuted = mute_role.id;
		if (modlog_channel) data.channelModlog = modlog_channel.id;

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

	public override async messageRun(message: ModerationCommand.Message) {
		return send(message, `Use ${await mention('config', message.client)}`);
	}
}
