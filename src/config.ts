import { BucketScope, LogLevel, type ClientLoggerOptions, type CooldownOptions, type SapphirePrefix } from '@sapphire/framework';
import type { ScheduledTaskHandlerOptions } from '@sapphire/plugin-scheduled-tasks';
import type { RedisOptions } from 'bullmq';
import {
	ActivityType,
	GatewayIntentBits,
	Partials,
	type ClientOptions,
	type MessageMentionOptions,
	type PresenceData,
	OAuth2Scopes,
	type WebhookClientData
} from 'discord.js';
import { BotClientID, BotPrefix, CooldownFiltered } from '#constants';
import { envParseNumber, envParseString } from '@skyra/env-utilities';
import { seconds } from '#utils/common';
import type { ServerOptions } from '@sapphire/plugin-api';
import { transformOauthGuildsAndUser } from '#lib/api/util';

export const Presence = {
	activities: [{ name: `for ${BotPrefix}help`, type: ActivityType.Watching }],
	status: 'online'
} as PresenceData;

export function parseRedisOption(): Pick<RedisOptions, 'port' | 'password' | 'host' | 'db'> {
	return {
		port: envParseNumber('REDIS_PORT'),
		password: envParseString('REDIS_PASSWORD'),
		host: envParseString('REDIS_HOST'),
		db: envParseNumber('REDIS_DB')
	};
}

export const config: Config = {
	default_prefix: BotPrefix,
	intents: [
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.DirectMessageTyping
	],
	cooldown_options: {
		delay: seconds(5),
		filteredUsers: CooldownFiltered,
		scope: BucketScope.User
	},
	mentions: {
		parse: ['users'],
		repliedUser: false
	},
	partials: [Partials.GuildMember, Partials.Message, Partials.User, Partials.Channel],
	logger: {
		level: LogLevel.Info
	},

	presence: Presence,
	tasks: {
		bull: {
			connection: parseRedisOption(),
			defaultJobOptions: {
				removeOnComplete: true
			}
		}
	},
	api: {
		auth: {
			id: BotClientID,
			secret: envParseString('OAUTH_SECRET'),
			cookie: 'CARDINAL_AUTH', //envParseString('OAUTH_COOKIE'),
			redirect: 'https://oreotm.xyz/oauth/callback', // envParseString('OAUTH_REDIRECT_URI')
			scopes: [OAuth2Scopes.Identify, OAuth2Scopes.Guilds],
			domainOverwrite: '.oreotm.xyz', //envParseString('OAUTH_DOMAIN_OVERWRITE')
			transformers: [transformOauthGuildsAndUser]
		},
		prefix: '/', //envParseString('API_PREFIX'),
		origin: 'https://oreotm.xyz', //envParseString('API_ORIGIN'),
		listenOptions: {
			port: 4000
		}
	}
};

export const ClientConfig: ClientOptions = {
	intents: config.intents,
	defaultPrefix: config.default_prefix,
	allowedMentions: config.mentions,
	caseInsensitiveCommands: true,
	caseInsensitivePrefixes: true,
	defaultCooldown: config.cooldown_options,
	partials: config.partials,
	logger: config.logger,
	loadMessageCommandListeners: true,
	typing: false,
	disableMentionPrefix: false,
	preventFailedToFetchLogForGuilds: true,
	presence: config.presence,
	tasks: config.tasks,
	api: config.api
};

interface Config {
	intents: GatewayIntentBits[];
	cooldown_options: CooldownOptions;
	mentions: MessageMentionOptions;
	partials: Partials[];
	logger: ClientLoggerOptions;
	presence: PresenceData;
	default_prefix: SapphirePrefix;
	tasks: ScheduledTaskHandlerOptions;
	api: ServerOptions;
}

function parseWebhookError(): WebhookClientData | null {
	const { WEBHOOK_ERROR_TOKEN } = process.env;
	if (!WEBHOOK_ERROR_TOKEN) return null;

	return {
		id: envParseString('WEBHOOK_ERROR_ID'),
		token: WEBHOOK_ERROR_TOKEN
	};
}

export const WEBHOOK_ERROR = parseWebhookError();
