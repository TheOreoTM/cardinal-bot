import { PermissionLevel } from '#lib/decorators';
import { CardinalEmbedBuilder, CardinalSubcommand } from '#lib/structures';
import { redis } from '#root/index';
import { getChannelStats, getUserStats } from '#utils/caching';
import { days, minutes, seconds } from '#utils/common';
import { CardinalColors } from '#utils/constants';
import { getTag, isGuildPremium } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { send } from '@sapphire/plugin-editable-commands';
import { Stopwatch } from '@sapphire/stopwatch';
import { DurationFormatter } from '@sapphire/time-utilities';
import { EmbedBuilder, type GuildBasedChannel, type Role } from 'discord.js';

@ApplyOptions<CardinalSubcommand.Options>({
	name: 'stats',
	description: 'View message stats',
	detailedDescription: {
		extendedHelp: 'View message statistics about a user, channel or role and also view the top members and channels in the server',
		usages: ['me', 'user User', 'channel Channel', 'role Role', 'top', 'lookback Lookback'],
		examples: [
			'',
			'user @Oreo',
			'user 1045059821663158373',
			'user',
			'channel #general',
			'channel',
			'channel 856722573576765450',
			'role @Staff --limit=10',
			'role 904263866270228502',
			'role',
			'lookback 7'
		],
		explainedUsage: [
			['User/Channel/Role', 'Can either be a name, id or mention'],
			['Lookback', 'A number between 0 and 30*'],
			['--limit', 'Set the maximum number of positions in a leadboard to show (max: 10)']
		],
		reminder: 'If you want to set lookback to something greater than 30 you can check out the premium plan'
	},
	options: ['limit'],
	aliases: ['stat', 's'],
	cooldownDelay: seconds(6),
	subcommands: [
		{
			name: 'lookback',
			messageRun: 'lookback'
		},
		{
			name: 'user',
			messageRun: 'user'
		},

		{
			name: 'me',
			messageRun: 'user',
			default: true
		},
		{
			name: 'role',
			messageRun: 'role'
		},
		{
			name: 'channel',
			messageRun: 'channel'
		},
		{
			name: 'top',
			messageRun: 'top'
		}
	]
})
export class statsCommand extends CardinalSubcommand {
	public take: number = 5;

	public async user(message: CardinalSubcommand.Message, args: CardinalSubcommand.Args) {
		this.initOptions(args);

		const stopWatch = new Stopwatch();
		const user = await args.pick('member').catch(() => message.member);
		const lookback = await this.getLookback(user.guild.id);
		const prefix = args.commandContext.commandPrefix;
		const formattedLookback = `__${lookback === 1 ? `${lookback} Day` : `${lookback} Days`}__`;

		const data = await getUserStats(user.guild.id, user.id, lookback);

		const topChannels = await this.findTopChannelsForMember(user.id, user.guild.id, lookback);
		const timeTaken = stopWatch.stop().toString();

		const formattedTopChannels = topChannels.map((channel, index) => {
			return `\`${index + 1}.\` <#${channel.channelId}>: \`${channel.messageCount} Messages\``;
		});

		const embed = new CardinalEmbedBuilder()
			.setStyle('default')
			.setDescription(
				`${user} (${getTag(user.user)})\nUser stats in the past ${formattedLookback} (Change with the \`${prefix}stats lookback\` command)`
			)
			.addFields(
				{
					name: 'Most active channels',
					value: formattedTopChannels.join('\n') ? formattedTopChannels.join('\n') : 'None'
				},
				{
					inline: true,
					name: 'Messages',
					value: [
						`${formattedLookback}: \`${data.messageCountLookback} Messages\``,
						`24 Hours: \`${data.messageCountLastDay} Messages\``,
						`7 Days: \`${data.messageCountLastWeek} Messages\``,
						`All time: \`${data.messageCountAllTime} Messages\``
					].join('\n')
				},
				{
					inline: true,
					name: 'Time Spent',
					value: [
						`${formattedLookback}: \`${data.messageTimeLookback}\``,
						`24 Hours: \`${data.messageTimeLastDay}\``,
						`7 Days: \`${data.messageTimeLastWeek}\``,
						`All time: \`${data.messageTimeAllTime}\``
					].join('\n')
				}
			)
			.setFooter({
				text: `⏲️ Time taken: ${timeTaken}`
			});

		send(message, {
			embeds: [embed]
		});
	}

