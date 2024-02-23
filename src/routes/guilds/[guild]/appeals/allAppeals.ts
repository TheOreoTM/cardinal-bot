import { authenticated } from '#lib/api/util';
import { ApplyOptions } from '@sapphire/decorators';
import { methods, Route, type ApiRequest, type ApiResponse } from '@sapphire/plugin-api';

@ApplyOptions<Route.Options>({
	route: 'guilds/:guild/appeals'
})
export class UserRoute extends Route {
	@authenticated()
	public async [methods.GET](request: ApiRequest, response: ApiResponse) {
		const guildId = request.params.guild;

		const appeals = await this.container.db.appeal.findMany({
			where: {
				guildId
			}
		});

		return response.json([...appeals]);
	}
}
