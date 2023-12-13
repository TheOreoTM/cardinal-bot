import { RedisClient, StatsCacheFields, userStatsCacheKey } from '#lib/database';
import { UserStatsService } from '#lib/services/UserStatsService';
import type { MessageData } from '#lib/services/types';
import type { Key } from '#lib/types';
import { container } from '@sapphire/pieces';
import { isNullish } from '@sapphire/utilities';

export class StatsCachingService {
	private readonly guildId: string;
	private readonly cache: RedisClient;
	public constructor(guildId: string) {
		this.guildId = guildId;
		this.cache = container.cache;
	}

	public async getLookbackMessageData(memberId: string) {
		const key = userStatsCacheKey(this.guildId, memberId);
		const service = new UserStatsService(this.guildId, memberId);

		const cacheResult = this.cache.hget(key, StatsCacheFields.Lookback);
		if (isNullish(cacheResult)) {
			return JSON.parse(cacheResult) as MessageData;
		}

		const lookbackData = await service.getLookbackMessageData();
		this.cache.hSet(key, StatsCacheFields.Lookback as Key, JSON.stringify(lookbackData));

		return lookbackData;
	}
}
