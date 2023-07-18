import { Events } from '@sapphire/framework';
import { SubcommandPluginEvents } from '@sapphire/plugin-subcommands';

export const enum PermissionLevels {
	Everyone = 0,
	EventManager = 4,
	Moderator = 5,
	Administrator = 6,
	ServerOwner = 7,
	BotOwner = 10
}

export const CardinalEvents = {
	...Events,
	...SubcommandPluginEvents,
	RawReactionAdd: 'rawReactionAdd'
	// TODO: Add custom events here
};

export const enum CardinalEmbedStyles {
	Default = 'default',
	Info = 'info',
	Success = 'success',
	Fail = 'fail',
	Loading = 'loading'
}
