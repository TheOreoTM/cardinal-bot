import { CardinalColors } from '#constants';
import { CardinalCommand, LanguageHelp, type LanguageHelpDisplayOptions } from '#lib/structures';
import { isPrivateMessage, isGuildMessage } from '#utils/common';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedMessage, UserOrMemberMentionRegex } from '@sapphire/discord.js-utilities';
import { Args, Result, container } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Collection, EmbedBuilder, Message } from 'discord.js';

/**
 * Sorts a collection alphabetically as based on the keys, rather than the values.
 * This is used to ensure that subcategories are listed in the pages right after the main category.
 * @param _ The first element for comparison
 * @param __ The second element for comparison
 * @param firstCategory Key of the first element for comparison
 * @param secondCategory Key of the second element for comparison
 */
function sortCommandsAlphabetically(_: CardinalCommand[], __: CardinalCommand[], firstCategory: string, secondCategory: string): 1 | -1 | 0 {
	if (firstCategory > secondCategory) return 1;
	if (secondCategory > firstCategory) return -1;
	return 0;
}

@ApplyOptions<CardinalCommand.Options>({
	aliases: ['commands', 'cmd', 'cmds'],
	description: 'Displays all commands or the description of one.',
	detailedDescription: {
		usages: ['--cat/--categories', '--all', '[CategoryName]', '[Page]', '[CommandName]'],
		extendedHelp:
			'The help command shows a paginated list of all commands by their categories, or the extended information of a command if specified.\n\nIf you use `--categories` or `--cat`, you can get the list of all categories and the amount of commands each one of them have.',
		reminder: 'The help command **only** shows the commands you can use.',
		examples: ['--cat', '--all', 'Moderation', '12', 'help']
	},
	flags: ['cat', 'categories', 'all'],
	guarded: true
})
export class HelpCommand extends CardinalCommand {
	public async messageRun(message: Message, args: CardinalCommand.Args, context: CardinalCommand.MessageContext) {
		if (args.finished) {
			if (args.getFlags('cat', 'categories')) return this.helpCategories(message);
			if (args.getFlags('all')) return this.all(message, context);
		}

		const category = await args.pickResult(HelpCommand.categories);
		if (category.isOk()) return this.display(message, category.unwrap() - 1, context);

		const page = await args.pickResult('integer', { minimum: 0 });
		if (page.isOk()) return this.display(message, page.unwrap() - 1, context);

		// Handle case for a single command
		const command = await args.pick('commandName').catch(() => null);

		if (command) {
			const embed = await this.buildCommandHelp(command, this.getCommandPrefix(context));
			return send(message, { embeds: [embed] });
		}

		return this.display(message, null, context);
	}

	private getCommandPrefix(context: CardinalCommand.MessageContext): string {
		return (context.prefix instanceof RegExp && !context.commandPrefix.endsWith(' ')) || UserOrMemberMentionRegex.test(context.commandPrefix)
			? `${context.commandPrefix} `
			: context.commandPrefix;
	}

	private async helpCategories(message: Message) {
		const commandsByCategory = await HelpCommand.fetchCommands();
		let i = 0;
		const commandCategories: string[] = [];
		for (const [category, commands] of commandsByCategory) {
			const line = String(++i).padStart(2, '0');
			commandCategories.push(`\`${line}.\` **${category}** → ${commands.length} ${commands.length === 1 ? 'command' : 'commands'}`);
		}

		const content = commandCategories.join('\n');
		return send(message, content);
	}

	private async all(message: Message, context: CardinalCommand.MessageContext) {
		const fullContent = await this.buildHelp(this.getCommandPrefix(context));
		const contents = fullContent.length >= 2000 ? fullContent.match(/.{1,2000}\b}/g) : [fullContent];

		for (const content of contents!) {
			const { isOk } = await Result.fromAsync(message.author.send(content));
			if (isOk()) continue;

			if (isPrivateMessage(message))
				this.error({
					context: context,
					name: 'ClosedDM',
					identifier: 'ClosedDM',
					message: "You have DMs disabled so I couldn't send you the list of commands."
				});
			return;
		}

