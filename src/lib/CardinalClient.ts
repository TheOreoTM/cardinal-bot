import { PrismaClient } from '@prisma/client';
import { Enumerable } from '@sapphire/decorators';
import { SapphireClient, container, type SapphirePrefix, type SapphirePrefixHook } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { ClientConfig } from '#config';
import { LongLivingReactionCollector } from '#utils/LongLivingReactionCollector';
import { BotPrefix } from '#constants';
import { RedisClient } from '#lib/database';
import { envParseNumber, envParseString } from '@skyra/env-utilities';

export class CardinalClient<Ready extends boolean = boolean> extends SapphireClient<Ready> {
	@Enumerable(false)
	public override llrCollectors = new Set<LongLivingReactionCollector>();

	public constructor() {
		super(ClientConfig);
	}

	public override async login(token?: string): Promise<string> {
		container.db = new PrismaClient();
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
