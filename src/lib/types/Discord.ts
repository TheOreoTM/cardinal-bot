import { CardinalClient } from '#lib/CardinalClient';
import type { CardinalCommand } from '#lib/structures';
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
	Role,
	TextChannel
} from 'discord.js';

export interface GuildMessage extends Message {
	// ! channel: GuildTextBasedChannelTypes; TODO Remove this
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
