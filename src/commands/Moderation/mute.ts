import { ModerationCommand, CardinalEmbedBuilder, Modlog } from '#lib/structures';
import { canManage, sendMessageAsGuild } from '#utils/functions';
import { ModerationType } from '#utils/moderationConstants';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { container } from '@sapphire/pieces';
import { send } from '@sapphire/plugin-editable-commands';
import { DurationFormatter } from '@sapphire/time-utilities';
import type { GuildMember } from 'discord.js';

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
		if (isMuted && target.roles.cache.has(muteRole.id)) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('That member is already muted')]
			});
		}

		const { position } = (await message.guild.members.fetchMe()).roles.highest;

		const extracted = this.extractRoles(target, position);
		extracted.keepRoles.push(muteRole.id);

		try {
			const formattedDuration = new DurationFormatter().format(duration?.offset ?? 0);

			await target.edit({ roles: extracted.keepRoles, reason: reason ?? undefined });

			const modlog = new Modlog({
				member: target,
				staff: message.member,
				type: ModerationType.Mute,
				reason: reason ?? null,
				length: duration ? formattedDuration : null
			});

			await modlog.createMute({ expiresAt: duration?.fromNow, removedRoles: extracted.removedRoles });

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
							.setDescription(
								`You have been muted ${duration ? `for ${formattedDuration}` : ''} for the reason: ${reason ?? 'No reason'}`
							)
					]
				},
				data?.appealLink
			);

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

	private extractRoles(member: GuildMember, selfPosition: number) {
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
