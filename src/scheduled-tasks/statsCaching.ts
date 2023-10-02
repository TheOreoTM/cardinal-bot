import { days, minutes } from '#utils/common';
import { ApplyOptions } from '@sapphire/decorators';
import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import { redis } from '..';

const MaxTakeAmount = 10;

@ApplyOptions<ScheduledTask.Options>({
	interval: minutes(5),
	enabled: true
})
export class ExpireBanTask extends ScheduledTask {
	public override async run() {
		const guilds = this.container.client.guilds.cache;

		guilds.forEach(async (guild) => {
			const data = await this.container.db.guild.findUnique({
				where: {
					guildId: guild.id
				},
				select: {
					lookback: true
				}
			});
			const topStatsData = await this.getTopData(guild.id, data?.lookback ?? 7);
			redis.set(`${guild.id}-topData`, JSON.stringify(topStatsData));
		});
	}

	private async getTopData(guildId: string, lookback: number) {
		const now = new Date();

		const lastLookback = new Date(now.getTime() - days(lookback));

		const topMembersTimeLookback = await this.container.db.message.groupBy({
			by: ['memberId'],
			where: {
				createdAt: { gte: lastLookback },
				guildId,
				minuteMessage: true
			},
			_count: { memberId: true },
			orderBy: { _count: { memberId: 'desc' } },
			take: MaxTakeAmount
		});

		const topMembersMessageLookback = await this.container.db.message.groupBy({
			by: ['memberId'],
			where: { guildId, createdAt: { gte: lastLookback } },
			_count: { memberId: true },
			orderBy: { _count: { memberId: 'desc' } },
			take: MaxTakeAmount
		});

		const topChannelsTimeLookback = await this.container.db.message.groupBy({
			by: ['channelId'],
			where: {
				createdAt: { gte: lastLookback },
				guildId,
				minuteMessage: true
			},
			_count: { channelId: true },
			orderBy: { _count: { channelId: 'desc' } },
			take: MaxTakeAmount
		});

		const topChannelsMessageLookback = await this.container.db.message.groupBy({
			by: ['channelId'],
			where: { guildId, createdAt: { gte: lastLookback } },
			_count: { channelId: true },
			orderBy: { _count: { channelId: 'desc' } },
			take: MaxTakeAmount
		});

		const data = {
			topMembersMessagesLookback: topMembersMessageLookback,
			topMembersTimeLookback: topMembersTimeLookback,

			topChannelsMessagesLookback: topChannelsMessageLookback,
			topChannelsTimeLookback: topChannelsTimeLookback
		};

		return data;
	}
}
