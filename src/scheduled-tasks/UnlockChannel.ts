import { CardinalEmbedBuilder } from '#lib/structures';
import { ApplyOptions } from '@sapphire/decorators';
import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import type { TextChannel } from 'discord.js';

interface UnlockChannelTaskPaylod {
	channelId: string;
}

@ApplyOptions<ScheduledTask.Options>({
	name: 'UnlockChannelTask',
	customJobOptions: { removeOnComplete: true }
})
export class UnlockChannelTask extends ScheduledTask {
	public async run(payload: UnlockChannelTaskPaylod) {
		this.container.logger.info('[UnlockChannelTask] Started');
		const channel = (await this.container.client.channels.fetch(payload.channelId)) as TextChannel | null;
		if (!channel) return;

		channel.permissionOverwrites
			.edit(channel.guild.roles.everyone, {
				SendMessages: false
			})
			.catch((error) => {
				channel.send({ embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`I couldn't unlock this channel: ${error}`)] });
			});
	}
}
