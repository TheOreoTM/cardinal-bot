import { StatsCachingService } from '#lib/services/StatsCachingService';
import { StatsService } from '#lib/services/StatsService';
import type { GetMessageDataOptions, MessageData, TopChannelsData } from '#lib/services/types';
import { days, minutes } from '#utils/common';
import { container } from '@sapphire/pieces';
import { DurationFormatter } from '@sapphire/time-utilities';
import type { Snowflake } from 'discord.js';

export class UserStatsService extends StatsService {
	private readonly memberId: Snowflake;
	protected readonly cachingService: StatsCachingService;

	public constructor(guildId: string, memberid: Snowflake) {
		super(guildId);
		this.memberId = memberid;
		this.cachingService = new StatsCachingService(guildId);
	}

	public async getLookbackMessageData(options?: GetMessageDataOptions): Promise<MessageData> {
		if (options?.cached) {
			return this.cachingService.getLookbackUserMessageData(this.memberId);
		}

		const lookback = await this.getLookback();

		const data = await this.getMessageDataForXDays(lookback);
		return data;
	}

	public async getDailyMessageData(options?: GetMessageDataOptions): Promise<MessageData> {
		if (options?.cached) {
			return this.cachingService.getDailyUserMessageData(this.memberId);
		}

		const data = await this.getMessageDataForXDays(1);
		return data;
	}

	public async getWeeklyMessageData(options?: GetMessageDataOptions): Promise<MessageData> {
		if (options?.cached) {
			return this.cachingService.getWeeklyUserMessageData(this.memberId);
		}

		const data = await this.getMessageDataForXDays(7);
		return data;
	}

	public async getAllMessageData(options?: GetMessageDataOptions): Promise<MessageData> {
		if (options?.cached) {
			return this.cachingService.getAllUserMessageData(this.memberId);
		}

		const memberId = this.memberId;
		const messageAmount = await container.db.message.count({
			where: {
				memberId,
				guildId: this.guildId
			}
		});

		const minutesAmount = await container.db.message.count({
			where: {
				memberId,
				guildId: this.guildId,
				minuteMessage: true
			}
		});

		const durationFormatter = new DurationFormatter();

		return {
			messageAmount: `${messageAmount.toLocaleString()} Messages`,
			minutesAmount: durationFormatter.format(minutes(minutesAmount))
		};
	}

	public async getTopChannels(limit: number): Promise<TopChannelsData> {
		const lookback = await this.getLookback();
		const lookbackAgo = new Date(Date.now() - days(lookback));
		const topChannels = await container.db.message.groupBy({
			by: ['channelId'],
			where: {
				memberId: this.memberId,
				guildId: this.guildId,
				createdAt: {
					gte: lookbackAgo
				}
			},
			_count: {
				channelId: true
			},
			orderBy: {
				_count: {
					channelId: 'desc'
				}
			},
			take: limit
		});

		return topChannels.map((channel) => ({
			channelId: channel.channelId,
			messageCount: channel._count.channelId.toLocaleString()
		}));
	}

	private async getMessageDataForXDays(dayAmount: number): Promise<MessageData> {
		const daysAgo = new Date(Date.now() - days(dayAmount));
		const memberId = this.memberId;

		const messageAmount = await container.db.message.count({
			where: {
				memberId,
				guildId: this.guildId,
				createdAt: {
					gte: daysAgo
				}
			}
		});

		const minutesAmount = await container.db.message.count({
			where: {
				memberId,
				guildId: this.guildId,
				minuteMessage: true,
				createdAt: {
					gte: daysAgo
				}
			}
		});

		const durationFormatter = new DurationFormatter();

		return {
			messageAmount: `${messageAmount.toLocaleString()} Messages`,
			minutesAmount: durationFormatter.format(minutes(minutesAmount))
		};
	}
}
