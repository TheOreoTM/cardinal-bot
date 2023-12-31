import { type FlattenedGuild, flattenGuild } from '#lib/api/ApiTransformers';
import { authenticated } from '#lib/api/util';
import { ApplyOptions } from '@sapphire/decorators';
import { ApiRequest, ApiResponse, HttpCodes, methods, Route, type RouteOptions } from '@sapphire/plugin-api';

@ApplyOptions<RouteOptions>({ route: 'users/@me' })
export class UserRoute extends Route {
	@authenticated()
	// @ratelimit(seconds(5), 2, true)
	public async [methods.GET](request: ApiRequest, response: ApiResponse) {
		const { client } = this.container;
		const user = await client.users.fetch(request.auth!.id).catch(() => null);
		if (user === null) return response.error(HttpCodes.InternalServerError);

		const guilds: FlattenedGuild[] = [];
		for (const guild of client.guilds.cache.values()) {
			if (guild.members.cache.has(user.id)) guilds.push(flattenGuild(guild));
		}
		return response.json({ user: user, guilds });
	}
}
