import { CardinalEmbedBuilder, ModerationCommand } from '#lib/structures';
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
		const caseNum = await args.pick('member').catch(() => null);

		if (!caseNum) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid case ID')]
			});
		}
	}
}
