import { BotOwner, CardinalColors, ZeroWidthSpace, rootFolder } from '#utils/constants';
import { formatRoles } from '#utils/formatters';
import { sendTemporaryMessage } from '#utils/functions';
import { EmbedBuilder } from '@discordjs/builders';
import { ArgumentError, Command, Events, UserError, container, type MessageCommandErrorPayload } from '@sapphire/framework';
import type { MessageSubcommandErrorPayload } from '@sapphire/plugin-subcommands';
import { codeBlock, cutText } from '@sapphire/utilities';
import { captureException } from '@sentry/node';
import { envIsDefined } from '@skyra/env-utilities';
import { DiscordAPIError, HTTPError, RESTJSONErrorCodes, Routes, type Message } from 'discord.js';
import ms from 'enhanced-ms';

const ignoredCodes = [RESTJSONErrorCodes.UnknownChannel, RESTJSONErrorCodes.UnknownMessage];

export async function handleCommandError(error: unknown, payload: MessageCommandErrorPayload | MessageSubcommandErrorPayload) {
	const { message, command } = payload;
	let parameters: string;
	if ('args' in payload) {
		parameters = payload.parameters;
	} else {
		parameters = message.content.slice(payload.context.commandPrefix.length + payload.context.commandName.length).trim();
	}

	// If the error was a string or an UserError, send it to the user:
	if (!(error instanceof Error)) return stringError(message, String(error));
	if (error instanceof ArgumentError) return argumentError(message, error);
	if (error instanceof UserError) return userError(message, error);

	const { client, logger } = container;
	// If the error was an AbortError or an Internal Server Error, tell the user to re-try:
	if (error.name === 'AbortError' || error.message === 'Internal Server Error') {
		logger.warn(`${getWarnError(message)} (${message.author.id}) | ${error.constructor.name}`);
		return sendTemporaryMessage(message, 'There was an internal error while running the command. Please try again.');
	}

	// Extract useful information about the DiscordAPIError
	if (error instanceof DiscordAPIError) {
		if (isSilencedError(message, error)) return;
		client.emit(Events.Error, error);
	} else {
		logger.warn(`${getWarnError(message)} (${message.author.id}) | ${error.constructor.name}`);
	}

	// Send a detailed message:
	await sendErrorChannel(message, command, parameters, error);

	// Emit where the error was emitted
	logger.fatal(`[COMMAND] ${command.location.full}\n${error.stack || error.message}`);
	try {
		await sendTemporaryMessage(message, generateUnexpectedErrorMessage(message, command, error));
	} catch (err) {
		client.emit(Events.Error, err as Error);
	}

	return undefined;
}

function isSilencedError(message: Message, error: DiscordAPIError) {
	return (
		// If it's an unknown channel or an unknown message, ignore:
		ignoredCodes.includes(error.code as number) ||
		// If it's a DM message reply after a block, ignore:
		isDirectMessageReplyAfterBlock(message, error)
	);
}

function isDirectMessageReplyAfterBlock(message: Message, error: DiscordAPIError) {
	// When sending a message to a user who has blocked the bot, Discord replies with 50007 "Cannot send messages to this user":
	if (error.code !== RESTJSONErrorCodes.CannotSendMessagesToThisUser) return false;

	// If it's not a Direct Message, return false:
	if (message.guild !== null) return false;

	// If the query was made to the message's channel, then it was a DM response:
	return error.url === Routes.channelMessages(message.channel.id);
}

const sentry = envIsDefined('SENTRY_DSN');
function generateUnexpectedErrorMessage(message: Message, command: Command, error: Error) {
	if (BotOwner === message.author.id) return codeBlock('js', error.stack!);
	if (!sentry) return `You have found an unexpected error, please report the steps you have taken to the developer in the support server!`;

	try {
		const report = captureException(error, { tags: { command: command.name } });
		return `You may add \`${report}\` to the report so they can look what error was triggered.`;
	} catch (error) {
		container.client.emit(Events.Error, error as Error);
		return `You have found an unexpected error, please report the steps you have taken to the developer in the support server!`;
	}
}

function stringError(message: Message, error: string) {
	return alert(message, `An unexpected error occurred: ${cutText(error, 1900)}`);
}

