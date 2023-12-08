import '@sapphire/pieces';
import type { PrismaClient } from '@prisma/client';
import type { ArrayString, NumberString } from '@skyra/env-utilities';
import type { CardinalCommand, GuildSettings } from '#lib/structures';
import type { LongLivingReactionCollector } from '#utils/LongLivingReactionCollector';
import type { User, Snowflake } from 'discord.js';
import type { Duration } from '@sapphire/time-utilities';
import type { AutomodRule } from '#lib/types';

declare module '@skyra/env-utilities' {
	interface Env {
		DISCORD_TOKEN: string;
		CLIENT_SECRET: string;

		BOT_OWNER: string;
		BOT_PRIVILEGED_USERS?: ArrayString;
		BOT_PREFIX: string;

		REDIS_PORT: NumberString;
		REDIS_HOST: string;
		REDIS_PASSWORD: string;

		API_PORT: NumberString;
		API_HOST: string;
		API_AUTH_COOKIE: string;
		API_AUTH_DOMAIN: string;

		WEB_URL: string;

		CARDINAL_API_KEY: string;

		OAUTH_REDIRECT_URI: string;
		OAUTH_DOMAIN_OVERWRITE: string;
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		db: PrismaClient;
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		CommandRestriction: never;
		GuildOnly: never;
		OwnerMode: never;
		Blacklisted: never;
		BotOwner: never;
		Everyone: never;
		Moderator: never;
		Administrator: never;
		Staff: never;
		Trainee: never;
		ModeratorCommand: never;
		ServerOwner: never;
		Community: never;
	}

	export interface DetailedDescriptionCommand {
		usages?: string[];
		extendedHelp?: string;
		explainedUsage?: [string, string][];
		possibleFormats?: [string, string][];
		examples?: (null | string)[];
		reminder?: string;
	}
	interface ArgType {
		snowflake: Snowflake;
		commandCategory: string;
		duration: Duration;
		userName: User;
		commandName: CardinalCommand;
		automodRule: AutomodRule;
	}
}

declare module '@sapphire/plugin-scheduled-tasks' {
	interface ScheduledTasks {
		UnmuteMemberTask: never;
		UnbanMemberTask: never;
		EndGiveawayTask: never;
		RemoveInfractionTask: never;
	}
}

declare module 'discord.js' {
	interface Client {
		readonly llrCollectors: Set<LongLivingReactionCollector>;
	}

	interface Guild {
		settings: GuildSettings;
	}
}
