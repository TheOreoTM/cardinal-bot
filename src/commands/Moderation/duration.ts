import { CardinalEmbedBuilder, ModerationCommand } from '#lib/structures';
import { ModerationType } from '#utils/moderationConstants';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import { DurationFormatter } from '@sapphire/time-utilities';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Change the duration of a moderation',
	name: 'duration',
	detailedDescription: {
		extendedHelp:
			'Change the duration of a mute or ban. If the moderation is taking place then the bot will update the duration and also increase/decrease the current mute/ban of the user. If the mute/ban is expired then the bot will only update the duration amount in the modlog case.',
		usages: ['Case Duration'],
		examples: ['12 20m']
	}
})
export class durationCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const caseId = await args.pick('number').catch(() => null);

		if (!caseId) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid modlog ID (mute/ban)')]
			});
		}

		const newDuration = await args.rest('duration').catch(() => null);

		if (!newDuration) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid duration')]
			});
		}

		const caseData = await this.container.db.modlog.update({
			where: {
				guildId_caseId: {
					guildId: message.guildId,
					caseId: caseId
				},
				type: {
					in: [ModerationType.Mute, ModerationType.Ban]
				}
			},
			data: {
				length: new DurationFormatter().format(newDuration.offset)
			}
		});

		if (!caseData) {
			return send(message, {
				embeds: [
					new CardinalEmbedBuilder()
						.setStyle('fail')
						.setDescription('A modlog of that id doesnt exist, make sure its either a mute or a ban.')
				]
			});
		}

		try {
			await this.container.db.mute.updateMany({
				where: {
					modlogId: caseData.id
				},
				data: {
					expiresAt: newDuration.fromNow
				}
			});

			await this.container.db.ban.updateMany({
				where: {
					modlogId: caseData.id
				},
				data: {
					expiresAt: newDuration.fromNow
				}
			});

			// update task duration
			const taskList = await this.container.tasks.client.getJobs('active');
			console.log(taskList);
		} catch (ignored) {}

		return send(message, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Updated duration for #${caseId}`)]
		});
	}
}
