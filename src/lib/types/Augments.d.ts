import type { PrismaClient } from '@prisma/client';
import type { ArrayString, NumberString } from '@skyra/env-utilities';
import type { GuildSettings } from '../structures';
import type { LongLivingReactionCollector } from '#utils/LongLivingReactionCollector';
import type { User } from 'discord.js';

declare module '@skyra/env-utilities' {
	interface Env {
		DISCORD_TOKEN: string;

		BOT_OWNER: string;
		BOT_PRIVILEGED_USERS?: ArrayString;
		BOT_PREFIX: string;

		REDIS_PORT: NumberString;
		REDIS_HOST: string;
		REDIS_PASSWORD: string;
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		db: PrismaClient;
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		BotOwner: never;
		Everyone: never;
		Trainee: never;
		Staff: never;
		Moderator: never;
		Administrator: never;
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
		commandCategory: string;
		duration: number;
		// commandName: CardinalCommand;
		userName: User;
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
