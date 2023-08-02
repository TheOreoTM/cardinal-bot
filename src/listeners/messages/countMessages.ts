import { CardinalEvents, type GuildMessage } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';

@ApplyOptions<Listener.Options>({ event: CardinalEvents.MessageCreate })
export class UserEvent extends Listener {
	public override async run(message: GuildMessage) {
		if (!message.guild || message.author.bot || !message.content) return;
		await this.container.db.message.create({
			data: {
				channelId: message.channel.id,
				guildId: message.guildId,
				length: message.content.length,
				memberId: message.author.id,
				messageId: message.id
			}
		});
	}
}
