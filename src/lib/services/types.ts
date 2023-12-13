export type MessageData = {
	messageAmount: `${string} Messages`;
	minutesAmount: string;
};

export type TopChannelsData = {
	channelId: string;
	messageCount: string;
}[];

export type TopMembersData = {
	memberId: string;
	messageCount: string;
}[];

export type GetMessageDataOptions = {
	cached: boolean;
};

/**
 * TODO: {ServerStatsService}
 * TODO: {Role & Top Service}
 */
