import { CardinalEmbedBuilder, ModerationCommand } from '#lib/structures';
import { CardinalEmojis } from '#utils/constants';
import { sendInteractionOrMessage } from '#utils/functions';
import type { AutomodBannedWords } from '@prisma/client';
import { ApplyOptions } from '@sapphire/decorators';
import { DurationFormatter } from '@sapphire/time-utilities';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

@ApplyOptions<ModerationCommand.Options>({
	description: 'ADD',
	name: 'automod'
})
export class automodCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const rule = await args.pick('automodRule');
		switch (rule) {
			case 'bannedWords':
				this.sendBannedWordsRule(message);
				break;

			default:
				break;
		}
	}

	private async sendBannedWordsRule(interactionOrMessage: ModerationCommand.Message | ModerationCommand.ChatInputCommandInteraction) {
		const data = await interactionOrMessage.guild.settings.automod.getSetting<AutomodBannedWords>('bannedWords');
		const embed = new CardinalEmbedBuilder()
			.setStyle('default')
			.setTitle('Automod: Banned Words')
			.setDescription(
				[
					'Update the banned words settings for the server',
					'',
					`Status: ${data?.enabled ?? false ? CardinalEmojis.Online : CardinalEmojis.Invisible}`
				].join('\n')
			)
			.setFields(
				{
					name: 'Exact Matches',
					value: `${data?.exact.map((w) => `\`${w}\``) ?? 'None'}`,
					inline: true
				},
				{
					name: 'Wildcards Matches',
					value: `${data?.wildcard.map((w) => `\`${w}\``) ?? 'None'}`,
					inline: true
				},
				{
					name: 'Actions',
					value: `${data?.actions.map((a) => `\`${a}\``) ?? 'None'}`,
					inline: true
				},
				{
					name: 'Automute Settings',
					value: [
						`Automute After: ${data?.automuteAfter ? `${data.automuteAfter} Infractions` : '-'}`,
						`Automute For: ${data?.automuteDuration ? `${new DurationFormatter().format(data.automuteDuration)} ` : '-'}`
					].join('\n')
				},
				{
					name: 'Permissions',
					value: [
						`Affected Roles: ${data?.affectedRoles ? data.affectedRoles.map((r) => `<@&${r}>`) : '-'}`,
						`Ignored Roles: ${data?.ignoredRoles ? data.ignoredRoles.map((r) => `<@&${r}>`) : '-'}`,
						`Affected Channels: ${data?.affectedChannels ? data.affectedChannels.map((r) => `<#${r}>`) : '-'}`,
						`Ignored Channels: ${data?.ignoredChannels ? data.ignoredChannels.map((r) => `<#${r}>`) : '-'}`
					].join('\n')
				},
				{
					name: 'Additional Options ⭐',
					value: `Custom Reponse: ${data?.response ?? '-'}`
				}
			);

		const toggleButton = new ButtonBuilder()
			.setLabel(`${data?.enabled ?? false ? 'Disable' : 'Enable'}`)
			.setEmoji(`${data?.enabled ?? false ? CardinalEmojis.Invisible : CardinalEmojis.Online}`)
			.setStyle(data?.enabled ?? false ? ButtonStyle.Danger : ButtonStyle.Success)
			.setCustomId(`${data?.enabled ?? false ? 'disable' : 'enable'}-'rule-bannedWords`);

		sendInteractionOrMessage(interactionOrMessage, {
			embeds: [embed],
			components: [new ActionRowBuilder<ButtonBuilder>().addComponents(toggleButton)]
		});
	}
}
