import { CardinalEmbedBuilder, ModerationCommand } from '#lib/structures';
import type { Automod, AutomodRule, InteractionOrMessage } from '#lib/types';
import { days, minutes } from '#utils/common';
import { CardinalEmojis } from '#utils/constants';
import { sendInteractionOrMessage } from '#utils/functions';
import { AutomodRules, type ModerationActionType } from '#utils/moderationConstants';
import type { AutomodBannedWords, AutomodInviteLinks } from '@prisma/client';
import { ApplyOptions } from '@sapphire/decorators';
import { Duration, DurationFormatter } from '@sapphire/time-utilities';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildMember, type EmbedField, type MessageCreateOptions } from 'discord.js';

const AutomodRuleChoices = AutomodRules.map((rule) => ({
	name: rule.readableName,
	value: rule.dbValue
}));

@ApplyOptions<ModerationCommand.Options>({
	description: 'Automod Settings',
	name: 'automod'
})
export class automodCommand extends ModerationCommand {
	public registerApplicationCommands(registry: ModerationCommand.Registry) {
		registry.registerChatInputCommand(
			(builder) =>
				builder
					.setName(this.name)
					.setDescription(this.description)
					.addSubcommand((builder) =>
						builder
							.setName('view')
							.setDescription('View an automod rule')
							.addStringOption((option) =>
								option
									.setName('rule')
									.setDescription('The rule you want to view the settings for')
									.setRequired(true)
									.addChoices(...AutomodRuleChoices)
							)
					) // view
					.addSubcommandGroup(
						(builder) =>
							builder
								.setName('affected-channels')
								.setDescription('Add/Remove a channel from the affected channels list')
								.addSubcommand((builder) =>
									builder
										.setName('add')
										.setDescription('Add a channel to the affected channel list')
										.addStringOption((option) =>
											option
												.setName('rule')
												.setDescription('The rule you want to change the setting for')
												.setRequired(true)
												.addChoices(...AutomodRuleChoices)
										)
										.addChannelOption((option) =>
											option.setName('channel').setDescription('The channel you want to add').setRequired(true)
										)
								) // add
								.addSubcommand((builder) =>
									builder
										.setName('remove')
										.setDescription('Remove a channel to the affected channels list')
										.addStringOption((option) =>
											option
												.setName('rule')
												.setDescription('The rule you want to change the setting for')
												.addChoices(...AutomodRuleChoices)
												.setRequired(true)
										)
										.addChannelOption((option) =>
											option.setName('channel').setDescription('The channel you want to remove').setRequired(true)
										)
								) // remove
					) // affected channels
					.addSubcommandGroup(
						(builder) =>
							builder
								.setName('affected-roles')
								.setDescription('Add/Remove a role from the affected roles list')
								.addSubcommand((builder) =>
									builder
										.setName('add')
										.setDescription('Add a role to the affected roles list')
										.addStringOption((option) =>
											option
												.setName('rule')
												.setDescription('The rule you want to change the setting for')
												.setRequired(true)
												.addChoices(...AutomodRuleChoices)
										)
										.addRoleOption((option) =>
											option.setName('role').setDescription('The role you want to add').setRequired(true)
										)
								) // add
								.addSubcommand((builder) =>
									builder
										.setName('remove')
										.setDescription('Remove a role to the affected roles list')
										.addStringOption((option) =>
											option
												.setName('rule')
												.setDescription('The rule you want to change the setting for')
												.addChoices(...AutomodRuleChoices)
												.setRequired(true)
										)
										.addRoleOption((option) =>
											option.setName('role').setDescription('The role you want to remove').setRequired(true)
										)
								) // remove
					) // affected roles
					.addSubcommandGroup((builder) =>
						builder
							.setName('automute')
							.setDescription('Change the automute settings for a specific rule')
							.addSubcommand((builder) =>
								builder
									.setName('duration')
									.setDescription('The duration the automute should last')
									.addStringOption((option) =>
										option
											.setName('rule')
											.setDescription('The rule you want to change the setting for')
											.addChoices(...AutomodRuleChoices)
											.setRequired(true)
									)
									.addStringOption((option) =>
										option.setName('duration').setDescription('The duration (eg: 2m, 1d30m)').setRequired(true)
									)
							)
							.addSubcommand((builder) =>
								builder
									.setName('after')
									.setDescription('The number of infractions that is required for the automute to engage')
									.addStringOption((option) =>
										option
											.setName('rule')
											.setDescription('The rule you want to change the setting for')

											.addChoices(...AutomodRuleChoices)
											.setRequired(true)
									)
									.addNumberOption((option) =>
										option
											.setName('amount')
											.setDescription('The amount of minimum infractions required')
											.setRequired(true)
											.setMaxValue(5)
											.setMinValue(1)
									)
							)
					) // automute
					.addSubcommandGroup((builder) =>
						builder
							.setName('action')
							.setDescription('Add/remove actions')
							.addSubcommand((builder) =>
								builder
									.setName('add')
									.setDescription('Add an action')
									.addStringOption((option) =>
										option
											.setName('rule')
											.setDescription('The rule you want to change the setting for')
											.addChoices(...AutomodRuleChoices)
											.setRequired(true)
									)
									.addStringOption((option) =>
										option.setName('action').setDescription('The action you want to add').setRequired(true).addChoices(
											{
												name: 'Warn',
												value: 'warn'
											},
											{
												name: 'Automute',
												value: 'automute'
											},
											{
												name: 'Perma Mute',
												value: 'mute'
											},
											{
												name: 'Kick',
												value: 'kick'
											},
											{
												name: 'Instant Ban',
												value: 'ban'
											}
										)
									)
							)
							.addSubcommand((builder) =>
								builder
									.setName('remove')
									.setDescription('Remove an action')
									.addStringOption((option) =>
										option
											.setName('rule')
											.setDescription('The rule you want to change the setting for')
											.addChoices(...AutomodRuleChoices)
											.setRequired(true)
									)
									.addStringOption((option) =>
										option.setName('action').setDescription('The action you want to remove').setRequired(true).addChoices(
											{
												name: 'Warn',
												value: 'warn'
											},
											{
												name: 'Auto Mute',
												value: 'automute'
											},
											{
												name: 'Perma Mute',
												value: 'mute'
											},
											{
												name: 'Kick',
												value: 'kick'
											},
											{
												name: 'Instant Ban',
												value: 'ban'
											}
										)
									)
							)
					) // actions
					.addSubcommandGroup(
						(builder) =>
							builder
								.setName('banned-words')
								.setDescription('Modify the banned words specific automod rule')
								.addSubcommand((builder) =>
									builder
										.setName('add')
										.setDescription('Add a word to the banned words list')
										.addStringOption((option) =>
											option.setName('word').setDescription('The word you want to add').setRequired(true)
										)
										.addStringOption((option) =>
											option
												.setName('type')
												.setDescription('Whether the word is an exact match or a wildcard')

												.addChoices(
													{
														name: 'Wild Card',
														value: 'wildcard'
													},
													{
														name: 'Exact Match',
														value: 'exact'
													}
												)
												.setRequired(true)
										)
								)
								.addSubcommand((builder) =>
									builder
										.setName('remove')
										.setDescription('Remove a word from the banned words list')
										.addStringOption((option) =>
											option
												.setName('word')
												.setDescription('The word you want to remove')
												.setRequired(true)
												.setMinLength(1)
												.setAutocomplete(true)
										)
								)
						// .addSubcommand((builder) => builder.setName('list').setDescription('List all the banned words'))
					) // banned words
		);
	}

