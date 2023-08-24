export type FactionStatusType = 'open' | 'restricted' | 'closed';

export type RestrictionNode = {
	allow: string[]; // List of commands
	deny: string[]; // =
	targetId: string; // ID of a role/user/channel
};
