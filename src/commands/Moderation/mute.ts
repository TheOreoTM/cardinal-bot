import { ModerationCommand, CardinalEmbedBuilder, Modlog } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { canManage, sendMessageAsGuild } from '#utils/functions';
import { ModerationType } from '#utils/moderationConstants';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { container } from '@sapphire/pieces';
import { send } from '@sapphire/plugin-editable-commands';
import { Duration, DurationFormatter } from '@sapphire/time-utilities';
import type { Nullish } from '@sapphire/utilities';
import type { GuildMember, Role } from 'discord.js';

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

		const isMuted = await this.isMuted(target.id);
		if (isMuted) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('That member is already muted')]
			});
		}

		await muteMember(message, target, message.member, muteRole, reason, duration);

		return;
	}

	private async isMuted(memberId: string) {
		const muteCount = await this.container.db.mute.count({
			where: {
				memberId
			}
		});

		return muteCount > 1;
	}
}

export async function muteMember(
	message: GuildMessage,
	target: GuildMember,
	staff: GuildMember,
	muteRole: Role,
	reason: string | null,
	duration?: Duration | Nullish
) {
	let modlog;
	let length: string | Nullish;

	if (duration) {
		const timeDifference = duration.offset;
		length = new DurationFormatter().format(timeDifference);

		modlog = new Modlog({
			member: target,
			staff: staff,
			type: ModerationType.Mute,
			length: length,
			reason: reason
		});
	} else {
		modlog = new Modlog({
			member: target,
			staff: staff,
			type: ModerationType.Mute,
			length: null,
			reason: reason
		});
	}

	const removedRoles = Array.from(target.roles.cache.keys());
	console.log('Mute command removed roles:', removedRoles);
	const boosterRole = target.guild.roles.premiumSubscriberRole;
	const rolesToAdd = [muteRole.id];

	if (boosterRole) {
		if (target.roles.cache.has(boosterRole.id)) rolesToAdd.push(boosterRole.id);
	}

	await target.roles.set(rolesToAdd).catch((err: Error) => {
		return send(message, {
			embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`${err.message}`)]
		});
	});

	send(message, {
		embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Muted ${getTag(target.user)} ${reason ? `| ${reason}` : ''}`)]
	});

	modlog.createMute({ expiresAt: duration?.fromNow, removedRoles });
	const data = await container.db.guild.findUnique({
		where: {
			guildId: message.guildId
		}
	});
	await sendMessageAsGuild(
		target.user,
		target.guild,
		{
			embeds: [
				new CardinalEmbedBuilder()
					.setStyle('info')
					.setDescription(`You have been muted ${length ? `for ${length}` : ''} for the reason: ${reason ?? 'No reason'}`)
			]
		},
		data?.appealLink
	);
}
