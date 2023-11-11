import { CardinalEmbedBuilder, CardinalIndexBuilder, CardinalSubcommand, Modlog } from '#lib/structures';
import type { InteractionOrMessage } from '#lib/types';
import { sendInteractionOrMessage } from '#utils/functions';
import { ModerationType } from '#utils/moderationConstants';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { GuildMember } from 'discord.js';

@ApplyOptions<CardinalSubcommand.Options>({
	name: 'modafk',
	description: 'Moderate the AFK status of a member',
	detailedDescription: {
		extendedHelp: 'Reset or Clear the AFK status of a member in case that the member is abusing the AFK message',
		usages: ['reset User Reason', 'reset User', 'clear User Reason', 'clear User'],
		examples: ['reset @clink Text wall', 'clear @sed Advertising', 'reset @alex', 'reset @rainho'],
		explainedUsage: [
			['clear', 'Remove the AFK status of a member'],
			['reset', 'Reset the AFK status message to default for a member']
		]
	},
	subcommands: [
		{
			name: 'clear',
			messageRun: 'msgClear',
			chatInputRun: 'slashClear'
		},
		{
			name: 'reset',
			messageRun: 'msgReset',
			chatInputRun: 'slashReset'
		}
	]
})
export class modafkCommand extends CardinalSubcommand {
	// Register the application command
	public registerApplicationCommands(registry: CardinalSubcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand((cmd) =>
					cmd
						.setName('reset')
						.setDescription('Reset the AFK status message to default for a member')
						.addUserOption((option) =>
							option.setName('target').setDescription('The member you want to clear/remove the AFK status of').setRequired(true)
						)
						.addStringOption((option) => option.setName('reason').setDescription('The reason of the action'))
				)
				.addSubcommand((cmd) =>
					cmd
						.setName('clear')
						.setDescription('Remove the AFK status of a member')
						.addUserOption((option) =>
							option.setName('target').setDescription('The member you want to clear/remove the AFK status of').setRequired(true)
						)
						.addStringOption((option) => option.setName('reason').setDescription('The reason of the action'))
				)
		);
	}

	// Remove the AFK status of a member
	public async msgClear(message: CardinalSubcommand.Message, args: CardinalSubcommand.Args) {
		const target = await args.pick('member').catch(() => {
			return this.error({ identifier: 'NoTarget', message: 'Provide a valid member' });
		});
		const reason = await args.pick('string').catch(() => 'No reason');

		return this.clear(message, { reason, target, staff: message.member });
	}

	public async slashClear(interaction: CardinalSubcommand.ChatInputCommandInteraction) {
		const target = interaction.options.getMember('target');
		if (!target) {
			return interaction.reply({
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid member in the server')]
			});
		}
		const reason = interaction.options.getString('reason', false) ?? 'No reason';

		return this.clear(interaction, { reason, staff: interaction.member, target });
	}

	private async clear(
		interactionOrMessage: InteractionOrMessage,
		{ target, staff, reason }: { reason: string; target: GuildMember; staff: GuildMember }
	) {
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

		const modlog = new Modlog({
			member: target,
			staff: staff,
			type: ModerationType.AfkClear,
			reason: reason,
			caseId: await new CardinalIndexBuilder().modlogId(staff.guild.id)
		});

		if (target.manageable) {
			target.setNickname(afkData.afkNick);
		}

		await modlog.createAfkClear();

		return sendInteractionOrMessage(interactionOrMessage, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Cleared the afk status of ${getTag(target.user)}`)]
		});
	}

	// Reset the AFK status message to default for a member.
	public async msgReset(message: CardinalSubcommand.Message, args: CardinalSubcommand.Args) {
		const target = await args.pick('member').catch(() => {
			return this.error({ identifier: 'NoTarget', message: 'Provide a valid member' });
		});

		const reason = await args.pick('string').catch(() => 'No reason');

		return this.reset(message, { target, reason, staff: message.member });
	}

	public async slashReset(interaction: CardinalSubcommand.ChatInputCommandInteraction) {
		const target = interaction.options.getMember('target');
		if (!target) {
			return interaction.reply({
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid member in the server')]
			});
		}
		const reason = interaction.options.getString('reason', false) ?? 'No reason';

		return this.reset(interaction, { reason, staff: interaction.member, target });
	}

	private async reset(
		interactionOrMessage: InteractionOrMessage,
		{ target, staff, reason }: { reason: string; target: GuildMember; staff: GuildMember }
	) {
		await this.container.db.afk
			.update({
				where: {
					memberId_guildId: {
						memberId: target.id,
						guildId: target.guild.id
					}
				},
				data: {
					afkMessage: 'AFK'
				}
			})
			.catch(() => {
				this.error({
					message: 'That member is not afk',
					identifier: 'NotAFK'
				});
			});

		const modlog = new Modlog({
			member: target,
			staff: staff,
			type: ModerationType.AfkReset,
			reason: reason,
			caseId: await new CardinalIndexBuilder().modlogId(staff.guild.id)
		});

		await modlog.createAfkReset();

		return sendInteractionOrMessage(interactionOrMessage, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Reset the afk status of ${getTag(target.user)}`)]
		});
	}
}
