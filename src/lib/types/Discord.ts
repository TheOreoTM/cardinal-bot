import { CardinalClient } from '#lib/CardinalClient';
import type { CardinalCommand } from '#lib/structures';
import type {
	ChatInputCommand,
	ChatInputCommandContext,
	ContextMenuCommand,
	ContextMenuCommandContext,
	MessageCommand,
	MessageCommandContext
} from '@sapphire/framework';
import type {
	ButtonInteraction,
	CommandInteraction,
	CommandInteractionOptionResolver,
	ContextMenuCommandInteraction,
	DMChannel,
	Guild,
	GuildBasedChannel,
	GuildMember,
	Message,
	NewsChannel,
	Role,
	StageChannel,
	TextChannel,
	VoiceChannel
} from 'discord.js';

export type GuildChannel = TextChannel | NewsChannel | StageChannel | VoiceChannel;

export interface GuildMessage extends Message {
	channel: GuildChannel;
	readonly guildId: string;
	readonly guild: Guild;
	readonly member: GuildMember;
}

export interface DMMessage extends Message {
	channel: DMChannel;
	readonly guild: null;
	readonly member: null;
}

export type MessageAcknowledgeable = TextChannel | GuildMessage;

export interface GuildInteraction extends CommandInteraction {
	readonly guild: Guild;
	readonly guildId: string;
	readonly member: GuildMember;
	readonly channel: TextChannel;
	options: GuildCommandInteractionOptionResolver;
	client: CardinalClient<true>;
}

export interface GuildContextMenuInteraction extends ContextMenuCommandInteraction {
	readonly guild: Guild;
	readonly guildId: string;
	readonly member: GuildMember;
	options: GuildCommandInteractionOptionResolver;
}

export interface GuildCommandInteractionOptionResolver extends CommandInteractionOptionResolver {
	getMember(name: string): GuildMember;
	getChannel(name: string, required?: boolean): GuildBasedChannel;
	getRole(name: string, required?: boolean): Role;
}

export interface CardinalButtonInteraction extends ButtonInteraction {
	readonly message: Message;
	client: CardinalClient<true>;
}

export type InteractionOrMessage = Message | CardinalCommand.ChatInputCommandInteraction | CardinalCommand.ContextMenuCommandInteraction;
export type InteractionOrMessageCommandContext = MessageCommandContext | ChatInputCommandContext | ContextMenuCommandContext;
export type InteractionOrMessageCommand = MessageCommand | ChatInputCommand | ContextMenuCommand;
