import { CardinalEmbedBuilder, LockdownManager, ModerationCommand } from '#lib/structures';
import { seconds } from '#utils/common';
import { ApplyOptions } from '@sapphire/decorators';
import { BucketScope } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { TextChannel } from 'discord.js';

@ApplyOptions<ModerationCommand.Options>({
	name: 'lock',
	description: 'Lock a channel',
	detailedDescription: {
		extendedHelp: `This command will lock a channel, preventing users from sending messages, adding reaction, making and sending messages in threads in it. The bot will try to store the old permissions and then edit the permissions for the \`@everyone\` role to deny the permissions stated before.`,
		examples: ['', '#general'],
		usages: ['', 'Channel'],
		possibleFormats: [['Channel', 'ID/Mention/Name']],
		explainedUsage: [['Channel', 'The channel to lock']]
	},
	aliases: ['lockchannel'],
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

		lockdownManager.lockChannel(channel);

		const report = lockdownManager.report;
		const formattedReport = report.channels.map((r) => {
			return `${r.success ? '✅' : '❌'} <@${r.channelId}> ${r.error ? `(${r.error})` : ''}`;
		});

		const reportEmbed = new CardinalEmbedBuilder()
			.setStyle('info')
			.setAuthor({ name: `Locked ${report.channels.length} channels.` })
			.setFields({
				name: 'Report',
				value: formattedReport.join('\n')
			});

		send(message, { embeds: [reportEmbed] });
	}
}
