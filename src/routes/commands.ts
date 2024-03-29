import { authenticated } from '#lib/api/util';
import type { CardinalCommand } from '#lib/structures';
import { BotPrefix } from '#utils/constants';
import { ApplyOptions } from '@sapphire/decorators';
import type { Command } from '@sapphire/framework';
import { Route, methods, type ApiRequest, type ApiResponse } from '@sapphire/plugin-api';

@ApplyOptions<Route.Options>({ route: 'commands' })
export class UserRoute extends Route {
	@authenticated()
	public [methods.GET](request: ApiRequest, response: ApiResponse) {
		const { category } = request.query;

		const commands = this.container.stores.get('commands');
		const filtered = (category ? commands.filter((cmd) => cmd.category === category) : commands).filter((cmd) => {
			const c = cmd as CardinalCommand;

			return c.permissionLevel < 9 && !c.hidden && c.category !== 'Private';
		});

		return response.json(filtered.map((cmd) => UserRoute.process(cmd)));
	}

	private static process(cmd: Command) {
		const command = cmd as CardinalCommand;
		return {
			category: command.category,
			description: command.description,
			detailedDescription: { ...command.detailedDescription, prefix: BotPrefix },
			guarded: command.guarded,
			name: command.name,
			permissionLevel: command.permissionLevel,
			preconditions: command.preconditions
		};
	}
}
