import { CardinalEvents, type GuildMessage } from '#lib/types';
import { minutes } from '#utils/common';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';

@ApplyOptions<Listener.Options>({ event: CardinalEvents.MessageCreate })
export class UserEvent extends Listener {
	public override async run(message: GuildMessage) {
		if (!message.guild || message.author.bot || !message.content) return;

		const lastMinuteMessage = await this.container.db.message.findFirst({
			where: {
				memberId: message.member.id,
				channelId: message.channelId,
				guildId: message.guildId,
				minuteMessage: true,
				createdAt: {
					gt: new Date(Date.now() - minutes(1)) // 1 minute in milliseconds
				}
			},
			orderBy: {
				createdAt: 'desc'
			}
		});

		// Determine if a new message should have minuteMessage set to true
		const newMessageMinuteMessage = !lastMinuteMessage;

		await this.container.db.message.create({
			data: {
				channelId: message.channel.id,
				guildId: message.guildId,
				length: message.content.length,
				memberId: message.author.id,
				messageId: message.id,
				minuteMessage: newMessageMinuteMessage
			}
		});
	}
}
