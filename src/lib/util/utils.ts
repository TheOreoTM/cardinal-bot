import { CardinalClient } from '#lib/CardinalClient';
import {
	container,
	type ChatInputCommandSuccessPayload,
	type Command,
	type ContextMenuCommandSuccessPayload,
	type MessageCommandSuccessPayload,
	UserError
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
	userMention
} from 'discord.js';
import { BotClientID, CardinalColors, ZeroWidthSpace } from '#constants';
import { isNullishOrEmpty } from '@sapphire/utilities';
import { CardinalEmbedBuilder, GiveawayManager, type GiveawayData, Timestamp } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { send } from '@sapphire/plugin-editable-commands';
import { ButtonLimits } from '@sapphire/discord.js-utilities';
import { lstatSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { HttpCodes, type ApiRequest, type ApiResponse } from '@sapphire/plugin-api';
import { createFunctionPrecondition } from '@sapphire/decorators';
import { envParseString } from '@skyra/env-utilities';
import { RateLimitManager } from '@sapphire/ratelimits';
import { bold } from 'discord.js';
import { andList } from '#utils/formatters';

export const endGiveaway = async (gw: GiveawayData) => {
	const giveaway = GiveawayManager.fromDatabase(gw);
	await giveaway.delete();
	const winners = giveaway.getWinners();

	const channel = container.client.channels.cache.get(giveaway.channelId);
	if (!channel || !channel.isTextBased()) {
		await giveaway.delete();
		return;
	}
	const message = await channel.messages.fetch(giveaway.messageId);
	if (!message) {
		channel.send({
			embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`The original giveaway message was deleted`)]
		});
	}

	if (winners instanceof UserError) {
		message.edit({
			embeds: [
				new CardinalEmbedBuilder(message.embeds[0].data).setColor(CardinalColors.Fail).setDescription('Not enough entries to get a winner.')
			]
		});
		return channel.send({ embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(winners.message)] });
	}

	const formattedEndTime = new Timestamp(giveaway.endsAtTimestamp);
	let formattedWinners = winners.map((winnerId) => `<@${winnerId}>`);
	const description = [];
	if (giveaway.description) description.push(`**Description:** ${giveaway.description}`);
	description.push(`Ended: ${formattedEndTime.getRelativeTime()} (${formattedEndTime.getLongDateTime()})`);
	description.push(`Hosted by: ${userMention(giveaway.hosterId)}`);
	description.push(`Participants: **${giveaway.participants.length}**`);
	description.push(`Winners: ${andList(formattedWinners)}`);

	const embed = new CardinalEmbedBuilder()
		.setStyle('default')
		.setTitle(giveaway.prize)
		.setDescription(description.join('\n'))
		.setTimestamp(giveaway.endsAt);

	console.log('hi');
	if (message) {
		message.edit({ content: '', embeds: [embed], components: [] });
	}

	await message.channel.send({
		content: `Congratulations ${andList(formattedWinners)}! You won the ${bold(giveaway.prize)}`
	});
};

export const authenticated = () =>
	createFunctionPrecondition(
		(request: ApiRequest) => Boolean(request.headers.authorization === `Bot ${envParseString('DISCORD_TOKEN')}`),
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
