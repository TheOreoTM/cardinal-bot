import { CardinalEmbedBuilder, CardinalIndexBuilder, ModerationCommand, Modlog } from '#lib/structures';
import { ModerationType } from '#utils/moderationConstants';
import { getTag, mention } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import type { Nullish } from '@sapphire/utilities';
import type { Role } from 'discord.js';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Unmute a user',
	name: 'unmute',
	detailedDescription: {
		extendedHelp: 'Remove a user from the muted role',
		usages: ['User Reason', 'User'],
		examples: ['@Night self mute', '@Rainho']
	}
})
export class unmuteCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const target = await args.pick('member').catch(() => null);

		if (!target) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid member to unmute')]
			});
		}

		const reason = await args.rest('string').catch(() => 'No reason');

		const muteRoleId =
			(await this.container.db.guild.getMuteRole(message.guild.id)) ??
			message.guild.roles.cache.find((r) => r.name.toLowerCase() === 'muted')?.id ??
			'0';
		let muteRole: Role | Nullish = message.guild.roles.cache.get(muteRoleId);
		if (!muteRole) muteRole = message.guild.roles.cache.find((r) => r.name.toLowerCase() === 'muted');
		if (!muteRole) {
			send(message, {
				embeds: [
					new CardinalEmbedBuilder()
						.setStyle('fail')
						.setDescription('I cant find the mute role for this server. Configure it using ' + mention('config', message.client))
				]
			});

			return;
		}

		const hasMuterole = target.roles.cache.has(muteRole.id);
		const muteData = await this.container.db.mute.findFirst({
			where: {
				modlog: {
					memberId: target.id,
					guildId: target.guild.id
				}
			}
		});

		const removedRoles = new Set(muteData?.removedRoles);

		target.roles.cache.forEach((role) => {
			if (muteRole) {
				if (role.id === muteRole.id) return;
			}

			removedRoles.add(role.id);
		});

		const removedRolesArray = Array.from(removedRoles);

		if (hasMuterole && muteData) {
			try {
				target.roles.set(removedRolesArray);
			} catch (error) {
				return send(message, {
					embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('I couldnt unmute that user')]
				});
			}
		}

		if (hasMuterole && !muteData) {
			try {
				target.roles.remove(muteRole.id);
			} catch (error) {
				return send(message, {
					embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('I couldnt unmute that user')]
				});
			}
		}

		if (muteData) {
			await this.container.db.mute.deleteMany({
				where: {
					modlog: {
						memberId: target.id,
						guildId: target.guild.id
					}
				}
			});
		}

		await send(message, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Unmuted ${getTag(target.user)}`)]
		});

		if (muteData) {
			const modlog = new Modlog({
				member: target,
				staff: message.member,
				type: ModerationType.Unmute,
				reason: reason,
				caseId: await CardinalIndexBuilder.modlogId(message.member.guild.id)
			});

			return await modlog.createUnmute();
		}
	}
}
