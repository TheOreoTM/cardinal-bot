import { container } from '@sapphire/pieces';
import { DurationFormatter } from '@sapphire/time-utilities';
import { days, minutes } from '#utils/common';
import type { Prisma } from '@prisma/client';
import { redis } from '#root/index';
import type { Guild } from 'discord.js';

export async function updateUsersInGuild(guild: Guild, lookbackAmount?: number, limit: number = 5) {
	const data = await container.db.guild.findUnique({
		where: {
			guildId: guild.id
		},
		select: {
			lookback: true
		}
	});

	const lookback = lookbackAmount ? lookbackAmount : data?.lookback ? data.lookback : 7;

	guild.members.cache.forEach((member) => getCachedUserStats(guild.id, member.id, lookback, limit));
}

export async function findTopChannelsForMember(userId: string, guildId: string, lookback: number, limit: number): Promise<ExtraType> {
	const now = new Date();
	const lastLookback = new Date(now.getTime() - days(lookback));
	const topChannels = await container.db.message.groupBy({
		by: ['channelId'],
		where: {
			memberId: userId,
			guildId: guildId,
			createdAt: {
				gte: lastLookback
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

export async function findTopMembersForChannel(
	channelId: string,
	guildId: string,
	limit: number
): Promise<{ memberId: string; messageCount: string }[]> {
	const topMembers = await container.db.message.groupBy({
		by: ['memberId'],
		where: {
			channelId: channelId,
			guildId: guildId
		},
		_count: {
			memberId: true
		},
		orderBy: {
			_count: {
				memberId: 'desc'
			}
		},
		take: limit
	});

	return topMembers.map((member) => ({
		memberId: member.memberId,
		messageCount: member._count.memberId.toLocaleString()
	}));
}

export async function getUserStats(guildId: string, userId: string, lookback: number, limit: number): Promise<{ data: DataType; extra: ExtraType }> {
	const data = await getData({ memberId: userId, guildId }, lookback);
	const extra = await findTopChannelsForMember(userId, guildId, lookback, limit);

	return { data: data, extra: extra };
}

export async function getChannelStats(guildId: string, channelId: string, lookback: number, limit: number) {
	const data = await getData({ channelId: channelId, guildId }, lookback);
	const extra = await findTopMembersForChannel(channelId, guildId, limit);

	return { ...data, ...extra };
}

export async function getCachedUserStats(
	guildId: string,
	userId: string,
	lookback: number,
	limit: number
): Promise<{ data: DataType; extra: ExtraType }> {
	const key = `${guildId}-stats-${userId}`;

	const cachedData = await redis.get(key);
	const cachedExtraData = await redis.get(`${key}-extra`);
	if (cachedData && cachedExtraData) {
		const data = JSON.parse(cachedData);
		const extraData = JSON.parse(cachedExtraData);

		return { data: data, extra: extraData };
	}
	const data = await getData({ memberId: userId, guildId }, lookback);
	const extra = await findTopChannelsForMember(userId, guildId, lookback, limit);

	redis.set(`${key}-extra`, JSON.stringify(extra), 'EX', 120);
	redis.set(key, JSON.stringify(data), 'EX', 120);
	return { data: data, extra: extra };
}

export async function getCachedChannelStats(guildId: string, channelId: string, lookback: number, limit: number) {
	const key = `${guildId}-stats-${channelId}`;
	const cachedData = await redis.get(key);
	if (cachedData) {
		return JSON.parse(cachedData) as DataType;
	}
	const data = await getData({ channelId: channelId, guildId }, lookback);
	const extra = await findTopMembersForChannel(channelId, guildId, limit);

	redis.set(`${key}-extra`, JSON.stringify(extra), 'EX', 120);
	redis.set(key, JSON.stringify(data), 'EX', 120);
	return { ...data, ...extra };
}

async function getData(filter: Prisma.MessageWhereInput, lookback: number) {
	const now = new Date();
	const lastDay = new Date(now.getTime() - days(1)); // 1 day in milliseconds
	const lastWeek = new Date(now.getTime() - days(7)); // 1 week in milliseconds
	const lastLookback = new Date(now.getTime() - days(lookback));

	const whereFilter = filter;

	// Count messages within the last day
	const messageCountLastDay = await container.db.message.count({
		where: {
			...whereFilter,
			createdAt: {
				gte: lastDay
			}
		}
	});

	// Count messages within the lookback period
	const messageCountLookback = await container.db.message.count({
		where: {
			...whereFilter,
			createdAt: {
				gte: lastLookback
			}
		}
	});

	// Count messages within the last week
	const messageCountLastWeek = await container.db.message.count({
		where: {
			...whereFilter,
			createdAt: {
				gte: lastWeek
			}
		}
	});

	// Count all-time messages
	const messageCountAllTime = await container.db.message.count({
		where: {
			...whereFilter
		}
	});

	// Count messages with minuteMessage set to true within the last day
	const messageTimeLastDay = await container.db.message.count({
		where: {
			...whereFilter,
			createdAt: {
				gte: lastDay
			},
			minuteMessage: true
		}
	});

	// Count messages with minuteMessage set to true within the lookback period
	const messageTimeLookback = await container.db.message.count({
		where: {
			...whereFilter,
			createdAt: {
				gte: lastLookback
			},
			minuteMessage: true
		}
	});

	// Count messages with minuteMessage set to true within the last week
	const messageTimeLastWeek = await container.db.message.count({
		where: {
			...whereFilter,
			createdAt: {
				gte: lastWeek
			},
			minuteMessage: true
		}
	});

	// Count all-time messages with minuteMessage set to true
	const messageTimeAllTime = await container.db.message.count({
		where: {
			...whereFilter,
			minuteMessage: true
		}
	});

	const durationFormatter = new DurationFormatter();

	const data: DataType = {
		messageCountLastDay: messageCountLastDay.toLocaleString(),
		messageCountLookback: messageCountLookback.toLocaleString(),
		messageCountLastWeek: messageCountLastWeek.toLocaleString(),
		messageCountAllTime: messageCountAllTime.toLocaleString(),
		messageTimeLastDay: durationFormatter.format(minutes(messageTimeLastDay)),
		messageTimeLookback: durationFormatter.format(minutes(messageTimeLookback)),
		messageTimeLastWeek: durationFormatter.format(minutes(messageTimeLastWeek)),
		messageTimeAllTime: durationFormatter.format(minutes(messageTimeAllTime))
	};

	return data;
}

type DataType = {
	messageCountLastDay: string;
	messageCountLookback: string;
	messageCountLastWeek: string;
	messageCountAllTime: string;
	messageTimeLastDay: string;
	messageTimeLookback: string;
	messageTimeLastWeek: string;
	messageTimeAllTime: string;
};

type ExtraType = {
	channelId: string;
	messageCount: string;
}[];
