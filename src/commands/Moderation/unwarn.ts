import { CardinalEmbedBuilder, ModerationCommand, Modlog } from '#lib/structures';
import { ModerationType } from '#utils/moderationConstants';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Remove a warn from a user',
	name: 'unwarn',
	aliases: ['delwarn'],
	detailedDescription: {
		extendedHelp: 'Remove a warn from a user',
		usages: ['WarnID Reason', 'WarnID'],
		examples: ['a721251f-201a-4f40-b364-23d436ea67b1 wrong person', '5008509a-d4ce-4947-8796-ac3e285244ca']
	}
})
export class unwarnCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const warnUid = await args.pick('string').catch(() => null);

		if (!warnUid) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid warn ID to remove')]
			});
		}

		const reason = await args.rest('string').catch(() => null);

		const warnData = await this.container.db.warn.findUnique({ where: { warnUid: warnUid } });

		if (!warnData) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('I cant find a warn with that ID')]
			});
		}

		let member = message.guild.members.cache.get(warnData.memberId);
		if (!member) member = await message.guild.members.fetch(warnData.memberId);
		if (!member) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('I cant seem to find the member that warn belongs to')]
			});
		}

		const modlog = new Modlog({ staff: message.member, type: ModerationType.Unwarn, reason: reason, member });
		await modlog.createUnwarn();

		return send(message, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Removed warn \`${warnData.warnUid}\``)]
		});
	}
}
