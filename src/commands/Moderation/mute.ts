import { ModerationCommand, CardinalEmbedBuilder } from '#lib/structures';
import { canManage } from '#utils/functions';
import { muteMember } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';

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
