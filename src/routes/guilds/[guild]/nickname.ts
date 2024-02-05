import { authenticated } from '#lib/api/util';
import { ApplyOptions } from '@sapphire/decorators';
import { methods, Route, type ApiRequest, type ApiResponse, HttpCodes } from '@sapphire/plugin-api';
import { s } from '@sapphire/shapeshift';

@ApplyOptions<Route.Options>({
	name: 'guildNickname',
	route: 'guilds/:guild/nickname'
})
export class UserRoute extends Route {
	// @ratelimit(seconds(5), 2, true)
	@authenticated()
	public async [methods.GET](request: ApiRequest, response: ApiResponse) {
		const guildId = request.params.guild;

		const guild = this.container.client.guilds.cache.get(guildId);

		if (!guild) {
			return response.error(HttpCodes.BadRequest);
		}

		const nickname = guild.members.me?.nickname;

		response.json({ nickname: nickname ?? null });
	}

	@authenticated()
	public async [methods.POST](_request: ApiRequest, response: ApiResponse) {
		const body = _request.body;
		const guildId = _request.params.guild;

		const result = this.parseIncomingData(body);

		if (result.error) {
			return response.error(HttpCodes.BadRequest, result.error);
		}

		const nickname = result.unwrap().nickname;

		const guild = this.container.client.guilds.cache.get(guildId);

		if (!guild) {
			return response.error(HttpCodes.BadRequest);
		}

		const member = guild.members.me;
		if (!member) {
			return response.error(HttpCodes.BadRequest);
		}

		try {
			await member.setNickname(nickname);
		} catch (error: any) {
			return response.error(HttpCodes.BadRequest, error.message);
		}
	}

	private parseIncomingData(data: any) {
		const validator = s.object({
			nickname: s.union(s.string.lengthLessThanOrEqual(32).lengthGreaterThan(0), s.null)
		});

		const result = validator.run(data);
		return result;
	}
}
