import { CardinalEmbedBuilder, ModerationCommand } from '#lib/structures';
import { CardinalEmojis } from '#utils/constants';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Change the duration of a moderation',
	name: 'duration',
	detailedDescription: {
		extendedHelp: '',
		usages: [],
		examples: []
	}
})
export class durationCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		if (message.guild) {
			return send(message, {
				content: `${CardinalEmojis.Info} *Coming soon :tm:*`
			});
		}
		const target = await args.pick('member').catch(() => null);

		if (!target) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid member to warn')]
			});
		}

		const reason = await args.rest('string').catch(() => null);

		if (!reason) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid reason')]
			});
		}

		return;
	}
}
