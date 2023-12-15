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

	public async getAllUserMessageData(memberId: string): Promise<GetAllUserMessageData> {
		const service = new UserStatsService(this.guildId, memberId);
		const key = userStatsCacheKey(this.guildId, memberId);
		const cachedData = await this.cache.hGetAll(key);

		console.log('cachedData', cachedData);
		const data = Object.fromEntries(cachedData) as GetAllUserMessageData;
		console.log('data', data, 'type', typeof data);
		if (isNullish(data) || Object.keys(data).length === 0 || cachedData.size === 0) {
			const realtimeData = {
				lookback: await service.getLookbackMessageData(),
				daily: await service.getDailyMessageData(),
				weekly: await service.getWeeklyMessageData(),
				all: await service.getAlltimeMessageData()
			};
			console.log('realtime', JSON.stringify(realtimeData));
			await this.cache.hSet(key, StatsCacheFields.Daily as Key, JSON.stringify(realtimeData.daily));
			await this.cache.hSet(key, StatsCacheFields.Lookback as Key, JSON.stringify(realtimeData.lookback));
			await this.cache.hSet(key, StatsCacheFields.Weekly as Key, JSON.stringify(realtimeData.weekly));
			await this.cache.hSet(key, StatsCacheFields.All as Key, JSON.stringify(realtimeData.all));
			await this.cache.expire(key, 180);
			return realtimeData;
		}
		console.log('data', data);
		return data;
	}

	public async getLookbackUserMessageData(memberId: string) {
		const key = userStatsCacheKey(this.guildId, memberId);
		const field = StatsCacheFields.Lookback as Key;
		const service = new UserStatsService(this.guildId, memberId);

		const data = await this.getCachedUserMessageData({ key, field }, () => service.getLookbackMessageData());
		return data as MessageData;
	}

	public async getDailyUserMessageData(memberId: string) {
		const key = userStatsCacheKey(this.guildId, memberId);
		const field = StatsCacheFields.Daily as Key;
		const service = new UserStatsService(this.guildId, memberId);

		const data = await this.getCachedUserMessageData({ key, field }, () => service.getMessageDataForXDays(1));
		return data as MessageData;
	}

	public async getWeeklyUserMessageData(memberId: string) {
		const key = userStatsCacheKey(this.guildId, memberId);
		const field = StatsCacheFields.Weekly as Key;
		const service = new UserStatsService(this.guildId, memberId);

		const data = await this.getCachedUserMessageData({ key, field }, () => service.getMessageDataForXDays(7));
		return data as MessageData;
	}

	public async getAlltimeUserMessageData(memberId: string) {
		const key = userStatsCacheKey(this.guildId, memberId);
		const field = StatsCacheFields.All as Key;
		const service = new UserStatsService(this.guildId, memberId);

		const data = await this.getCachedUserMessageData({ key, field }, async () => service.getAlltimeMessageData({ cached: false }));
		return data as MessageData;
	}

	private async getCachedUserMessageData({ key, field }: { key: Key; field: Key }, getDataFunction: () => Promise<MessageData>) {
		const cacheResult = await this.cache.hget(key, field);
		if (!isNullish(cacheResult)) {
			const data = JSON.parse(cacheResult);
			if (!isNullish(data)) {
				return data;
			}
			console.log('isNullish', data);
		}
		const data = await getDataFunction();
		await this.cache.hSet(key, field, JSON.stringify(data));
		await this.cache.expire(key, 180);

		return data;
	}
}

type GetAllUserMessageData = {
	lookback: MessageData;
	daily: MessageData;
	weekly: MessageData;
	all: MessageData;
};
