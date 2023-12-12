import { StatsService } from '#services';
import type { MessageData } from '#services/types';
import { days } from '#utils/common';
import { container } from '@sapphire/pieces';
import type { Guild, Snowflake } from 'discord.js';

export class UserStatsService extends StatsService {
	public constructor(guild: Guild) {
		super(guild);
	}

	public async getLookbackMessageData(memberId: Snowflake): Promise<MessageData> {
		const lookback = await this.getLookback();

		return await this.getMessageDataForXDays(memberId, lookback);
	}

	public async getDailyMessageData(memberId: Snowflake): Promise<MessageData> {
		return await this.getMessageDataForXDays(memberId, 1);
	}

	public async getWeeklyMessageData(memberId: Snowflake): Promise<MessageData> {
		return await this.getMessageDataForXDays(memberId, 7);
	}

	public async getAllMessageData(memberId: Snowflake): Promise<MessageData> {
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

		return {
			messageAmount,
			minutesAmount
		};
	}

	public async getAllMessageData2(memberId: Snowflake) {
		const messageData = await container.db.message.findMany({
			where: {
				memberId,
				guildId: this.guild.id
			}
		});

		const lookback = await this.getLookback();
		const lookbackAgo = new Date(Date.now() - days(lookback));
		const dayAgo = new Date(Date.now() - days(1));
		const weekAgo = new Date(Date.now() - days(7));

		return {
			daily: {
				messageAmount: messageData.filter((m) => {
					m.createdAt >= dayAgo;
				}).length,
				minutesAmount: messageData.filter((m) => {
					m.createdAt >= dayAgo && m.minuteMessage;
				}).length
			},
			weekly: {
				messageAmount: messageData.filter((m) => {
					m.createdAt >= weekAgo;
				}).length,
				minutesAmount: messageData.filter((m) => {
					m.createdAt >= weekAgo && m.minuteMessage;
				}).length
			},
			alltime: {
				messageAmount: messageData.length,
				minutesAmount: messageData.length
			},
			lookback: {
				messageAmount: messageData.filter((m) => {
					m.createdAt >= lookbackAgo;
				}).length,
				minutesAmount: messageData.filter((m) => {
					m.createdAt >= lookbackAgo && m.minuteMessage;
				}).length
			}
		};
	}

	private async getMessageDataForXDays(memberId: Snowflake, dayAmount: number): Promise<MessageData> {
		const daysAgo = new Date(Date.now() - days(dayAmount));

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

		return {
			messageAmount,
			minutesAmount
		};
	}
}