	public async channel(message: CardinalSubcommand.Message, args: CardinalSubcommand.Args) {
		this.initOptions(args);

		const stopWatch = new Stopwatch();
		const channel: GuildBasedChannel = await args.pick('guildTextChannel').catch(() => message.channel);

		const lookback = await this.getLookback(channel.guild.id);
		const prefix = args.commandContext.commandPrefix;
		const formattedLookback = `__${lookback === 1 ? `${lookback} Day` : `${lookback} Days`}__`;

		const data = await getChannelStats(channel.guild.id, channel.id, lookback);

		const topMembers = await this.findTopMembersForChannel(channel.id, channel.guild.id);
		const timeTaken = stopWatch.stop().toString();

		const formattedTopMembers = topMembers.map((member, index) => {
			return `\`${index + 1}.\` <@${member.memberId}>: \`${member.messageCount} Messages\``;
		});

		const embed = new CardinalEmbedBuilder()
			.setFooter({ text: `⏲️ Time taken: ${timeTaken}` })
			.setStyle('default')
			.setDescription(`Stats for channel ${channel} in the past ${formattedLookback} (Change with the \`${prefix}stats lookback\` command)`)
			.addFields(
				{
					name: `Top ${this.take} - Users in ${channel.name}`,
					value: formattedTopMembers.join('\n') ? formattedTopMembers.join('\n') : 'None'
				},
				{
					inline: true,
					name: 'Messages',
					value: [
						`${formattedLookback}: \`${data.messageCountLookback}\``,
						`24 Hours: \`${data.messageCountLastDay}\``,
						`7 Days: \`${data.messageCountLastWeek}\``,
						`All time: \`${data.messageCountAllTime}\``
					].join('\n')
				},
				{
					inline: true,
					name: 'Time Spent',
					value: [
						`${formattedLookback}: \`${data.messageTimeLookback}\``,
						`24 Hours: \`${data.messageTimeLastDay}\``,
						`7 Days: \`${data.messageTimeLastWeek}\``,
						`All time: \`${data.messageTimeAllTime}\``
					].join('\n')
				}
			);

		send(message, {
			embeds: [embed]
		});
	}

	public async role(message: CardinalSubcommand.Message, args: CardinalSubcommand.Args) {
		this.initOptions(args);

		const stopWatch = new Stopwatch();
		const role = await args.pick('role').catch(() => message.member.roles.highest);
		const lookback = await this.getLookback(role.guild.id);
		const prefix = args.commandContext.commandPrefix;
		const formattedLookback = `__${lookback === 1 ? `${lookback} Day` : `${lookback} Days`}__`;

		const topMembers = await this.findTopMembersForRole(role, lookback);
		const timeTaken = stopWatch.stop().toString();

		const formattedTopMembers = topMembers.map((member, index) => {
			return `\`${index + 1}.\` <@${member.memberId}>: \`${member.messageCount} Messages\``;
		});

		const embed = new CardinalEmbedBuilder()
			.setFooter({ text: `⏲️ Time taken: ${timeTaken}` })
			.setStyle('default')
			.setDescription(
				`
		Message stats for ${role} in the past ${formattedLookback} (Change with the \`${prefix}stats lookback\` command)`
			)
			.addFields({
				name: `Top ${this.take} Members in ${role.name}`,
				value: formattedTopMembers.join('\n') ? formattedTopMembers.join('\n') : 'None'
			});

		send(message, { embeds: [embed] });
	}