	public async chatInputRun(interaction: ModerationCommand.ChatInputCommandInteraction) {
		const guild = interaction.guild;
		const subcommand = interaction.options.getSubcommand(true) as SubcommandType;
		const rule = interaction.options.getString('rule', false) as AutomodRule;

		if (subcommand === 'view') {
			this.handleViewRule(interaction, rule);
			return;
		}
		const subcommandGroup = interaction.options.getSubcommandGroup(true) as SubcommandGroupType;

		switch (subcommandGroup) {
			case 'action':
				const action = interaction.options.getString('action', true) as ModerationActionType;
				if (subcommand === 'add') await guild.settings.automod.addAction(rule, action);
				if (subcommand === 'remove') await guild.settings.automod.removeAction(rule, action);
				interaction.reply({
					embeds: [
						new CardinalEmbedBuilder()
							.setStyle('success')
							.setDescription(
								`Successfully ${subcommand === 'remove' ? 'removed' : 'added'} \`${action}\` as an action for \`${rule}\``
							)
					]
				});
				break;
			case 'affected-channels':
				const channel = interaction.options.getChannel('channel', true);
				if (subcommand === 'add') await guild.settings.automod.addAffectedChannel(rule, channel.id);
				if (subcommand === 'remove') await guild.settings.automod.removeAffectedChannel(rule, channel.id);
				interaction.reply({
					embeds: [
						new CardinalEmbedBuilder()
							.setStyle('success')
							.setDescription(
								`Successfully ${subcommand === 'remove' ? 'removed' : 'added'} \`${channel}\` as an affected channel for \`${rule}\``
							)
					]
				});
				break;
			case 'affected-roles':
				const role = interaction.options.getRole('role', true);
				if (subcommand === 'add') await guild.settings.automod.addAffectedRole(rule, role.id);
				if (subcommand === 'remove') await guild.settings.automod.removeAffectedRole(rule, role.id);
				interaction.reply({
					embeds: [
						new CardinalEmbedBuilder()
							.setStyle('success')
							.setDescription(
								`Successfully ${subcommand === 'remove' ? 'removed' : 'added'} \`${role}\` as an affected role for \`${rule}\``
							)
					]
				});
				break;
			case 'automute':
				let durationText: string | null = null;
				let amountText: string | null = null;
				if (subcommand === 'after') {
					const amount = interaction.options.getNumber('amount', true);
					await guild.settings.automod.setAutomuteAfter(rule, amount);
					amountText = amount.toString();
				}
				if (subcommand === 'duration') {
					const durationInput = interaction.options.getString('duration', true);
					const duration = new Duration(durationInput);
					if (!duration || duration.offset > days(7) || duration.offset < minutes(1)) {
						await interaction.reply({
							embeds: [
								new CardinalEmbedBuilder()
									.setStyle('fail')
									.setDescription('Duration should be greater than 1 minute and less than 7 days')
							]
						});
						return;
					}

					await guild.settings.automod.setAutomuteDuration(rule, duration.offset);
					const formatter = new DurationFormatter();
					durationText = formatter.format(duration.offset).toString();
				}

				interaction.reply({
					embeds: [
						new CardinalEmbedBuilder()
							.setStyle('success')
							.setDescription(
								`Successfully set \`automute ${subcommand}\` for \`${rule}\` as \`${
									durationText ? durationText : amountText ? amountText : '_'
								}\``
							)
					]
				});
				break;
			case 'banned-words':
				const word = interaction.options.getString('word', true);
				const type = interaction.options.getString('type', false) as 'exact' | 'wildcard';
				let wordText: string | null = null;
				let typeText: string | null = type;
				if (subcommand === 'add') await guild.settings.automod.addBannedWord(word, type);
				if (subcommand === 'remove') {
					const data = JSON.parse(word) as { word: string; type: 'exact' | 'wildcard' };
					await guild.settings.automod.removeBannedWord(data.word, data.type);
					wordText = data.word;
					typeText = data.type;
				}

				interaction.reply({
					embeds: [
						new CardinalEmbedBuilder()
							.setStyle('success')
							.setDescription(
								`Successfully ${subcommand === 'remove' ? 'removed' : 'added'} ||\`${wordText}\`|| as ${
									typeText === 'exact' ? 'an' : 'a'
								} ${typeText} match`
							)
					]
				});

				break;
			case 'capitalization':
				break;
			case 'link-cooldown':
			case 'links':
			case 'mass-mention':
			case 'new-lines':
			case 'spam':
			case 'stickers':
			default:
				break;
		}
	}

