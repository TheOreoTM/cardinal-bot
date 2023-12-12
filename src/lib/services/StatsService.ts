import { container } from '@sapphire/pieces';
import type { Guild } from 'discord.js';

export abstract class StatsService {
	public readonly guild: Guild;
	public constructor(guild: Guild) {
		this.guild = guild;
	}

	protected async getLookback(): Promise<number> {
		const data = await container.db.guild.findUnique({
			where: {
				guildId: this.guild.id
			}
		});

		return data ? data.lookback : 7;
	}
}