	public async top(message: CardinalSubcommand.Message, args: CardinalSubcommand.Args) {
		this.initOptions(args);

		const lookback = await this.getLookback(message.guildId);
		const prefix = args.commandContext.commandPrefix;
		const formattedLookback = `__${lookback === 1 ? `${lookback} Day` : `${lookback} Days`}__`;
		const SelectMessages = [
			['Top Members', 'View the top members in terms of message and time spent'],
			['Top Channels', 'View the top channels in terms of message and time spent']
		];

		const stopWatch = new Stopwatch();
		const data = await this.getTopData(message.guildId, lookback);
		const timeTaken = stopWatch.stop().toString();

		const formatter = new DurationFormatter();

		const formattedTopMemberMessages = data.topMembersMessagesLookback.map((member, index) => {
			return `\`${index + 1}.\` <@${member.memberId}>: \`${member._count.memberId.toLocaleString()} Messages\``;
		});

		const formattedTopMemberTimes = data.topMembersTimeLookback.map((member, index) => {
			return `\`${index + 1}.\` <@${member.memberId}>: \`${formatter.format(minutes(member._count.memberId))}\``;
		});

		const formattedTopChannelMessages = data.topChannelsMessagesLookback.map((channel, index) => {
			return `\`${index + 1}.\` <#${channel.channelId}>: \`${channel._count.channelId.toLocaleString()} Messages\``;
		});

		const formattedTopChannelTimes = data.topChannelsTimeLookback.map((channel, index) => {
			return `\`${index + 1}.\` <#${channel.channelId}>: \`${formatter.format(minutes(channel._count.channelId))}\``;
		});

		const topMemberEmbed = new CardinalEmbedBuilder()
			.setStyle('default')
			.setFooter({ text: `⏲️ Time taken: ${timeTaken}` })
			.setDescription(`Top member stats in the past ${formattedLookback} (Change with the \`${prefix}stats lookback\` command)`)
			.addFields(
				{
					name: 'Member Messages',
					value: formattedTopMemberMessages.join('\n')
				},

				{
					name: 'Member Time Spent',
					value: formattedTopMemberTimes.join('\n')
				}
			);

		const topChannelEmbed = new CardinalEmbedBuilder()
			.setStyle('default')
			.setFooter({ text: `⏲️ Time taken: ${timeTaken}` })
			.setDescription(`Top channels stats in the past ${formattedLookback} (Change with the \`${prefix}stats lookback\` command)`)
			.addFields(
				{
					name: 'Channel Messages',
					value: formattedTopChannelMessages.join('\n')
				},
				{
					name: 'Channel Time Spent',
					value: formattedTopChannelTimes.join('\n')
				}
			);

		const display = new PaginatedMessage({
			template: new EmbedBuilder().setColor(CardinalColors.Default)
		})
			.setSelectMenuOptions((i) => ({ label: SelectMessages[i - 1][0], description: SelectMessages[i - 1][1] }))
			.setSelectMenuPlaceholder('Change data type');

		display.addPageEmbed(topMemberEmbed);
		display.addPageEmbed(topChannelEmbed);

		return display.run(message, message.author);
	}

