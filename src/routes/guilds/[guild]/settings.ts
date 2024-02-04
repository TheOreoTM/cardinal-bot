import { authenticated } from '#lib/api/util';
import { ApplyOptions } from '@sapphire/decorators';
import { methods, Route, type ApiRequest, type ApiResponse, HttpCodes } from '@sapphire/plugin-api';

@ApplyOptions<Route.Options>({
	name: 'guildSettings',
	route: 'guilds/:guild/settings'
})
export class UserRoute extends Route {
	@authenticated()
	// @ratelimit(seconds(5), 2, true)
	public async [methods.GET](request: ApiRequest, response: ApiResponse) {
		const guildId = request.params.guild;

		const guild = this.container.client.guilds.cache.get(guildId);
		if (!guild) {
			return response.error(HttpCodes.BadRequest);
		}

		const data = await this.container.db.guild.findUnique({
			where: {
				guildId
			}
		});

		response.json(data);
	}

	public [methods.POST](_request: ApiRequest, response: ApiResponse) {
		const body = _request.body as { module: string; value: any; settings: string };
		const guildId = _request.params.guild;

		return response.json({ body, guildId });
	}
}
