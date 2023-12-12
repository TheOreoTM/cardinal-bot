import { StatsService } from '#lib/services/StatsService';
import type { MessageData } from '#lib/services/types';
import { days } from '#utils/common';
import { container } from '@sapphire/pieces';
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

		return {
			messageAmount,
			minutesAmount
		};
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

		return {
			messageAmount,
			minutesAmount
		};
	}
}
