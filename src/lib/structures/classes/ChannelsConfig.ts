import { container } from '@sapphire/framework';
import type { Guild, GuildTextBasedChannel } from 'discord.js';

export class ChannelConfig {
	public constructor(private readonly guild: Guild) {
		this.guild = guild;
	}

	public get modlog() {
		return async () => {
			const data = await container.db.guild.findUnique({ where: { guildId: this.guild.id } });
			if (data?.channelModlog && data.channelModlog !== '0') {
				const channel = this.guild.channels.cache.get(data.channelModlog) ?? (await this.guild.channels.fetch(data.channelModlog));
				return channel as GuildTextBasedChannel;
			} else {
				return null;
			}
		};
	}

	public get suggestion() {
		return async () => {
			const data = await container.db.guild.findUnique({ where: { guildId: this.guild.id } });
			if (data?.channelSuggestion) {
				const channel = this.guild.channels.cache.get(data.channelSuggestion) ?? (await this.guild.channels.fetch(data.channelSuggestion));
				return channel as GuildTextBasedChannel;
			} else {
				return null;
			}
		};
	}
}
