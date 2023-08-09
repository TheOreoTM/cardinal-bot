import { CardinalEmbedBuilder, CardinalSubcommand, Modlog } from '#lib/structures';
import { ModerationType } from '#utils/moderationConstants';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<CardinalSubcommand.Options>({
	name: 'modafk',
	detailedDescription: {
		extendedHelp: '',
		usages: [],
		examples: []
	},
	subcommands: [
		{
			name: 'clear',
			messageRun: 'clear'
		},
		{
			name: 'reset',
			messageRun: 'reset'
		}
	]
})
export class modafkCommand extends CardinalSubcommand {
	// Remove the AFK status of a member
	public async clear(message: CardinalSubcommand.Message, args: CardinalSubcommand.Args) {
		const target = await args.pick('member').catch(() => {
			return this.error({ identifier: 'NoTarget', message: 'Provide a valid member' });
		});

		const afkData = await this.container.db.afk.delete({
			where: {
				memberId_guildId: {
					memberId: target.id,
					guildId: target.guild.id
				}
			}
		});

		if (!afkData) {
			return this.error({
				message: 'That member is not afk',
				identifier: 'NotAFK'
			});
		}

		return send(message, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Cleared the afk status of ${getTag(target.user)}`)]
		});
	}

	// Reset the AFK status message to default for a member.
	public async reset(message: CardinalSubcommand.Message, args: CardinalSubcommand.Args) {
		const target = await args.pick('member').catch(() => {
			return this.error({ identifier: 'NoTarget', message: 'Provide a valid member' });
		});

		const reason = await args.pick('string').catch(() => 'No reason');

		const afkData = await this.container.db.afk.update({
			where: {
				memberId_guildId: {
					memberId: target.id,
					guildId: target.guild.id
				}
			},
			data: {
				afkMessage: 'AFK'
			}
		});

		if (!afkData) {
			return this.error({
				message: 'That member is not afk',
				identifier: 'NotAFK'
			});
		}

		const modlog = new Modlog({
			member: target,
			staff: message.member,
			type: ModerationType.AfkReset,
			reason: reason
		});

		await modlog.createAfkReset();

		return send(message, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Reset the AFK status message for ${getTag(target.user)}`)]
		});
	}
}
