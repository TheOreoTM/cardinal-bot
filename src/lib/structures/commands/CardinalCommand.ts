import {
	ApplicationCommandRegistry,
	Command,
	CommandOptionsRunTypeEnum,
	PreconditionContainerArray,
	Args as SapphireArgs,
	UserError,
	type MessageCommandContext
} from '@sapphire/framework';
import {
	AutocompleteInteraction,
	ContextMenuCommandInteraction as CTXMenuCommandInteraction,
	ChatInputCommandInteraction as ChatInputInteraction,
	Message,
	MessageContextMenuCommandInteraction as MessageCTXCommandInteraction,
	PermissionFlagsBits,
	PermissionsBitField,
	UserContextMenuCommandInteraction as UserCTXMenuCommandInteraction
} from 'discord.js';
import type { GuildMessage } from '#lib/types';
import { PermissionLevels } from '#lib/types';
export abstract class CardinalCommand extends Command {
	/**
	 * Whether the command can be disabled.
	 */
	public readonly guarded?: boolean;
	/**
	 * Whether the command is hidden from everyone.
	 */
	public readonly hidden?: boolean;
	/**
	 * The permission level required to run the command.
	 */
	public readonly permissionLevel?: PermissionLevels;
	/**
	 * Whether the command is only for community servers.
	 */
	public readonly community?: boolean;

	public constructor(context: Command.Context, options: CardinalCommand.Options) {
		const perms = new PermissionsBitField(options.requiredClientPermissions).add(
			PermissionFlagsBits.SendMessages,
			PermissionFlagsBits.EmbedLinks,
			PermissionFlagsBits.ViewChannel
		);
		super(context, {
			generateDashLessAliases: true,
			requiredClientPermissions: perms,
			runIn: [CommandOptionsRunTypeEnum.GuildAny],
			...options
		});
		(this.guarded = options.guarded ?? false),
			(this.hidden = options.hidden ?? false),
			(this.permissionLevel = options.permissionLevel ?? PermissionLevels.Everyone),
			(this.community = options.community ?? false);
	}

	public async prefix(message: Message) {
		return await this.container.client.fetchPrefix(message);
	}

	protected error(message: string | UserError, context?: unknown): never {
		throw typeof message === 'string' ? new UserError({ identifier: 'Error', message, context }) : message;
	}

	protected override parseConstructorPreConditions(options: CardinalCommand.Options): void {
		super.parseConstructorPreConditions(options);
		this.parseConstructorPreConditionsPermissionLevel(options);
		if (options.community) {
			this.preconditions.append('Community');
		}
	}

	protected parseConstructorPreConditionsPermissionLevel(options: CardinalCommand.Options): void {
		if (options.permissionLevel === PermissionLevels.BotOwner) {
			this.preconditions.append('BotOwner');
			return;
		}

		const container = new PreconditionContainerArray(['BotOwner'], this.preconditions);
		switch (options.permissionLevel ?? PermissionLevels.Everyone) {
			case PermissionLevels.Everyone:
				container.append('Everyone');
				break;
			case PermissionLevels.Moderator:
				container.append('Moderator');
				break;
			case PermissionLevels.Administrator:
				container.append('Administrator');
				break;
			case PermissionLevels.ServerOwner:
				container.append('ServerOwner');
				break;
			default:
				throw new Error(
					`GirCommand[${this.name}]: "permissionLevel" was specified as an invalid permission level (${options.permissionLevel}).`
				);
		}

		this.preconditions.append(container);
	}
}
export namespace CardinalCommand {
	/**
	 * The GirCommand Options
	 */
	export type Options = Command.Options & {
		/**
		 * Whether the command can be disabled.
		 */
		guarded?: boolean;
		/**
		 * Whether the command is hidden from everyone.
		 */
		hidden?: boolean;
		/**
		 * The permission level required to run the command.
		 */
		permissionLevel?: number;
		/**
		 * Whether the command is only for community servers.
		 */
		community?: boolean;
	};
	export type MessageContext = MessageCommandContext;
	export type ChatInputCommandInteraction = ChatInputInteraction<'cached'>;
	export type ContextMenuCommandInteraction = CTXMenuCommandInteraction<'cached'>;
	export type UserContextMenuCommandInteraction = UserCTXMenuCommandInteraction<'cached'>;
	export type MessageContextMenuCommandInteraction = MessageCTXCommandInteraction<'cached'>;
	export type AutoComplete = AutocompleteInteraction;
	export type Context = MessageCommandContext;

	export type Args = SapphireArgs;
	export type Message = GuildMessage;
	export type Registry = ApplicationCommandRegistry;
}