	// public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
	// 	const rule = await args.pick('automodRule').catch(() => null);
	// 	if (!rule) {
	// 		message.channel.send({
	// 			embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Please provide a valid automod rule, eg: `bannedWords`')]
	// 		});

	// 		return;
	// 	}
	// 	this.handleViewRule(message, rule);
	// }

	private handleViewRule(iom: InteractionOrMessage, rule: AutomodRule) {
		switch (rule) {
			case 'bannedWords':
				this.sendBannedWordsRule(iom);
				break;
			case 'inviteLinks':
				this.sendInviteLinksRule(iom);
				break;
			default:
				break;
		}
	}

	private async sendInviteLinksRule(iom: InteractionOrMessage) {
		const data = await iom.guild.settings.automod.getSetting<AutomodInviteLinks>('inviteLinks');
		const message = await this.buildRuleEmbed(iom, 'inviteLinks', data);

		await sendInteractionOrMessage(iom, message);
	}

	private async sendBannedWordsRule(iom: InteractionOrMessage) {
		const data = await iom.guild.settings.automod.getSetting<AutomodBannedWords>('bannedWords');

		const customFields: EmbedField[] = [
			{
				name: 'Exact Matches',
				value: `${data?.exact.length !== 0 && data !== null ? data.exact.map((w) => `\`${w}\``).join(' ') : 'None'}`,
				inline: true
			},
			{
				name: 'Wildcards Matches',
				value: `${data?.wildcard.length !== 0 && data ? data.wildcard.map((w) => `\`${w}\``).join(' ') : 'None'}`,
				inline: true
			}
		];

		const message = await this.buildRuleEmbed(iom, 'bannedWords', data, customFields);

		await sendInteractionOrMessage(iom, message);
	}

	private async buildRuleEmbed(
		iom: InteractionOrMessage,
		rule: AutomodRule,
		data: Automod | null,
		customFields?: EmbedField[]
	): Promise<MessageCreateOptions> {
		let ruleName = '';

		switch (rule) {
			case 'bannedWords':
				ruleName = 'Banned Words';
				break;
			case 'inviteLinks':
				ruleName = 'Invite Links';
				break;
			default:
				ruleName = 'Unknown Rule';
				break;
		}

		let embed = new CardinalEmbedBuilder()
			.setStyle('default')
			.setTitle(`Automod: ${ruleName}`)
			.setDescription(
				[
					'Update the banned words settings for the server',
					'',
					`Status: ${data?.enabled ?? false ? CardinalEmojis.Online : CardinalEmojis.Invisible}`
				].join('\n')
			)
			.setFields(
				{
					name: 'Automute Settings',
					value: [
						`Automute After: \`${data?.automuteAfter ? `${data.automuteAfter} Infractions` : '-'}\`` ?? 'None',
						`Automute For: __${data?.automuteDuration ? `${new DurationFormatter().format(data.automuteDuration)}` : '-'}__` ?? 'None'
					].join('\n')
				},
				{
					name: 'Permissions',
					value: [
						`Affected Roles: ${data?.affectedRoles ? data.affectedRoles.map((r) => `<@&${r}>`) : '-'}` ?? 'None',
						`Ignored Roles: ${data?.ignoredRoles ? data.ignoredRoles.map((r) => `<@&${r}>`) : '-'}` ?? 'None',
						`Affected Channels: ${data?.affectedChannels ? data.affectedChannels.map((r) => `<#${r}>`) : '-'}` ?? 'None',
						`Ignored Channels: ${data?.ignoredChannels ? data.ignoredChannels.map((r) => `<#${r}>`) : '-'}` ?? 'None'
					].join('\n')
				},
				{
					name: 'Additional Options ⭐',
					value: `Custom Reponse: ${data?.response ?? '-'}` ?? 'None'
				}
			);

		if (customFields) embed = this.addFieldsToStart(embed, customFields);
		const button = this.buildToggleButton(data?.enabled ?? false, iom.member, rule);
		const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
		return {
			embeds: [embed],
			components: [actionRow]
		};
	}

	private buildToggleButton(enabled: boolean, member: GuildMember, rule: AutomodRule) {
		const toggleButton = new ButtonBuilder()
			.setLabel(`${enabled ? 'Disable' : 'Enable'}`)
			.setEmoji(`${enabled ? CardinalEmojis.Invisible : CardinalEmojis.Online}`)
			.setStyle(enabled ? ButtonStyle.Secondary : ButtonStyle.Success)
			.setCustomId(`${enabled ? 'disable' : 'enable'}rule-${member.id}-${rule}`);

		return toggleButton;
	}

	private addFieldsToStart(embed: CardinalEmbedBuilder, field: EmbedField[]) {
		const fields = embed.data.fields ?? [];
		if (fields.length === 0) {
			embed.setFields(...field);
			return embed;
		}

		const newFields = [...field, ...fields];
		embed.setFields(...newFields);
		return embed;
	}
}

type SubcommandGroupType =
	| 'affected-channels'
	| 'affected-roles'
	| 'automute'
	| 'action'
	| 'banned-words'
	| 'capitalization'
	| 'invite-links'
	| 'link-cooldown'
	| 'links'
	| 'mass-mention'
	| 'new-lines'
	| 'spam'
	| 'stickers';
type SubcommandType = 'add' | 'remove' | 'duration' | 'after' | 'view';
