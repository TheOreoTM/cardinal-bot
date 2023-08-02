import { ButtonLimits, canReact, canRemoveAllReactions } from '@sapphire/discord.js-utilities';
import { container } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { RESTJSONErrorCodes } from 'discord-api-types/v9';
import {
	Message,
	User,
	type MessageCreateOptions,
	type UserResolvable,
	Guild,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	MessagePayload
} from 'discord.js';
import { setTimeout as sleep } from 'node:timers/promises';
import { floatPromise, minutes, resolveOnErrorCodes, seconds } from '#utils/common';
import { CardinalCommand } from '#lib/structures';

export const deletedMessages = new WeakSet<Message>();
const messageCommands = new WeakMap<Message, CardinalCommand>();

/**
 * Send a message to a user as from a guild, (no components allowed)
 * @param message The message you want to send
 */
export async function sendMessageAsGuild(user: User, guild: Guild, options: string | Omit<MessagePayload, 'components'> | MessageCreateOptions) {
	const sentFromButton = new ButtonBuilder()
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(true)
		.setLabel(`Sent from ${guild.name.slice(0, ButtonLimits.MaximumLabelCharacters - 'sent from'.length)}`)
		.setCustomId(`sentFrom-${guild.id}`);

	const o: string | MessagePayload | MessageCreateOptions =
		typeof options === 'string'
			? { content: options }
			: {
					...options,
					components: [new ActionRowBuilder<ButtonBuilder>().addComponents(sentFromButton)]
			  };
	await user.send(o).catch((err) => console.error(err));
}

/**
 * Check if a message is deleted by looking for it in the deletedMessages Set
 * @param message The message to check
 */
export function isMessageDeleted(message: Message): boolean {
	return deletedMessages.has(message);
}

/**
 * Marks a message as deleted by adding it into the deletedMessages Set
 * @param message The message to mark as deleted
 */
export function markMessageAsDeleted(message: Message) {
	deletedMessages.add(message);
}

/**
 * Sets or resets the tracking status of a message with a command.
 * @param message The message to track.
 * @param command The command that was run with the given message, if any.
 */
export function setCommand(message: Message, command: CardinalCommand | null) {
	if (command === null) messageCommands.delete(message);
	else messageCommands.set(message, command);
}

/**
 * Gets the tracked command from a message.
 * @param message The message to get the command from.
 * @returns The command that was run with the given message, if any.
 */
export function getCommand(message: Message): CardinalCommand | null {
	return messageCommands.get(message) ?? null;
}

async function deleteMessageImmediately(message: Message): Promise<Message> {
	return (await resolveOnErrorCodes(message.delete(), RESTJSONErrorCodes.UnknownMessage)) ?? message;
}

/**
 * Deletes a message, skipping if it was already deleted, and aborting if a non-zero timer was set and the message was
 * either deleted or edited.
 *
 * This also ignores the `UnknownMessage` error code.
 * @param message The message to delete.
 * @param time The amount of time, defaults to 0.
 * @returns The deleted message.
 */
export async function deleteMessage(message: Message, time = 0): Promise<Message> {
	if (isMessageDeleted(message)) return message;
	if (time === 0) return deleteMessageImmediately(message);

	const lastEditedTimestamp = message.editedTimestamp;
	await sleep(time);

	// If it was deleted or edited, cancel:
	if (isMessageDeleted(message) || message.editedTimestamp !== lastEditedTimestamp) {
		return message;
	}

	return deleteMessageImmediately(message);
}

/**
 * Sends a temporary editable message and then floats a {@link deleteMessage} with the given `timer`.
 * @param message The message to reply to.
 * @param options The options to be sent to the channel.
 * @param timer The timer in which the message should be deleted, using {@link deleteMessage}.
 * @returns The response message.
 */
export async function sendTemporaryMessage(message: Message, options: string | MessageCreateOptions, timer = seconds(7)): Promise<Message> {
	if (typeof options === 'string') options = { content: options };

	const response = (await send(message, options)) as Message;
	floatPromise(deleteMessage(response, timer));
	return response;
}

/**
 * The prompt confirmation options.
 */
export interface PromptConfirmationMessageOptions extends MessageCreateOptions {
	/**
	 * The target.
	 * @default message.author
	 */
	target?: UserResolvable;

	/**
	 * The time for the confirmation to run.
	 * @default minutes(1)
	 */
	time?: number;
}

const enum PromptConfirmationReactions {
	Yes = '🇾',
	No = '🇳'
}

async function promptConfirmationReaction(message: Message, response: Message, options: PromptConfirmationMessageOptions) {
	await response.react(PromptConfirmationReactions.Yes);
	await response.react(PromptConfirmationReactions.No);

	const target = container.client.users.resolveId(options.target ?? message.author)!;
	const reactions = await response.awaitReactions({ filter: (__, user) => user.id === target, time: minutes(1), max: 1 });

	// Remove all reactions if the user has permissions to do so
	if (canRemoveAllReactions(response.channel)) {
		floatPromise(response.reactions.removeAll());
	}

	return reactions.size === 0 ? null : reactions.firstKey() === PromptConfirmationReactions.Yes;
}

const promptConfirmationMessageRegExp = /^y|yes?|yeah?$/i;
async function promptConfirmationMessage(message: Message, response: Message, options: PromptConfirmationMessageOptions) {
	const target = container.client.users.resolveId(options.target ?? message.author)!;
	const messages = await response.channel.awaitMessages({ filter: (message) => message.author.id === target, time: minutes(1), max: 1 });

	return messages.size === 0 ? null : promptConfirmationMessageRegExp.test(messages.first()!.content);
}

/**
 * Sends a boolean confirmation prompt asking the `target` for either of two choices.
 * @param message The message to ask for a confirmation from.
 * @param options The options for the message to be sent, alongside the prompt options.
 * @returns `null` if no response was given within the requested time, `boolean` otherwise.
 */
export async function promptConfirmation(message: Message, options: string | PromptConfirmationMessageOptions) {
	if (typeof options === 'string') options = { content: options };

	// TODO: Switch to buttons.
	const response = await send(message, options);
	return canReact(response.channel)
		? promptConfirmationReaction(message, response, options)
		: promptConfirmationMessage(message, response, options);
}

export async function promptForMessage(message: Message, sendOptions: string | MessageCreateOptions, time = minutes(1)): Promise<string | null> {
	const response = await message.channel.send(sendOptions);
	const responses = await message.channel.awaitMessages({ filter: (msg) => msg.author === message.author, time, max: 1 });
	floatPromise(deleteMessage(response));

	return responses.size === 0 ? null : responses.first()!.content;
}
