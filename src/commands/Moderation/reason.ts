import { CardinalEmbedBuilder, ModerationCommand } from '#lib/structures';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Update the reason for a modlog',
	name: 'reason',
	detailedDescription: {
		extendedHelp: 'Change the reason specified for a modlog',
		usages: ['CaseNum Reason'],
		examples: ['420 Inappropriate Behavior']
	}
})
export class reasonCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const caseNum = await args.pick('number').catch(() => null);

		if (!caseNum) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid case id')]
			});
		}

		const caseData = await this.container.db.modlog.findUnique({
			where: {
				guildId_caseId: {
					caseId: caseNum,
					guildId: message.guildId
				}
			}
		});

		if (!caseData) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`I cant find a case with the id \`#${caseNum}\``)]
			});
		}

		const reason = await args.rest('string').catch(() => null);

		if (!reason) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid new reason')]
			});
		}

		await this.container.db.modlog.update({
			where: {
				guildId_caseId: {
					caseId: caseNum,
					guildId: message.guildId
				}
			},
			data: {
				reason
			}
		});

		return send(message, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Updated case \`#${caseNum}\` with reason "${reason}"`)]
		});
	}
}
