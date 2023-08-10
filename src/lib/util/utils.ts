import type { CardinalClient } from '#lib/CardinalClient';
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
	type User
} from 'discord.js';
import { CardinalColors, ZeroWidthSpace } from '#constants';
import { isNullishOrEmpty } from '@sapphire/utilities';
import { CardinalEmbedBuilder } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { send } from '@sapphire/plugin-editable-commands';
import { ButtonLimits } from '@sapphire/discord.js-utilities';

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
