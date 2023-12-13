import type {
	AutomodBannedWords,
	AutomodCapitalization,
	AutomodInviteLinks,
	AutomodLinkCooldown,
	AutomodLinks,
	AutomodMassMention,
	AutomodNewlines,
	AutomodSpam,
	AutomodStickers
} from '@prisma/client';

/**
 * Redis Key
 */
export type Key = string & { _: never };

export type FactionStatusType = 'open' | 'restricted' | 'closed';

export type RestrictionNode = {
	allow: string[]; // List of commands
	deny: string[]; // =
	targetId: string; // ID of a role/user/channel
};

export type AutomodRule =
	| 'bannedWords'
	| 'capitalization'
	| 'inviteLinks'
	| 'linkCooldown'
	| 'links'
	| 'massMention'
	| 'newLines'
	| 'spam'
	| 'stickers';

export type Automod =
	| AutomodBannedWords
	| AutomodCapitalization
	| AutomodInviteLinks
	| AutomodLinkCooldown
	| AutomodLinks
	| AutomodMassMention
	| AutomodNewlines
	| AutomodSpam
	| AutomodStickers;
