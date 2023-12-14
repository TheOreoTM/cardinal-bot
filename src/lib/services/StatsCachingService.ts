import { RedisClient, StatsCacheFields, userStatsCacheKey } from '#lib/database';
import { UserStatsService } from '#lib/services/UserStatsService';
import type { MessageData } from '#lib/services/types';
import type { Key } from '#lib/types';
import { minutes } from '#utils/common';
import { container } from '@sapphire/pieces';
import { isNullish } from '@sapphire/utilities';

export class StatsCachingService {
	private readonly guildId: string;
	private readonly cache: RedisClient;
	public constructor(guildId: string) {
		this.guildId = guildId;
		this.cache = container.cache;
	}

	public async getAllUserMessageData(memberId: string) {
		const service = new UserStatsService(this.guildId, memberId);
		const key = userStatsCacheKey(this.guildId, memberId);
		const cachedData = await this.cache.hGetAll(key);
		if (cachedData) {
			const data = Object.fromEntries(Object.entries(cachedData)) as GetAllUserMessageData;
			return data;
		}

		return {
			lookback: await service.getLookbackMessageData(),
			daily: await service.getDailyMessageData(),
			weekly: await service.getWeeklyMessageData(),
			all: await service.getAlltimeMessageData()
		};
	}

	public async getLookbackUserMessageData(memberId: string) {
		const key = userStatsCacheKey(this.guildId, memberId);
		const field = StatsCacheFields.Lookback as Key;
		const service = new UserStatsService(this.guildId, memberId);

		const data = await this.getCachedUserMessageData({ key, field }, () => service.getLookbackMessageData());
		return data;
	}

	public async getDailyUserMessageData(memberId: string) {
		const key = userStatsCacheKey(this.guildId, memberId);
		const field = StatsCacheFields.Daily as Key;
		const service = new UserStatsService(this.guildId, memberId);

		const data = await this.getCachedUserMessageData({ key, field }, () => service.getMessageDataForXDays(1));
		return data;
	}

	public async getWeeklyUserMessageData(memberId: string) {
		const key = userStatsCacheKey(this.guildId, memberId);
		const field = StatsCacheFields.Weekly as Key;
		const service = new UserStatsService(this.guildId, memberId);

		const data = await this.getCachedUserMessageData({ key, field }, () => service.getMessageDataForXDays(7));
		return data;
	}

	public async getAlltimeUserMessageData(memberId: string) {
		const key = userStatsCacheKey(this.guildId, memberId);
		const field = StatsCacheFields.All as Key;
		const service = new UserStatsService(this.guildId, memberId);

		const data = await this.getCachedUserMessageData({ key, field }, async () => service.getAlltimeMessageData({ cached: false }));
		return data;
	}

	private async getCachedUserMessageData({ key, field }: { key: Key; field: Key }, getDataFunction: () => Promise<MessageData>) {
		const cacheResult = await this.cache.hget(key, field);
		if (!isNullish(cacheResult)) {
			const data = JSON.parse(cacheResult);
			console.log('data', data);
			if (!isNullish(data)) return data;
		}

		const data = await getDataFunction();
		await this.cache.hSet(key, field, JSON.stringify(data));
		await this.cache.expire(key, minutes(3) / 1000);

		return data;
	}
}

type GetAllUserMessageData = {
	lookback: MessageData;
	daily: MessageData;
	weekly: MessageData;
	all: MessageData;
};
