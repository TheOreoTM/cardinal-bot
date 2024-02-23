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

		const userIdResult = this.parseSnowflake(userIdQuery);
		const guildIdResult = this.parseSnowflake(guildIdQuery);

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

	private parseSnowflake(snowflake: any) {
		const validator = s.string.lengthGreaterThan(0);

		return validator.run(snowflake);
	}
}
