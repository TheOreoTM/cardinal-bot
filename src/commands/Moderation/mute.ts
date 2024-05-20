import { ModerationCommand, CardinalEmbedBuilder, Modlog } from '#lib/structures';
import { canManage, sendMessageAsGuild } from '#utils/functions';
import { ModerationType } from '#utils/moderationConstants';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { container } from '@sapphire/pieces';
import { send } from '@sapphire/plugin-editable-commands';
import { DurationFormatter } from '@sapphire/time-utilities';
import type { Nullish } from '@sapphire/utilities';
import type { Guild, GuildMember, Role } from 'discord.js';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Mute a member so they cannot type',
	name: 'mute',
	detailedDescription: {
		extendedHelp: 'Mute a member so they cannot type',
		usages: ['User Duration Reason', 'User Duration', 'User Reason', 'User'],
		examples: ['@Tex 10m shit posting', '@Alexander Not great', '@Shane']
	}
})
export class muteCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const target = await args.pick('member').catch(() => null);
		const duration = await args.pick('duration').catch(() => null);
		const reason = await args.rest('string').catch(() => null);
		const muteRole = await muteCommand.getMuteRole(message.guild);
		if (!target) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid member to mute')]
			});
		}

		if (!(await canManage(message.member, target))) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('I cant manage that member')]
			});
		}

		if (!muteRole) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription("I couldn't find role named `Muted`")]
			});
		}

		const isMuted = await this.isMuted(target.id);
		if (isMuted || target.roles.cache.has(muteRole.id)) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('That member is already muted')]
			});
		}

		try {
			muteCommand.muteMember(target, message.member, muteRole, reason, duration?.offset);

			send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Muted ${getTag(target.user)} ${reason ? `| ${reason}` : ''}`)]
			});
		} catch (e) {
			console.log(e);
			send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('I could not mute that member')]
			});
		}

		return;
	}

	public static async muteMember(target: GuildMember, staff: GuildMember, muteRole: Role, reason: string | Nullish, durationMs: number | Nullish) {
		const { position } = (await target.guild.members.fetchMe()).roles.highest;

		const extracted = muteCommand.extractRoles(target, position);
		extracted.keepRoles.push(muteRole.id);

		const formattedDuration = new DurationFormatter().format(durationMs ?? 0);

		await target.edit({ roles: extracted.keepRoles, reason: reason ?? undefined });

		const modlog = new Modlog({
			member: target,
			staff: staff,
			type: ModerationType.Mute,
			reason: reason ?? null,
			length: durationMs ? formattedDuration : null
		});

		const expiresAt = new Date(Date.now() + (durationMs ?? 0));

		await modlog.createMute({ expiresAt: durationMs ? expiresAt : null, removedRoles: extracted.removedRoles });

		const data = await container.db.guild.findUnique({
			where: {
				guildId: target.guild.id
			}
		});
		await sendMessageAsGuild(
			target.user,
			target.guild,
			{
				embeds: [
					new CardinalEmbedBuilder()
						.setStyle('info')
						.setDescription(
							`You have been muted ${durationMs ? `for ${formattedDuration}` : ''} for the reason: ${reason ?? 'No reason'}`
						)
				]
			},
			data?.appealType !== 'disabled' ? data?.appealLink : null
		);
	}

	public static async getMuteRole(guild: Guild) {
		const muteRoleId = await container.db.guild.getMuteRole(guild.id);

		const muteRole = guild.roles.cache.get(muteRoleId ?? '0') ?? guild.roles.cache.find((r) => r.name.toLowerCase() === 'muted') ?? null;

		return muteRole;
	}

	public static extractRoles(member: GuildMember, selfPosition: number) {
		const keepRoles: string[] = [];
		const removedRoles: string[] = [];

		// Iterate over all the member's roles.
		for (const [id, role] of member.roles.cache.entries()) {
			// Managed roles cannot be removed.
			if (role.managed) keepRoles.push(id);
			// Roles with higher hierarchy position cannot be removed.
			else if (role.position >= selfPosition) keepRoles.push(id);
			// Else it is fine to remove the role.
			else removedRoles.push(id);
		}

		return { keepRoles, removedRoles };
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
