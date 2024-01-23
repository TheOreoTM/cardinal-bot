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

		let muteRole: Role | Nullish = await message.guild.roles.fetch(await message.guild.settings.roles.mute());
		if (!muteRole) muteRole = message.guild.roles.cache.find((r) => r.name.toLowerCase() === 'muted');
		if (!muteRole) {
			return send(message, {
				embeds: [
					new CardinalEmbedBuilder()
						.setStyle('fail')
						.setDescription('I cant find the mute role for this server. Configure it using ' + mention('config', message.client))
				]
			});
		}

		const hasMuterole = target.roles.cache.has(muteRole.id);
		const muteDatas = await this.container.db.mute.findMany({
			where: {
				modlog: {
					memberId: target.id,
					guildId: target.guild.id
				}
			}
		});

		const muteData = muteDatas[0];

		if (hasMuterole && muteData) {
			try {
				target.roles.add(muteData.removedRoles);
				target.roles.remove(muteRole.id);
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

		if (muteDatas.length > 0) {
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

		if (muteDatas.length > 0) {
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
