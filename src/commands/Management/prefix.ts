import { CardinalEmbedBuilder, ModerationCommand } from '#lib/structures';
import { PermissionLevels } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Change the prefix of the bot',
	name: 'prefix',
	permissionLevel: PermissionLevels.Administrator,
	detailedDescription: {
		extendedHelp: 'Change the prefix of the bot in this server',
		usages: ['Prefix'],
		examples: ['>', '?']
	}
})
export class prefixCommand extends ModerationCommand {
	public registerApplicationCommands(registry: ModerationCommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) =>
					option.setName('prefix').setDescription('The new prefix').setRequired(true).setMaxLength(10).setMinLength(1)
				)
		);
	}

	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const prefix = await args.pick('string', { minimum: 1, maximum: 10 }).catch(() => null);

		if (!prefix) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a new valid prefix')]
			});
		}

		await this.setPrefix(message.guildId, prefix);

		return send(message, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Set prefix to \`${prefix}\``)]
		});
	}

	public async chatInputRun(interaction: ModerationCommand.ChatInputCommandInteraction) {
		const prefix = interaction.options.getString('prefix', true);

		await this.setPrefix(interaction.guildId, prefix);

		interaction.reply({
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Set prefix to \`${prefix}\``)]
		});
	}

	private async setPrefix(guildId: string, prefix: string) {
		await this.container.db.guild.upsert({
			where: {
				guildId: guildId
			},
			create: {
				prefix: prefix,
				guildId: guildId
			},
			update: {
				prefix: prefix
			}
		});
	}
}
