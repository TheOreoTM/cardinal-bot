import { container } from '@sapphire/framework';
import type { Guild } from 'discord.js';

export class ChannelConfig {
	public constructor(private readonly guild: Guild) {
		this.guild = guild;
	}

	public get modlog() {
		return async () => {
			const data = await container.db.guild.findUnique({ where: { guildId: this.guild.id } });
			return data?.channelModlog ?? null;
		};
	}
}
