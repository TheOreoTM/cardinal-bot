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
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const prefix = await args.pick('string', { minimum: 1, maximum: 10 }).catch(() => null);

		if (!prefix) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a new valid prefix')]
			});
		}

		await this.container.db.guild.upsert({
			where: {
				guildId: message.guildId
			},
			create: {
				prefix: prefix,
				guildId: message.guildId
			},
			update: {
				prefix: prefix
			}
		});

		return send(message, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Set prefix to \`${prefix}\``)]
		});
	}
}
