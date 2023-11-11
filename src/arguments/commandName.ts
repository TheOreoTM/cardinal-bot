import { BotOwner } from '#constants';
import { FuzzySearch, CardinalCommand } from '#lib/structures';
import { PermissionLevels } from '#lib/types';
import { Argument, type ArgumentContext } from '@sapphire/framework';

export class UserArgument extends Argument<CardinalCommand> {
	public async run(parameter: string, context: CommandArgumentContext) {
		const commands = this.container.stores.get('commands');
		const found = commands.get(parameter.toLowerCase()) as CardinalCommand | undefined;
		if (found) {
			console.log('found');
			return this.isAllowed(found, context)
				? this.ok(found)
				: this.error({
						parameter,
						identifier: 'InvalidCommand',
						message: `No command resolved for the search \`${parameter}\``,
						context
				  });
		}

		const searchResult = new FuzzySearch(
			commands.map((command) => {
				return command.name;
			})
		).search(parameter);

		if (!searchResult || searchResult.length === 0)
			return this.error({
				parameter,
				identifier: 'InvalidCommand',
				message: `No command resolved for the search \`${parameter}\``,
				context
			});

		const command = commands.find((cmd) => cmd.name === searchResult[0].target) as CardinalCommand | undefined;

		if (command) {
			console.log('fuzzied');
			return this.ok(command);
		}

		return this.error({
			parameter,
			identifier: 'InvalidCommand',
			message: `No command resolved for the search \`${parameter}\``,
			context
		});
	}

	private isAllowed(command: CardinalCommand, context: CommandArgumentContext): boolean {
		if (command.permissionLevel !== PermissionLevels.BotOwner) return true;
		return context.owners ?? BotOwner.includes(context.message.author.id);
	}
}

interface CommandArgumentContext extends ArgumentContext<CardinalCommand> {
	filter?: (entry: CardinalCommand) => boolean;
	owners?: boolean;
}
