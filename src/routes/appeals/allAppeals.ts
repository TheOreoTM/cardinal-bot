import { authenticated } from '#lib/api/util';
import { ApplyOptions } from '@sapphire/decorators';
import { methods, Route, type ApiRequest, type ApiResponse } from '@sapphire/plugin-api';
import { s } from '@sapphire/shapeshift';

@ApplyOptions<Route.Options>({
	route: 'appeals'
})
export class UserRoute extends Route {
	@authenticated()
	public async [methods.GET](request: ApiRequest, response: ApiResponse) {
		const userIdQuery = request.query.userId;
		const guildIdQuery = request.query.guildId;

		const userIdResult = this.parseUserId(userIdQuery);
		const guildIdResult = this.parseGuildId(guildIdQuery);

		if (userIdResult.error || guildIdResult.error) {
			return response.badRequest();
		}

		const { userId, guildId } = { userId: userIdResult.unwrap(), guildId: guildIdResult.unwrap() };

		const appeals = await this.container.db.appeal.findMany({
			where: {
				guildId,
				userId
			}
		});

		return response.json([...appeals]);
	}

	private parseUserId(snowflake: any) {
		const validator = s.string.lengthGreaterThan(0);

		return validator.run(snowflake);
	}

	private parseGuildId(snowflake: any) {
		const validator = s.string.lengthGreaterThan(0).optional;

		return validator.run(snowflake);
	}
}