function argumentError(message: Message, error: ArgumentError<unknown>) {
	const argument = error.argument.name;
	const identifier = error.identifier;
	const parameter = error.parameter.replaceAll('`', '῾');
	return alert(message, `There was an error while parsing the argument \`${argument}\` with the value \`${parameter}\`.\n\`${identifier}\``);
}

async function userError(message: Message, error: UserError) {
	// `context: { silent: true }` should make UserError silent:
	// Use cases for this are for example permissions error when running the `eval` command.
	if (Reflect.get(Object(error.context), 'silent')) return;

	let content = '';

	if (error.identifier === 'NotRegistered') {
		content = `Please register your account using \`${await container.client.fetchPrefix(message)}register\``;
	} else if (error.identifier === 'argsMissing') {
		content = `You are missing some arguments`;
	} else if (error.identifier === 'argsUnavailable') {
		content = `Some arguments arent available`;
	} else if (error.identifier === 'preconditionGuildOnly') {
		content = `This command can only run in guilds`;
	} else if (error.identifier === 'preconditionNsfw') {
		content = `This command can only be used in NSFW channels`;
	} else if (error.identifier === 'preconditionUserPermissions') {
		const { missing } = error.context as { missing: [] };
		content = `You need \`${formatRoles(missing).join('` `')}\` permission${missing.length - 1 === 0 ? '' : '(s)'} to run this command`;
	} else if (error.identifier === 'preconditionCooldown') {
		const { remaining } = error.context as { remaining: number };
		content = `${message.author}, a little too quick there. Wait ${ms(remaining)}`;
	} else if (error.identifier === 'preconditionUserPermissions') {
		const { missing } = error.context as { missing: [] };
		content = `You need \`${formatRoles(missing).join('` `')}\` permission${missing.length - 1 === 0 ? '' : '(s)'} to run this command`;
	} else {
		content = `There was an error while running the command: \`${error.identifier}\``;
	}

	return alert(message, content);
}

function alert(message: Message, content: string) {
	return sendTemporaryMessage(message, { content, allowedMentions: { users: [message.author.id], roles: [] } });
}

async function sendErrorChannel(message: Message, command: Command, parameters: string, error: Error) {
	const webhook = container.client.webhookError;
	if (webhook === null) return;

	const lines = [getLinkLine(message.url), getCommandLine(command), getArgumentsLine(parameters), getErrorLine(error)];

	// If it's a DiscordAPIError or a HTTPError, add the HTTP path and code lines after the second one.
	if (error instanceof DiscordAPIError || error instanceof HTTPError) {
		lines.splice(2, 0, getPathLine(error), getCodeLine(error));
	}

	const embed = new EmbedBuilder().setDescription(lines.join('\n')).setColor(CardinalColors.Fail).setTimestamp();
	try {
		await webhook.send({ embeds: [embed] });
	} catch (err) {
		container.client.emit(Events.Error, err as Error);
	}
}

/**
 * Formats a message url line.
 * @param url The url to format.
 */
function getLinkLine(url: string): string {
	return `[**Jump to Message!**](${url})`;
}

/**
 * Formats a command line.
 * @param command The command to format.
 */
function getCommandLine(command: Command): string {
	return `**Command**: ${command.location.full.slice(rootFolder.length)}`;
}

/**
 * Formats an error path line.
 * @param error The error to format.
 */
function getPathLine(error: DiscordAPIError | HTTPError): string {
	return `**Path**: ${error.method.toUpperCase()} ${error.url}`;
}

/**
 * Formats an error code line.
 * @param error The error to format.
 */
function getCodeLine(error: DiscordAPIError | HTTPError): string {
	return `**Code**: ${'code' in error ? error.code : error.status}`;
}

/**
 * Formats an arguments line.
 * @param parameters The arguments the user used when running the command.
 */
function getArgumentsLine(parameters: string): string {
	if (parameters.length === 0) return '**Parameters**: Not Supplied';
	return `**Parameters**: [\`${parameters.trim().replaceAll('`', '῾') || ZeroWidthSpace}\`]`;
}

/**
 * Formats an error codeblock.
 * @param error The error to format.
 */
function getErrorLine(error: Error): string {
	return `**Error**: ${codeBlock('js', error.stack || error.toString())}`;
}

function getWarnError(message: Message) {
	return `ERROR: /${message.guild ? `${message.guild.id}/${message.channel.id}` : `DM/${message.author.id}`}/${message.id}`;
}
