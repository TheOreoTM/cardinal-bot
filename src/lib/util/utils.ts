import { CardinalClient } from '#lib/CardinalClient';
import {
	container,
	type ChatInputCommandSuccessPayload,
	type Command,
	type ContextMenuCommandSuccessPayload,
	type MessageCommandSuccessPayload
} from '@sapphire/framework';
import { cyan } from 'colorette';
import {
	ButtonBuilder,
	ButtonStyle,
	type APIUser,
	type EmbedAuthorData,
	type Guild,
	type ImageURLOptions,
	type Message,
	type User,
	type Snowflake,
	EmbedBuilder,
	type APIEmbedField
} from 'discord.js';
import { CardinalColors, ZeroWidthSpace } from '#constants';
import { chunk, isNullishOrEmpty } from '@sapphire/utilities';
import { CardinalEmbedBuilder } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { send } from '@sapphire/plugin-editable-commands';
import { ButtonLimits } from '@sapphire/discord.js-utilities';
import { lstatSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { HttpCodes, type ApiRequest, type ApiResponse } from '@sapphire/plugin-api';
import { createFunctionPrecondition } from '@sapphire/decorators';
import { envParseString } from '@skyra/env-utilities';
import { RateLimitManager } from '@sapphire/ratelimits';

/**
 * @param items The items that should be paginated
 * @param template The base embed that you want to be copied
 * @param addField The logic that you want to be executed for each field addition
 * @param itemsPerPage The number of items on each page
 * @field
 * @returns An array of embeds to use in CardinalPaginatedMessageEmbedFields
 */
export function generatePaginatedEmbeds<T>(items: T[], template: EmbedBuilder, addField: (item: T) => APIEmbedField, itemsPerPage = 10) {
	const chunks = chunk<T>(items, itemsPerPage);
	const embeds: EmbedBuilder[] = [];
	for (const chunk of chunks) {
		const embed = template;
		for (const item of chunk) {
			embed.addFields(addField(item));
		}
		console.log(embeds.length);
		embeds.push(embed);
	}

	return embeds;
}

/**
 * Returns the cached member if it is cached. If its not cached it fetches it and returns it.
 * Important: Doesnt check if the member fetched is valid or not
 * @param guild The guild you want to search the member in
 * @param memberId The id of the member you want to get
 * @returns a GuildMember
 */
export async function getMember(guild: Guild, memberId: Snowflake) {
	const cachedMember = guild.members.cache.get(memberId);
	if (cachedMember) return cachedMember;
	const fetchedGuild = await guild.members.fetch({ user: memberId });
	return fetchedGuild;
}

/**
 * Returns the cached guild if it is cached. If its not cached it fetches it and returns it.
 * Important: Doesnt check if the guild fetched is valid or not
 * @param guildId The id of the guild you want to get
 * @returns a Guild
 */
export async function getGuild(guildId: Snowflake) {
	const cachedGuild = container.client.guilds.cache.get(guildId);
	if (cachedGuild) return cachedGuild;
	const fetchedGuild = await container.client.guilds.fetch({ guild: guildId, cache: true });
	return fetchedGuild;
}

export function pickRandom<T>(array: ReadonlyArray<T>) {
	const arr = [...array];

	return arr[Math.floor(Math.random() * arr.length)];
}

export function pickRandoms<T>(array: ReadonlyArray<T>, amount = 1) {
	const arr = [...array];
	if (amount === undefined || amount === 1) {
		return [arr[Math.floor(Math.random() * arr.length)]];
	}

	if (arr.length === 0 || amount === 0) {
		return [];
	}

	if (arr.length === 1) {
		return arr;
	}

	return Array.from({ length: Math.min(amount, arr.length) }, () => arr.splice(Math.floor(Math.random() * arr.length), 1)[0]);
}

export const authenticated = () =>
	createFunctionPrecondition(
		(request: ApiRequest) => Boolean(request.headers.authorization === `Bot ${envParseString('DISCORD_TOKEN')}`) || Boolean(request.auth?.token),
		(_request: ApiRequest, response: ApiResponse) => response.error(HttpCodes.Unauthorized)
	);

/**
 * @param time The amount of milliseconds for the ratelimits from this manager to expire.
 * @param limit The amount of times a {@link RateLimit} can drip before it's limited.
 * @param auth Whether or not this should be auth-limited
 */
export function ratelimit(time: number, limit = 1, auth = false) {
	const manager = new RateLimitManager(time, limit);
	const xRateLimitLimit = time;
	return createFunctionPrecondition(
		(request: ApiRequest, response: ApiResponse) => {
			const id = (auth ? request.auth!.id : request.headers['x-forwarded-for'] || request.socket.remoteAddress) as string;
			const bucket = manager.acquire(id);

			response.setHeader('Date', new Date().toUTCString());
			if (bucket.limited) {
				response.setHeader('Retry-After', bucket.remainingTime.toString());
				return false;
			}

			try {
				bucket.consume();
			} catch {}

			response.setHeader('X-RateLimit-Limit', xRateLimitLimit);
			response.setHeader('X-RateLimit-Remaining', bucket.remaining.toString());
			response.setHeader('X-RateLimit-Reset', bucket.remainingTime.toString());

			return true;
		},
		(_request: ApiRequest, response: ApiResponse) => {
			response.error(HttpCodes.TooManyRequests);
		}
	);
}

/**
 *
 * @param command The name of the slash command you want to get the id of
 * @param client The instance of the CardinalClient
 * @returns  The id of the command if it exists, otherwise returns '0'
 */
export async function getSlashId(command: string, client: CardinalClient) {
	const commands = await (await client.application?.fetch())?.commands.fetch();

	if (!commands) throw new Error('Failed to fetch commands!');

	const commandNames = command.split(' ');

	const slash = commands.find((c) => c.name === commandNames[0]);

	if (!slash) return '0';

	return slash.id;
}

/**
 *
 * @param command The name of the slash command you want to mention
 * @param client The instance of the CardinalClient
 * @returns A string formatted as `</${command}:${slash.id}>`; if the command was not found `/${command}`
 */
export async function mention(command: string, client: CardinalClient) {
	const commands = await (await client.application?.fetch())?.commands.fetch();

	if (!commands) throw new Error('Failed to fetch commands!');

	const commandNames = command.split(' ');

	const slash = commands.find((c) => c.name === commandNames[0]);

	if (!slash) return `/${command}`;

	return `</${command}:${slash.id}>`;
}

/**
 * Shuffles an array, returning it
 * @param array The array to shuffle
 */
export const shuffle = <T>(array: T[]): T[] => {
	let m = array.length;
	while (m) {
		const i = Math.floor(Math.random() * m--);
		[array[m], array[i]] = [array[i], array[m]];
	}
	return array;
};

/**
 * Clean all mentions from a body of text
 * @param guild The guild for context
 * @param input The input to clean
 * @returns The input cleaned of mentions
 * @license Apache-2.0
 * @copyright 2019 Aura Román
 */
export function cleanMentions(guild: Guild, input: string) {
	return input.replace(/@(here|everyone)/g, `@${ZeroWidthSpace}$1`).replace(/<(@[!&]?|#)(\d{17,19})>/g, (match, type, id) => {
		switch (type) {
			case '@':
			case '@!': {
				const tag = guild.client.users.cache.get(id);
				return tag ? `@${tag.username}` : `<${type}${ZeroWidthSpace}${id}>`;
			}
			case '@&': {
				const role = guild.roles.cache.get(id);
				return role ? `@${role.name}` : match;
			}
			case '#': {
				const channel = guild.channels.cache.get(id);
				return channel ? `#${channel.name}` : `<${type}${ZeroWidthSpace}${id}>`;
			}
			default:
				return `<${type}${ZeroWidthSpace}${id}>`;
		}
	});
}

export const anyMentionRegExp = /<(@[!&]?|#)(\d{17,19})>/g;
export const hereOrEveryoneMentionRegExp = /@(?:here|everyone)/;

export function logSuccessCommand(payload: ContextMenuCommandSuccessPayload | ChatInputCommandSuccessPayload | MessageCommandSuccessPayload): void {
	let successLoggerData: ReturnType<typeof getSuccessLoggerData>;

	if ('interaction' in payload) {
		successLoggerData = getSuccessLoggerData(payload.interaction.guild, payload.interaction.user, payload.command);
	} else {
		successLoggerData = getSuccessLoggerData(payload.message.guild, payload.message.author, payload.command);
	}

	container.logger.debug(`${successLoggerData.shard} - ${successLoggerData.commandName} ${successLoggerData.author} ${successLoggerData.sentAt}`);
}

export function getSuccessLoggerData(guild: Guild | null, user: User, command: Command) {
	const shard = getShardInfo(guild?.shardId ?? 0);
	const commandName = getCommandInfo(command);
	const author = getAuthorInfo(user);
	const sentAt = getGuildInfo(guild);

	return { shard, commandName, author, sentAt };
}

function getShardInfo(id: number) {
	return `[${cyan(id.toString())}]`;
}

function getCommandInfo(command: Command) {
	return cyan(command.name);
}

function getAuthorInfo(author: User | APIUser) {
	return `${author.username}[${cyan(author.id)}]`;
}

function getGuildInfo(guild: Guild | null) {
	if (guild === null) return 'Direct Messages';
	return `${guild.name}[${cyan(guild.id)}]`;
}

/**
 * Generate a random number in a range
 * @param min
 * @param max
 * @returns
 */

export function getRandomNumberInRange(min: number, max: number): number {
	if (min >= max) {
		throw new Error('Invalid range: min should be less than max.');
	}

	// Calculate the range (inclusive of min and max)
	const range = max - min + 1;

	// Generate a random number between 0 (inclusive) and 1 (exclusive)
	const randomFraction = Math.random();

	// Scale the random fraction to the range and add the minimum value to it
	const randomNumberInRange = Math.floor(randomFraction * range) + min;

	return randomNumberInRange;
}

/**
 * Sums the values of an array of number
 * @param numbers
 * @returns
 */

export function sumArray(numbers: number[]): number {
	return numbers.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
}

export function getColor(message: Message) {
	return message.member?.displayColor ?? CardinalColors.Default;
}

export function getFullEmbedAuthor(user: User | APIUser, url?: string | undefined): EmbedAuthorData {
	return { name: `${getTag(user)} (${user.id})`, iconURL: getDisplayAvatar(user, { size: 128 }), url };
}

const ROOT = 'https://cdn.discordapp.com';
export function usesPomelo(user: User | APIUser) {
	return isNullishOrEmpty(user.discriminator) || user.discriminator === '0';
}

export function getDisplayAvatar(user: User | APIUser, options: ImageURLOptions = {}) {
	if (user.avatar === null) {
		const id = (usesPomelo(user) ? (BigInt(user.id) >> 22n) % 6n : Number(user.discriminator) % 5).toString();
		return `${ROOT}/embed/avatars/${id}.png`;
	}

	const extension = !options.forceStatic && user.avatar.startsWith('a_') ? 'gif' : options.extension ?? 'webp';
	const size = typeof options.size === 'undefined' ? '' : `?size=${options.size}`;
	return `${ROOT}/avatars/${user.id}/${user.avatar}.${extension}${size}`;
}

export function getTag(user: User | APIUser) {
	return usesPomelo(user) ? `@${user.username}` : `${user.username}#${user.discriminator}`;
}

export const sendLoadingMessage = <T extends GuildMessage | Message>(message: T): Promise<T> => {
	const embed = new CardinalEmbedBuilder().setStyle('loading').setDescription('Loading...');
	return send(message, { embeds: [embed] }) as Promise<T>;
};

export async function isGuildPremium(guildId: string) {
	const guildData = await container.db.guild.findUnique({ where: { guildId } });
	if (!guildData) return false;
	return guildData.premium;
}

export function generateSendMessageAsGuildButton(guild: Guild) {
	return new ButtonBuilder()
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(true)
		.setLabel(`Sent from ${guild.name.slice(0, ButtonLimits.MaximumLabelCharacters - 'sent from'.length)}`)
		.setCustomId(`sentFrom-${guild.id}`);
}

export function countlines(path: string) {
	let linesOfCode = 0;
	let numOfFiles = 0;
	function lines(dir: string) {
		const files = readdirSync(dir);
		for (const file of files) {
			const stat = lstatSync(join(dir, file));
			if (stat.isDirectory()) {
				lines(join(dir, file));
			} else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.d.ts') || file.endsWith('.js.map')) {
				const buffer = readFileSync(join(dir, file)).toString();
				const lines = buffer.split('\n');
				linesOfCode += lines.length;
				numOfFiles++;
			}
		}
	}

	if (linesOfCode === 0) lines(join(process.cwd(), path));
	return {
		linesOfCode,
		numOfFiles
	};
}