	@PermissionLevel('Moderator')
	public async lookback(message: CardinalSubcommand.Message, args: CardinalSubcommand.Args) {
		const lookback = await args.pick('number').catch(() => null);

		if (!lookback) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`Please provide a valid lookback amount (ie: 7, 30)`)]
			});
		}

		const guildIsPremium = await isGuildPremium(message.guildId);

		if (lookback > 30 && !guildIsPremium) {
			return send(message, {
				embeds: [
					new CardinalEmbedBuilder()
						.setStyle('fail')
						.setDescription(`To set the lookback amount to \`${lookback}\` you must activate the premium plan`)
				]
			});
		}

		if (lookback <= 0) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`Lookback must be greater than \`0\``)]
			});
		}

		await this.container.db.guild.upsert({
			where: {
				guildId: message.guildId
			},
			create: {
				guildId: message.guildId,
				lookback
			},
			update: {
				lookback
			}
		});

		return send(message, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Set historical lookback to ${lookback} days`)]
		});
	}

	private async getLookback(guildId: string) {
		const data = await this.container.db.guild.findUnique({
			where: {
				guildId
			},
			select: {
				lookback: true
			}
		});

		return data ? data.lookback : 7;
	}

	// private async getData(filter: Prisma.MessageWhereInput, lookback: number) {
	// 	const now = new Date();
	// 	const lastDay = new Date(now.getTime() - days(1)); // 1 day in milliseconds
	// 	const lastWeek = new Date(now.getTime() - days(7)); // 1 week in milliseconds
	// 	const lastLookback = new Date(now.getTime() - days(lookback));

	// 	const whereFilter = filter;

	// 	// Count messages within the last day
	// 	const messageCountLastDay = await this.container.db.message.count({
	// 		where: {
	// 			...whereFilter,
	// 			createdAt: {
	// 				gte: lastDay
	// 			}
	// 		}
	// 	});

	// 	// Count messages within the lookback period
	// 	const messageCountLookback = await this.container.db.message.count({
	// 		where: {
	// 			...whereFilter,
	// 			createdAt: {
	// 				gte: lastLookback
	// 			}
	// 		}
	// 	});

	// 	// Count messages within the last week
	// 	const messageCountLastWeek = await this.container.db.message.count({
	// 		where: {
	// 			...whereFilter,
	// 			createdAt: {
	// 				gte: lastWeek
	// 			}
	// 		}
	// 	});

	// 	// Count all-time messages
	// 	const messageCountAllTime = await this.container.db.message.count({
	// 		where: {
	// 			...whereFilter
	// 		}
	// 	});

	// 	// Count messages with minuteMessage set to true within the last day
	// 	const messageTimeLastDay = await this.container.db.message.count({
	// 		where: {
	// 			...whereFilter,
	// 			createdAt: {
	// 				gte: lastDay
	// 			},
	// 			minuteMessage: true
	// 		}
	// 	});

	// 	// Count messages with minuteMessage set to true within the lookback period
	// 	const messageTimeLookback = await this.container.db.message.count({
	// 		where: {
	// 			...whereFilter,
	// 			createdAt: {
	// 				gte: lastLookback
	// 			},
	// 			minuteMessage: true
	// 		}
	// 	});

	// 	// Count messages with minuteMessage set to true within the last week
	// 	const messageTimeLastWeek = await this.container.db.message.count({
	// 		where: {
	// 			...whereFilter,
	// 			createdAt: {
	// 				gte: lastWeek
	// 			},
	// 			minuteMessage: true
	// 		}
	// 	});

	// 	// Count all-time messages with minuteMessage set to true
	// 	const messageTimeAllTime = await this.container.db.message.count({
	// 		where: {
	// 			...whereFilter,
	// 			minuteMessage: true
	// 		}
	// 	});

	// 	const durationFormatter = new DurationFormatter();

	// 	const data = {
	// 		messageCountLastDay: messageCountLastDay.toLocaleString(),
	// 		messageCountLookback: messageCountLookback.toLocaleString(),
	// 		messageCountLastWeek: messageCountLastWeek.toLocaleString(),
	// 		messageCountAllTime: messageCountAllTime.toLocaleString(),
	// 		messageTimeLastDay: durationFormatter.format(minutes(messageTimeLastDay)),
	// 		messageTimeLookback: durationFormatter.format(minutes(messageTimeLookback)),
	// 		messageTimeLastWeek: durationFormatter.format(minutes(messageTimeLastWeek)),
	// 		messageTimeAllTime: durationFormatter.format(minutes(messageTimeAllTime))
	// 	};

	// 	return data;
	// }

	private async findTopMembersForRole(role: Role, lookback: number): Promise<{ memberId: string; messageCount: string }[]> {
		const now = new Date();
		const lastLookback = new Date(now.getTime() - days(lookback));
		const memberIds = role.members.map((m) => m.id);
		const guildId = role.guild.id;

		const topMembers = await this.container.db.message.groupBy({
			by: ['memberId'],
			where: {
				memberId: { in: memberIds },
				guildId: guildId,
				createdAt: {
					gte: lastLookback
				}
			},
			_count: { memberId: true },
			orderBy: { _count: { memberId: 'desc' } },
			take: this.take
		});

		return topMembers.map((member) => ({
			memberId: member.memberId,
			messageCount: member._count.memberId.toLocaleString()
		}));
	}

	private async findTopChannelsForMember(
		userId: string,
		guildId: string,
		lookback: number
	): Promise<{ channelId: string; messageCount: string }[]> {
		const now = new Date();
		const lastLookback = new Date(now.getTime() - days(lookback));
		const topChannels = await this.container.db.message.groupBy({
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
			take: this.take
		});

		return topChannels.map((channel) => ({
			channelId: channel.channelId,
			messageCount: channel._count.channelId.toLocaleString()
		}));
	}

	private async findTopMembersForChannel(channelId: string, guildId: string): Promise<{ memberId: string; messageCount: string }[]> {
		const topMembers = await this.container.db.message.groupBy({
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
			take: this.take
		});

		return topMembers.map((member) => ({
			memberId: member.memberId,
			messageCount: member._count.memberId.toLocaleString()
		}));
	}

	private initOptions(args: CardinalSubcommand.Args) {
		const take = parseInt(args.getOption('limit') ?? '');
		this.take = isNaN(take) ? 5 : take;

		if (this.take > 10) this.take = 5;
	}

	private async getTopData(guildId: string, lookback: number) {
		const now = new Date();
		// const lastDay = new Date(now.getTime() - days(1)); // 1 day in milliseconds
		// const lastWeek = new Date(now.getTime() - days(7)); // 1 week in milliseconds
		const lastLookback = new Date(now.getTime() - days(lookback));

		// const topMembersDay = await this.container.db.message.groupBy({
		// 	by: ['memberId'],
		// 	where: {
		// 		createdAt: { gte: lastDay }
		// 	},
		// 	_count: { memberId: true },
		// 	orderBy: { _count: { memberId: 'desc' } },
		// 	take: this.take
		// });

		const cachedData = await redis.get(`${guildId}-topData`);
		if (cachedData) {
			const data = JSON.parse(cachedData) as TopData;
			return data;
		}

		const topMembersTimeLookback = await this.container.db.message.groupBy({
			by: ['memberId'],
			where: {
				createdAt: { gte: lastLookback },
				guildId,
				minuteMessage: true
			},
			_count: { memberId: true },
			orderBy: { _count: { memberId: 'desc' } },
			take: this.take
		});

		const topMembersMessageLookback = await this.container.db.message.groupBy({
			by: ['memberId'],
			where: { guildId, createdAt: { gte: lastLookback } },
			_count: { memberId: true },
			orderBy: { _count: { memberId: 'desc' } },
			take: this.take
		});

		// const topMembersWeek = await this.container.db.message.groupBy({
		// 	by: ['memberId'],
		// 	where: {
		// 		createdAt: { gte: lastWeek }
		// 	},
		// 	_count: { memberId: true },
		// 	orderBy: { _count: { memberId: 'desc' } },
		// 	take: this.take
		// });

		// const topMembersAll = await this.container.db.message.groupBy({
		// 	by: ['memberId'],
		// 	_count: { memberId: true },
		// 	orderBy: { _count: { memberId: 'desc' } },
		// 	take: this.take
		// });

		// const topChannelsDay = await this.container.db.message.groupBy({
		// 	by: ['channelId'],
		// 	where: {
		// 		createdAt: { gte: lastDay }
		// 	},
		// 	_count: { channelId: true },
		// 	orderBy: { _count: { channelId: 'desc' } },
		// 	take: this.take
		// });

		const topChannelsTimeLookback = await this.container.db.message.groupBy({
			by: ['channelId'],
			where: {
				createdAt: { gte: lastLookback },
				guildId,
				minuteMessage: true
			},
			_count: { channelId: true },
			orderBy: { _count: { channelId: 'desc' } },
			take: this.take
		});

		const topChannelsMessageLookback = await this.container.db.message.groupBy({
			by: ['channelId'],
			where: { guildId, createdAt: { gte: lastLookback } },
			_count: { channelId: true },
			orderBy: { _count: { channelId: 'desc' } },
			take: this.take
		});

		// const topChannelsWeek = await this.container.db.message.groupBy({
		// 	by: ['channelId'],
		// 	where: {
		// 		createdAt: { gte: lastWeek }
		// 	},
		// 	_count: { channelId: true },
		// 	orderBy: { _count: { channelId: 'desc' } },
		// 	take: this.take
		// });

		// const topChannelsAll = await this.container.db.message.groupBy({
		// 	by: ['channelId'],
		// 	_count: { channelId: true },
		// 	orderBy: { _count: { channelId: 'desc' } },
		// 	take: this.take
		// });

		const data = {
			topMembersMessagesLookback: topMembersMessageLookback,
			topMembersTimeLookback: topMembersTimeLookback,
			// topMembersDay: topMembersDay,
			// topMembersWeek: topMembersWeek,
			// topMembersAll: topMembersAll,

			topChannelsMessagesLookback: topChannelsMessageLookback,
			topChannelsTimeLookback: topChannelsTimeLookback
			// topChannelsDay: topChannelsDay,
			// topChannelsWeek: topChannelsWeek,
			// topChannelsAll: topChannelsAll
		};

		return data;
	}
}

type TopDataItem = {
	_count: {
		memberId: number;
	};
	memberId: string;
} & {
	_count: {
		channelId: number;
	};
	channelId: string;
};

type TopData = {
	topMembersMessagesLookback: TopDataItem[];
	topMembersTimeLookback: TopDataItem[];
	topChannelsMessagesLookback: TopDataItem[];
	topChannelsTimeLookback: TopDataItem[];
};
