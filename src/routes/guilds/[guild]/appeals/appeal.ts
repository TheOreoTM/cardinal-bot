import { authenticated } from '#lib/api/util';
import { ApplyOptions } from '@sapphire/decorators';
import { methods, Route, type ApiRequest, type ApiResponse, HttpCodes } from '@sapphire/plugin-api';
import { s } from '@sapphire/shapeshift';

@ApplyOptions<Route.Options>({
	name: 'appeal',
	route: 'guilds/:guild/appeals/:appeal'
})
export class UserRoute extends Route {
	@authenticated()
	public async [methods.GET](request: ApiRequest, response: ApiResponse) {
		const guildId = request.params.guild;
		const appealId = request.params.appeal;

		const appeal = await this.container.db.appeal.findUnique({
			where: {
				guildId: guildId,
				id: appealId
			}
		});

		if (!appeal) {
			return response.error(HttpCodes.NotFound);
		}

		return response.json(appeal);
	}

	@authenticated()
	public async [methods.PATCH](request: ApiRequest, response: ApiResponse) {
		const guildId = request.params.guild;
		const appealId = request.params.appeal;

		const body = request.body;

		const result = this.parseIncomingData(body);
		if (result.error) {
			return response.error(HttpCodes.BadRequest);
		}

		const data = result.unwrap();

		try {
			const appeal = await this.container.db.appeal.update({
				where: {
					id: appealId,
					guildId: guildId
				},
				data: {
					...data
				}
			});

			return response.status(200).json(appeal);
		} catch (error) {
			response.error(HttpCodes.BadRequest);
		}
	}

	private parseIncomingData(data: any) {
		const validator = s.object({
			guildId: s.string,
			userId: s.string,
			muteOrBan: s.string,
			reason: s.string,
			appeal: s.string,
			extra: s.string,
			staffId: s.union(s.string, s.null),
			staffUsername: s.union(s.string, s.null),
			status: s.string,
			updatedAt: s.date,
			createdAt: s.date
		});

		const result = validator.run(data);
		return result;
	}
}
