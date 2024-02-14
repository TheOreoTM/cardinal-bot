import { BotVersion } from '#utils/constants';
import { ApplyOptions } from '@sapphire/decorators';
import { methods, Route, type ApiRequest, type ApiResponse } from '@sapphire/plugin-api';

@ApplyOptions<Route.Options>({
	route: 'stats'
})
export class UserRoute extends Route {
	public async [methods.GET](_request: ApiRequest, response: ApiResponse) {
		const guilds = this.container.client.guilds.cache.size;
		const members = this.container.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
		const channels = this.container.client.channels.cache.size;
		const commands = await this.container.db.command.count();

		return response.json({ guildAmount: guilds, memberAmount: members, channelAmount: channels, commandsUsed: commands, version: BotVersion });
	}
}
