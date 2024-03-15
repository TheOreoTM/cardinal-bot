import { CardinalEmbedBuilder, ModerationCommand, Modlog } from '#lib/structures';
import { canManage, sendMessageAsGuild } from '#utils/functions';
import { ModerationType } from '#utils/moderationConstants';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Kick a member',
	name: 'kick',
	detailedDescription: {
		extendedHelp: 'Kick a member from the server',
		usages: ['User Reason', 'User'],
		examples: ['@dodz inactive', '@foo']
	}
})
export class kickCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const target = await args.pick('member').catch(() => null);

		if (!target) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid member to kick')]
			});
		}

		if (!(await canManage(message.member, target))) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('I cant kick that member')]
			});
		}

		const reason = await args.rest('string').catch(() => null);

		const modlog = new Modlog({
			member: target,
			staff: message.member,
			type: ModerationType.Kick,
			reason: reason
		});

		if (!target.kickable || !target.moderatable) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('I cant kick that member')]
			});
		}

		await sendMessageAsGuild(target.user, target.guild, {
			embeds: [new CardinalEmbedBuilder().setStyle('info').setDescription(`You have been kicked for the reason: ${reason ?? 'No reason'}`)]
		}, "https://dyno.gg/form/11eb2aa1");

		await modlog.createKick();

		return send(message, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Kick ${getTag(target.user)} ${reason ? `| ${reason}` : ''}`)]
		});
	}
}