		if (isGuildMessage(message)) await send(message, 'The list of commands you have access to has been sent to your DMs.');
	}

	private async display(message: Message, index: number | null, context: CardinalCommand.MessageContext) {
		const prefix = this.getCommandPrefix(context);

		const content = `Displaying one category per page. Have issues with the embed? Run \`${prefix}help --all\` for a full list in DMs.`;

		const display = await this.buildDisplay(prefix);
		if (index !== null) display.setIndex(index);

		const response = await send(message, content);
		await display.run(response, message.author);
		return response;
	}

	private async buildHelp(prefix: string) {
		const commands = await HelpCommand.fetchCommands();

		const helpMessage: string[] = [];
		for (const [category, list] of commands) {
			helpMessage.push(`**${category} Commands**:\n`, list.map(this.formatCommand.bind(this, prefix, false)).join('\n'), '');
		}

		return helpMessage.join('\n');
	}

	private async buildDisplay(prefix: string) {
		const commandsByCategory = await HelpCommand.fetchCommands();

		const display = new PaginatedMessage({
			template: new EmbedBuilder().setColor(CardinalColors.Default)
		}) //
			.setSelectMenuOptions((pageIndex) => ({
				label: commandsByCategory.at(pageIndex - 1)![0].fullCategory!.join(' – ')
			}));

		for (const [category, commands] of commandsByCategory) {
			display.addPageEmbed((embed) =>
				embed //
					.setTitle(`${category} Commands`)
					.setDescription(commands.map(this.formatCommand.bind(this, prefix, true)).join('\n'))
			);
		}

		return display;
	}

	private async buildCommandHelp(command: CardinalCommand, prefixUsed: string) {
		const builderData = {
			aliases: '🖇️ | **Aliases**',
			usages: '📝 | **Command Usage**',
			extendedHelp: '🔍 | **Extended Help**',
			explainedUsage: '⚙ | **Explained usage**',
			possibleFormats: '🔢 | **Possible formats**',
			examples: '🔗 | **Examples**',
			reminders: '⏰ | **Reminder**',
			cooldown: '⏱️ | **Cooldown**'
		};

		const builder = new LanguageHelp()
			.setUsages(builderData.usages)
			.setAliases(builderData.aliases)
			.setExtendedHelp(builderData.extendedHelp)
			.setExplainedUsage(builderData.explainedUsage)
			.setExamples(builderData.examples)
			.setPossibleFormats(builderData.possibleFormats)
			.setReminder(builderData.reminders)
			.setCooldown(builderData.cooldown);

		const extendedHelpData: LanguageHelpDisplayOptions = {
			...command.detailedDescription,
			cooldown: command.options.cooldownDelay ?? container.client.options.defaultCooldown?.delay
		};

		const extendedHelp = builder.display(command.name, this.formatAliases(command.aliases), extendedHelpData, prefixUsed);

		const user = this.container.client.user!;
		return new EmbedBuilder()
			.setColor(CardinalColors.Default)
			.setAuthor({
				name: getTag(user),
				iconURL: user.displayAvatarURL({ size: 128, extension: 'png' })
			})
			.setTimestamp()
			.setFooter({ text: `Command help for ${command.name}` })
			.setTitle(command.description)
			.setDescription(extendedHelp);
	}

	private formatAliases(aliases: readonly string[]): string | null {
		if (aliases.length === 0) return null;
		return `${aliases.map((alias) => `\`${alias}\``)}`;
	}

	private formatCommand(prefix: string, paginatedMessage: boolean, command: CardinalCommand) {
		const description = command.description;
		return paginatedMessage ? `- \`${prefix}${command.name}\` – ${description}` : `- **${prefix}${command.name}** – ${description}`;
	}

	private static categories = Args.make<number>(async (parameter, { argument }) => {
		const lowerCasedParameter = parameter.toLowerCase();
		const commandsByCategory = await HelpCommand.fetchCommands();
		for (const [page, category] of [...commandsByCategory.keys()].entries()) {
			// Add 1, since 1 will be subtracted later
			if (category.toLowerCase() === lowerCasedParameter) return Args.ok(page + 1);
		}

		return Args.error({ argument, parameter });
	});

	private static async fetchCommands() {
		const commands = container.stores.get('commands');
		const filtered = new Collection<string, CardinalCommand[]>();
		await Promise.all(
			commands.map(async (cmd) => {
				const command = cmd as CardinalCommand;
				if (command.hidden) return;

				const category = filtered.get(command.fullCategory!.join(' – '));
				if (category) category.push(command);
				else filtered.set(command.fullCategory!.join(' – '), [command as CardinalCommand]);
			})
		);

		return filtered.sort(sortCommandsAlphabetically);
	}
}
