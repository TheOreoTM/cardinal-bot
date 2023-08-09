import { CardinalCommand } from '#lib/structures/commands/CardinalCommand';
import { type GuildMessage } from '#lib/types';
import { ApplicationCommandRegistry, CommandOptionsRunTypeEnum, type MessageCommandContext, Args as SapphireArgs } from '@sapphire/framework';
import {
	AutocompleteInteraction,
	PermissionFlagsBits,
	PermissionsBitField,
	ContextMenuCommandInteraction as CTXMenuCommandInteraction,
	ChatInputCommandInteraction as ChatInputInteraction,
	MessageContextMenuCommandInteraction as MessageCTXCommandInteraction,
	UserContextMenuCommandInteraction as UserCTXMenuCommandInteraction
} from 'discord.js';

export abstract class ModerationCommand extends CardinalCommand {
	public constructor(context: CardinalCommand.Context, options: CardinalCommand.Options) {
		const perms = new PermissionsBitField(options.requiredClientPermissions).add(
			PermissionFlagsBits.SendMessages,
			PermissionFlagsBits.EmbedLinks,
			PermissionFlagsBits.ViewChannel
		);
		super(context, {
			generateDashLessAliases: true,
			requiredClientPermissions: perms,
			runIn: [CommandOptionsRunTypeEnum.GuildAny],
			preconditions: ['ModerationCommand'],
			...options
		});
	}
}

export namespace ModerationCommand {
	export type Options = CardinalCommand.Options;

	export type MessageContext = MessageCommandContext;
	export type ChatInputCommandInteraction = ChatInputInteraction<'cached'>;
	export type ContextMenuCommandInteraction = CTXMenuCommandInteraction<'cached'>;
	export type UserContextMenuCommandInteraction = UserCTXMenuCommandInteraction<'cached'>;
	export type MessageContextMenuCommandInteraction = MessageCTXCommandInteraction<'cached'>;
	export type AutoComplete = AutocompleteInteraction;
	export type Context = CardinalCommand.Context;

	export type Args = SapphireArgs;
	export type Message = GuildMessage;
	export type Registry = ApplicationCommandRegistry;
}
