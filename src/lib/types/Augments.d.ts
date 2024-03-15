import '@sapphire/pieces';
import type { PrismaClient } from '@prisma/client';
import type { ArrayString, NumberString } from '@skyra/env-utilities';
import type { Analytics, CardinalCommand, GuildSettings } from '#lib/structures';
import type { LongLivingReactionCollector } from '#utils/LongLivingReactionCollector';
import type { User, Snowflake } from 'discord.js';
import type { Duration } from '@sapphire/time-utilities';
import type { AutomodRule } from '#lib/types';
import type { RedisClient } from '#lib/database';
import type { Metrics } from '@prisma/client/runtime/library';
import type { xprisma } from '#lib/database/prisma';

declare module '@skyra/env-utilities' {
	interface Env {
		DISCORD_TOKEN: string;

		BOT_OWNER: string;
		BOT_PRIVILEGED_USERS?: ArrayString;
		BOT_PREFIX: string;

		REDIS_PORT: NumberString;
		REDIS_HOST: string;
		REDIS_PASSWORD: string;
		REDIS_DB: NumberString;

		API_ENABLED: BooleanString;
		API_ORIGIN: string;
		API_PORT: IntegerString;
		API_PREFIX: string;

		OAUTH_COOKIE: string;
		OAUTH_DOMAIN_OVERWRITE: string;
		OAUTH_REDIRECT_URI: string;
		OAUTH_SCOPE: ArrayString;
		OAUTH_SECRET: string;

		WEB_URL: string;

		CARDINAL_API_KEY: string;
		SENTRY_DSN: string?;

		OAUTH_REDIRECT_URI: string;
		OAUTH_DOMAIN_OVERWRITE: string;

		WEBHOOK_ERROR_ID: string;
		WEBHOOK_ERROR_TOKEN: string;
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		db: typeof xprisma;
		cache: RedisClient;
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
		UnlockChannelTask: never;
	}
}

declare module 'discord.js' {
	interface Client {
		readonly llrCollectors: Set<LongLivingReactionCollector>;
		readonly analytics: Analytics;
		readonly webhookError: WebhookClient | null;
	}

	interface Guild {
		settings: GuildSettings;
	}
}
