import { container } from '@sapphire/pieces';
import type { Guild } from 'discord.js';

export abstract class StatsService {
	public constructor(protected readonly guild: Guild) {}

	protected async getLookback(): Promise<number> {
		const data = await container.db.guild.findUnique({
			where: {
				guildId: this.guild.id
			}
		});

		return data ? data.lookback : 7;
	}
}
