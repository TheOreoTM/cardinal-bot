import { CardinalEmbedBuilder, LockdownManager, ModerationCommand } from '#lib/structures';
import { seconds } from '#utils/common';
import { ApplyOptions } from '@sapphire/decorators';
import { BucketScope } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { TextChannel } from 'discord.js';

@ApplyOptions<ModerationCommand.Options>({
	name: 'unlock',
	description: 'Unlock a channel',
	detailedDescription: {
		extendedHelp: `This command will unlock a channel, allowing users to send messages, add reaction, make and send messages in threads in it. The bot will try to restore the old permissions and then edit the permissions for the \`@everyone\`. If the bot cant find the old permissions, it will set the permissions to inherit.`,
		examples: ['', '#general'],
		usages: ['', 'Channel'],
		possibleFormats: [['Channel', 'ID/Mention/Name']],
		explainedUsage: [['Channel', 'The channel to unlock']]
	},
	aliases: ['unlockchannel'],
	cooldownDelay: seconds(20),
	cooldownScope: BucketScope.Guild,
	cooldownLimit: 3
})
export class lockCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const channel = await args.pick('guildTextChannel').catch(() => message.channel);

		if (!(channel instanceof TextChannel)) {
			send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`The channel you provided is not a text channel.`)]
			});

			return;
		}

		const guild = message.guild;
		const lockdownManager = new LockdownManager(guild);

		lockdownManager.unlockChannel(channel, null);

		const report = lockdownManager.report;
		const formattedReport = report.channels.map((r) => {
			return `${r.success ? '✅' : '❌'} <#${r.channelId}> ${r.error ? `(${r.error})` : ''}`;
		});

		const reportEmbed = new CardinalEmbedBuilder()
			.setStyle('info')
			.setAuthor({ name: `Locked ${report.channels.length} channels.` })
			.setFields({
				name: 'Report',
				value: formattedReport.length !== 0 ? formattedReport.join('\n') : 'No channels were locked.'
			});

		send(message, { embeds: [reportEmbed] });
	}
}
