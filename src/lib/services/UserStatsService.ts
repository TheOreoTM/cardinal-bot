import { StatsService } from '#lib/services/StatsService';
import type { MessageData, TopChannelsData } from '#lib/services/types';
import { days, minutes } from '#utils/common';
import { container } from '@sapphire/pieces';
import { DurationFormatter } from '@sapphire/time-utilities';
import type { Guild, Snowflake } from 'discord.js';

export class UserStatsService extends StatsService {
	private readonly memberId: Snowflake;

	public constructor(guild: Guild, memberid: Snowflake) {
		super(guild);
		this.memberId = memberid;
	}

	public async getLookbackMessageData(): Promise<MessageData> {
		const lookback = await this.getLookback();

		return await this.getMessageDataForXDays(lookback);
	}

	public async getDailyMessageData(): Promise<MessageData> {
		return await this.getMessageDataForXDays(1);
	}

	public async getWeeklyMessageData(): Promise<MessageData> {
		return await this.getMessageDataForXDays(7);
	}

	public async getAllMessageData(): Promise<MessageData> {
		const memberId = this.memberId;
		const messageAmount = await container.db.message.count({
			where: {
				memberId,
				guildId: this.guild.id
			}
		});

		const minutesAmount = await container.db.message.count({
			where: {
				memberId,
				guildId: this.guild.id,
				minuteMessage: true
			}
		});

		const durationFormatter = new DurationFormatter();

		return {
			messageAmount: messageAmount.toLocaleString(),
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
				guildId: this.guild.id,
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
				guildId: this.guild.id,
				createdAt: {
					gte: daysAgo
				}
			}
		});

		const minutesAmount = await container.db.message.count({
			where: {
				memberId,
				guildId: this.guild.id,
				minuteMessage: true,
				createdAt: {
					gte: daysAgo
				}
			}
		});

		const durationFormatter = new DurationFormatter();

		return {
			messageAmount: messageAmount.toLocaleString(),
			minutesAmount: durationFormatter.format(minutes(minutesAmount))
		};
	}
}
