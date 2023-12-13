import { container } from '@sapphire/pieces';

export abstract class StatsService {
	protected readonly guildId: string;
	public constructor(guildId: string) {
		this.guildId = guildId;
	}

	protected async getLookback(): Promise<number> {
		const data = await container.db.guild.findUnique({
			where: {
				guildId: this.guildId
			}
		});

		return data ? data.lookback : 7;
	}
}
