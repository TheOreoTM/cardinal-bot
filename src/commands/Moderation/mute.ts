import { ModerationCommand, CardinalEmbedBuilder, Modlog } from '#lib/structures';
import { canManage, sendMessageAsGuild } from '#utils/functions';
import { ModerationType } from '#utils/moderationConstants';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import { DurationFormatter } from '@sapphire/time-utilities';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Mute a member so they cannot type',
	name: 'mute',
	detailedDescription: {
		extendedHelp: 'Mute a member so they cannot type',
		usages: ['User Duration Reason', 'User Duration', 'User Reason', 'User'],
		examples: ['@Nooblance 10m shit posting', '@Alexander Not great', '@Shane']
	}
})
export class muteCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const target = await args.pick('member').catch(() => null);
		const duration = await args.pick('duration').catch(() => null);
		const reason = await args.rest('string').catch(() => null);
		const muteRole = message.guild.roles.cache.find((role) => role.name.toLowerCase() === 'muted');

		if (!target) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid member to mute')]
			});
		}

		if (!(await canManage(message.member, target))) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('I cant mute that member')]
			});
		}

		if (!muteRole) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription("I couldn't find role named `Muted`")]
			});
		}

		let modlog: Modlog;
		let length: string | null = null;

		if (duration) {
			const timeDifference = duration.offset;
			length = new DurationFormatter().format(timeDifference);

			modlog = new Modlog({
				member: target,
				staff: message.member,
				type: ModerationType.Mute,
				length: length,
				reason: reason
			});
		} else {
			modlog = new Modlog({
				member: target,
				staff: message.member,
				type: ModerationType.Mute,
				length: null,
				reason: reason
			});
		}

		await target.roles.add(muteRole).catch((err: Error) => {
			send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`${err.message}`)]
			});
		});

		await modlog.createMute({ expiresAt: duration?.fromNow });

		send(message, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Muted ${getTag(target.user)} ${reason ? `| ${reason}` : ''}`)]
		});
		await sendMessageAsGuild(target.user, target.guild, {
			embeds: [
				new CardinalEmbedBuilder()
					.setStyle('info')
					.setDescription(`You have been muted ${length ? `for ${length}` : ''} for the reason: ${reason ?? 'No reason'}`)
			]
		});

		return;
	}
}
