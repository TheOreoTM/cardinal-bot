import { ModerationCommand, CardinalEmbedBuilder, Modlog } from '#lib/structures';
import { days } from '#utils/common';
import { canManage, sendMessageAsGuild } from '#utils/functions';
import { ModerationType } from '#utils/moderationConstants';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import { DurationFormatter } from '@sapphire/time-utilities';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Ban a member from a guild',
	name: 'ban',
	detailedDescription: {
		extendedHelp: 'Ban a member from the server',
		usages: ['User Duration Reason', 'User Duration', 'User Reason', 'User'],
		examples: ['@sion 2d raid 🦶', '@tms 14d', '@thriller By order of the sionists']
	}
})
export class banCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const target = await args.pick('member').catch(() => null);
		const duration = await args.pick('duration').catch(() => null);
		const reason = await args.rest('string').catch(() => null);

		if (!target) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid member to ban')]
			});
		}

		if (!(await canManage(message.member, target))) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('I cant ban that member')]
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
				type: ModerationType.Ban,
				length: length,
				reason: reason
			});
		} else {
			modlog = new Modlog({
				member: target,
				staff: message.member,
				type: ModerationType.Ban,
				length: null,
				reason: reason
			});
		}

		if (!target.bannable || !target.manageable || !target.moderatable) {
			send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('I cant ban that user')]
			});
		}

		await sendMessageAsGuild(target.user, target.guild, {
			embeds: [
				new CardinalEmbedBuilder()
					.setStyle('info')
					.setDescription(`You have been banned ${length ? `for ${length}` : ''} for the reason: ${reason ?? 'No reason'}`)
			]
		});

		await target.ban({ reason: reason ?? 'No reason', deleteMessageSeconds: Math.floor(days(5) / 1000) }).catch((err: Error) => {
			send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`${err.message}`)]
			});
		});

		await modlog.createBan({ expiresAt: duration?.fromNow });

		send(message, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Banned ${getTag(target.user)} ${reason ? `| ${reason}` : ''}`)]
		});

		return;
	}
}
