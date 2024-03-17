import { authenticated } from '#lib/api/util';
import { ApplyOptions } from '@sapphire/decorators';
import { isTextChannel } from '@sapphire/discord.js-utilities';
import { methods, Route, type ApiRequest, type ApiResponse, HttpCodes } from '@sapphire/plugin-api';
import { s } from '@sapphire/shapeshift';

@ApplyOptions<Route.Options>({
	name: 'guildSettings',
	route: 'guilds/:guild/settings'
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

		const data = await this.container.db.guild.findUnique({
			where: {
				guildId
			}
		});

		if (data) {
			response.json({ ...data, setup: true });
		} else {
			return response.json({ setup: false });
		}
	}

	@authenticated()
	public async [methods.POST](_request: ApiRequest, response: ApiResponse) {
		const body = _request.body;
		const guildId = _request.params.guild;

		const guild = this.container.client.guilds.cache.get(guildId);
		if (!guild) {
			return response.error(HttpCodes.BadRequest);
		}

		const result = this.parseIncomingData(body);
		if (result.error) {
			return response.error(HttpCodes.BadRequest);
		}

		const data = result.unwrap();

		try {
			if (data.setting.startsWith('starboard')) {
				const dataToAdd: Record<string, any> = {};
				if (data.setting === 'starboardChannel') {
					if (typeof data.value !== 'string') {
						return response.error(HttpCodes.BadRequest);
					}
					const channel = guild.channels.cache.get(data.value);
					if (!channel || isTextChannel(channel) === false) {
						return response.error(HttpCodes.BadRequest);
					}

					dataToAdd['starboardChannel'] = data.value;

					const existingWebhooks = await channel.fetchWebhooks();
					if (existingWebhooks.size > 0) {
						const webhook = existingWebhooks.first();
						if (webhook?.name === 'Starboard') {
							dataToAdd['starboardWebhookId'] = webhook.id;
							dataToAdd['starboardWebhookToken'] = webhook.token;
						}
					} else {
						try {
							const webhook = await channel.createWebhook({ name: 'Starboard' });
							dataToAdd['starboardWebhookId'] = webhook.id;
							dataToAdd['starboardWebhookToken'] = webhook.token;
						} catch {
							return response.error(HttpCodes.BadRequest, { error: 'Failed to create webhook' });
						}
					}
				}
				dataToAdd[data.setting] = data.value;

				await this.container.db.guild.upsert({
					where: {
						guildId: guild.id
					},
					create: {
						guildId: guild.id
					},
					update: {
						...dataToAdd
					}
				});

				return;
			}

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
		} catch (error) {
			return response.error(HttpCodes.BadRequest);
		}

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
