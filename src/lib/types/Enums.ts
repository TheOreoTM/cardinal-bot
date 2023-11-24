import { Events } from '@sapphire/framework';
import { SubcommandPluginEvents } from '@sapphire/plugin-subcommands';

export const enum PermissionLevels {
	Everyone = 0,
	Trainee = 3,
	Staff = 4,
	Moderator = 5,
	Administrator = 6,
	ServerOwner = 7,
	BotOwner = 10
}

export const CardinalEvents = {
	...Events,
	...SubcommandPluginEvents,
	GuildUserMessage: 'guildUserMessage',
	UserMessage: 'userMessage',
	RawReactionAdd: 'rawReactionAdd',
	GiveawayEnd: 'giveawayEnd'
	// TODO: Add custom events here
};

export const enum CardinalEmbedStyles {
	Default = 'default',
	Info = 'info',
	Success = 'success',
	Fail = 'fail',
	Loading = 'loading'
}

export const enum RestrictionAction {
	Allow = 'allow',
	Deny = 'deny'
}

export const enum SuggestionStatus {
	Pending = 'pending',
	Approved = 'approved',
	Rejected = 'rejected',
	Considered = 'considered',
	Implemented = 'implemented'
}
