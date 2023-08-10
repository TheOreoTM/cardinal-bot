import { CardinalEmbedBuilder, ModerationCommand, Modlog } from '#lib/structures';
import { canManage, sendMessageAsGuild } from '#utils/functions';
import { ModerationType } from '#utils/moderationConstants';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Warn a member',
	name: 'warn',
	detailedDescription: {
		extendedHelp: 'Warn a member',
		usages: ['User Reason'],
		examples: ['@Jigglepuff Spam']
	}
})
export class warnCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const target = await args.pick('member').catch(() => null);

		if (!target) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid member to warn')]
			});
		}

		if (!(await canManage(message.member, target))) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('I cant warn that member')]
			});
		}

		const reason = await args.rest('string').catch(() => null);

		if (!reason) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid reason')]
			});
		}

		const modlog = new Modlog({ member: target, staff: message.member, reason, type: ModerationType.Warn });
		await modlog.createWarn();

		try {
			await sendMessageAsGuild(target.user, target.guild, {
				embeds: [new CardinalEmbedBuilder().setStyle('info').setDescription(`You have been warned for the reason: ${reason ?? 'No reason'}`)]
			});
		} catch (ignored) {}

		return send(message, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Warned ${getTag(target.user)} | ${reason}`)]
		});
	}
}
