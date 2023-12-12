import { StatsService } from '#lib/services/StatsService';
import type { MessageData, TopMembersData } from '#lib/services/types';
import { days, minutes } from '#utils/common';
import { container } from '@sapphire/pieces';
import { DurationFormatter } from '@sapphire/time-utilities';
import type { Guild, Snowflake } from 'discord.js';

export class ChannelStatsService extends StatsService {
	private readonly channelId: Snowflake;

	public constructor(guild: Guild, channelId: Snowflake) {
		super(guild);
		this.channelId = channelId;
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
		const channelId = this.channelId;
		const messageAmount = await container.db.message.count({
			where: {
				channelId,
				guildId: this.guild.id
			}
		});

		const minutesAmount = await container.db.message.count({
			where: {
				channelId,
				guildId: this.guild.id,
				minuteMessage: true
			}
		});

		const durationFormatter = new DurationFormatter();

		return {
			messageAmount: `${messageAmount.toLocaleString()} Messages`,
			minutesAmount: durationFormatter.format(minutes(minutesAmount))
		};
	}

	public async getTopMembers(limit: number): Promise<TopMembersData> {
		const topMembers = await container.db.message.groupBy({
			by: ['channelId'],
			where: {
				channelId: this.channelId,
				guildId: this.guild.id
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

		return topMembers.map((member) => ({
			memberId: member.channelId,
			messageCount: member._count.channelId.toLocaleString()
		}));
	}

	private async getMessageDataForXDays(dayAmount: number): Promise<MessageData> {
		const daysAgo = new Date(Date.now() - days(dayAmount));
		const channelId = this.channelId;

		const messageAmount = await container.db.message.count({
			where: {
				channelId,
				guildId: this.guild.id,
				createdAt: {
					gte: daysAgo
				}
			}
		});

		const minutesAmount = await container.db.message.count({
			where: {
				channelId,
				guildId: this.guild.id,
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
