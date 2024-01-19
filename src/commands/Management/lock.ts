import { CardinalEmbedBuilder, ModerationCommand } from '#lib/structures';
import { seconds } from '#utils/common';
import { CardinalColors } from '#utils/constants';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { BucketScope } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { DurationFormatter } from '@sapphire/time-utilities';
import { PermissionsBitField } from 'discord.js';
import { TextChannel } from 'discord.js';

@ApplyOptions<ModerationCommand.Options>({
	name: 'lock',
	description: 'Lock a channel',
	requiredClientPermissions: ['ManageChannels'],
	detailedDescription: {
		extendedHelp: `This command will lock a channel, preventing users from sending messages, adding reaction, making and sending messages in threads in it. The bot will try to store the old permissions and then edit the permissions for the \`@everyone\` role to deny the permissions stated before.`,
		examples: ['', '#general', '#general 10m', '#general 10m "reason"', '#general 10m "reason" -s', '#general 10m "reason" -a'],
		usages: ['', 'Channel', 'Channel Duration', 'Channel Duration Reason', 'Channel Reason', 'Channel Duration Reason Flags'],
		possibleFormats: [['Channel', 'ID/Mention/Name']],
		explainedUsage: [
			['Channel', 'The channel to lock'],
			['Duration', 'The duration of the lock'],
			['Reason', 'The reason for the lock'],
			[
				'Flags',
				'The flags for the command, Use `-s`/`--silent` to make the command silent, and `-a`/`--anonymous` to make the command anonymous.'
			]
		]
	},
	flags: ['silent', 's', 'anonymous', 'a'],
	aliases: ['lockchannel'],
	cooldownDelay: seconds(20),
	cooldownScope: BucketScope.Guild,
	cooldownLimit: 3
})
export class lockCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const channel = await args.pick('guildTextChannel').catch(() => message.channel);
		const duration = await args.pick('duration').catch(() => null);
		const lockMessage = await args.pick('string').catch(() => null);
		const silent = args.getFlags('silent', 's');
		const anonymous = args.getFlags('anonymous', 'a');

		if (!(channel instanceof TextChannel)) {
			send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`The channel you provided is not a text channel.`)]
			});

			return;
		}

		if (this.isLocked(channel)) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`${channel} is already locked`)]
			});
		}

		const guild = channel.guild;

		channel.permissionOverwrites
			.edit(guild.roles.everyone, {
				SendMessages: false
			})
			.catch((e) => {
				send(message, {
					embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`I cant manage ${channel}: ${e}`)]
				});
			});

		if (lockMessage && !silent) {
			const embed = new CardinalEmbedBuilder()
				.setColor(CardinalColors.Info)
				.setAuthor({ name: 'Channel Locked' })
				.setDescription(`🔒 ${lockMessage}`);

			if (!anonymous) {
				embed
					.setColor(CardinalColors.Info)
					.setFooter({ text: `Locked by ${getTag(message.author)}`, iconURL: message.author.displayAvatarURL({ forceStatic: false }) });
			}

			channel.send({ embeds: [embed] }).catch();
		}

		if (duration) {
			const offset = duration.offset;
			this.container.tasks.create('UnlockChannelTask', { channelId: channel.id }, offset);
		}

		const formattedDuration = new DurationFormatter().format(duration?.offset ?? 0);
		send(message, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Locked ${channel} ${duration ? `for ${formattedDuration}` : ''}`)]
		});
		return;
	}

	private isLocked(channel: TextChannel) {
		const overwrites = channel.permissionOverwrites.cache.get(channel.guild.roles.everyone.id);
		if (!overwrites) return false;
		const permissionsBitField = new PermissionsBitField(overwrites.allow.bitfield);
		if (!permissionsBitField.has('SendMessages')) return true;
		return false;
	}
}
