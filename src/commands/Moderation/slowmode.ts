import { CardinalEmbedBuilder, ModerationCommand } from '#lib/structures';
import { seconds } from '#utils/common';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import { Duration, DurationFormatter } from '@sapphire/time-utilities';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Change slowmode for a channel',
	name: 'slowmode',
	flags: ['off', 'remove', 'clear'],
	aliases: ['sm'],
	detailedDescription: {
		extendedHelp: 'Change the current slowmode for a channel',
		usages: ['Channel Slowmode', 'Slowmode', 'Channel', '--off'],
		examples: ['#general 2 seconds', '#memes 10 minutes and 30 seconds', '', '1 minute and 1 second', '#general --off'],
		explainedUsage: [
			['Slowmode', 'Just tell me what the slowmode should be in normal language (ie: 1 hour 1 minute and 30 seconds)'],
			['--off/--remove/--clear', 'Use this flag to clear the slowmode of a channel']
		]
	}
})
export class slowmodeCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const channel = await args.pick('guildTextChannel').catch(() => message.channel);
		const slowmode = await args.rest('duration').catch(() => null);
		const off = args.getFlags('off', 'remove', 'clear');

		if (off) {
			try {
				channel.setRateLimitPerUser(0);
				return send(message, {
					embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Removed slowmode for ${channel}`)]
				});
			} catch (error) {
				return send(message, {
					embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Something went wrong')]
				});
			} finally {
				return;
			}
		}

		if (!slowmode) {
			const currentSlowmode = new DurationFormatter().format(seconds(channel.rateLimitPerUser ?? 0));
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('info').setDescription(`Current slowmode for ${channel} is \`${currentSlowmode}\``)]
			});
		}

		if (slowmode.offset > new Duration('6 Hours').offset || slowmode.offset < new Duration('0 seconds').offset) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('info').setDescription(`Slowmode must be greater than 0 seconds and less than 6 hours.`)]
			});
		}
		try {
			console.log(slowmode.offset);
			await channel.setRateLimitPerUser(Math.floor(slowmode.offset / 1000)).then(() => {
				const formattedSlowmode = new DurationFormatter().format(slowmode.offset);
				if (channel.id !== message.channel.id) {
					channel.send({
						embeds: [
							new CardinalEmbedBuilder().setStyle('info').setDescription(`This channels slowmode has been set to ${formattedSlowmode}`)
						]
					});
				}
				return send(message, {
					embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Set slowmode for ${channel} to \`${formattedSlowmode}\``)]
				});
			});
		} catch (error) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Something went wrong')]
			});
		} finally {
			return;
		}
	}
}
