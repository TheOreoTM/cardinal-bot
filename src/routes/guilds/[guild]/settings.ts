import { authenticated } from '#lib/api/util';
import { ApplyOptions } from '@sapphire/decorators';
import { methods, Route, type ApiRequest, type ApiResponse, HttpCodes } from '@sapphire/plugin-api';
import { s } from '@sapphire/shapeshift';

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

	public async [methods.POST](_request: ApiRequest, response: ApiResponse) {
		const body = _request.body;
		const guildId = _request.params.guild;

		const result = this.parseIncomingData(body);
		if (result.error) {
			return response.error(HttpCodes.BadRequest);
		}

		const data = result.unwrap();

		await this.container.db.guild.upsert({
			where: {
				guildId
			},
			create: {
				guildId
			},
			update: {
				[data.setting]: data.value
			}
		});

		return response.status(HttpCodes.OK).json({ ...data });
	}

	private parseIncomingData(data: any) {
		const validator = s.object({
			module: s.string,
			setting: s.string,
			value: s.union(s.string, s.number, s.boolean, s.array(s.any))
		});

		const result = validator.run(data);
		return result;
	}
}
