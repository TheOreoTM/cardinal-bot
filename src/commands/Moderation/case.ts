import { CardinalEmbedBuilder, ModerationCommand, Modlog } from '#lib/structures';
import { CardinalColors } from '#utils/constants';
import { capitalizeWords } from '#utils/formatters';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<ModerationCommand.Options>({
	description: '',
	name: 'case',
	detailedDescription: {
		extendedHelp: '',
		usages: [],
		examples: []
	}
})
export class caseCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const caseNum = await args.pick('number').catch(() => null);

		if (!caseNum) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid case ID')]
			});
		}

		const modlog = await new Modlog().getModlog(caseNum, message.guildId);

		if (!modlog) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`I cant find case \`#${caseNum}\``)]
			});
		}

		const embed = new CardinalEmbedBuilder().setColor(CardinalColors.Warn).addFields(
			{
				name: 'User',
				value: `${modlog.memberName} (<@${modlog.memberId}>)`,
				inline: true
			},
			{
				name: 'Moderator',
				value: `${modlog.staffName} (<@${modlog.staffId}>)`,
				inline: true
			},
			{
				name: 'Reason',
				value: `${modlog.reason}`,
				inline: true
			}
		);

		modlog.length
			? embed.addFields({
					name: 'Length',
					value: modlog.length,
					inline: true
			  })
			: embed;

		embed.setAuthor({ name: `Case ${caseNum} | ${capitalizeWords(modlog.type)} | ${modlog.memberName}` });

		return send(message, {
			embeds: [embed]
		});
	}
}
