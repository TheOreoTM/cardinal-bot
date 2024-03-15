import { Enumerable } from '@sapphire/decorators';
import { SapphireClient, container, type SapphirePrefix, type SapphirePrefixHook } from '@sapphire/framework';
import { WebhookClient, type Message } from 'discord.js';
import { ClientConfig, WEBHOOK_ERROR } from '#config';
import { LongLivingReactionCollector } from '#utils/LongLivingReactionCollector';
import { BotPrefix } from '#constants';
import { RedisClient, xprisma } from '#lib/database';
import { envParseNumber, envParseString } from '@skyra/env-utilities';
import { Analytics } from '#lib/structures';

export class CardinalClient<Ready extends boolean = boolean> extends SapphireClient<Ready> {
	@Enumerable(false)
	public override llrCollectors = new Set<LongLivingReactionCollector>();

	@Enumerable(false)
	public override readonly analytics: Analytics;

	/**
	 * The webhook to use for the error event
	 */
	@Enumerable(false)
	public override webhookError: WebhookClient | null = WEBHOOK_ERROR ? new WebhookClient(WEBHOOK_ERROR) : null;

	public constructor() {
		super(ClientConfig);

		this.analytics = new Analytics(this);
	}

	public override async login(token?: string): Promise<string> {
		container.db = xprisma;
		container.cache = new RedisClient({
			db: 1,
			host: envParseString('REDIS_HOST'),
			password: envParseString('REDIS_PASSWORD'),
			port: envParseNumber('REDIS_PORT')
		});
		return super.login(token);
	}
	public override destroy() {
		return super.destroy();
	}
	public override fetchPrefix: SapphirePrefixHook = async (message: Message): Promise<SapphirePrefix> => {
		if (!message.guild) return BotPrefix;
		const data = await container.db.guild.findUnique({
			where: {
				guildId: message.guild.id
			}
		});
		if (!data) return BotPrefix;
		return data.prefix;
	};
}
