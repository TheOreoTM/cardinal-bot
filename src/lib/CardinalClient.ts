import { Prisma, PrismaClient } from '@prisma/client';
import { Enumerable } from '@sapphire/decorators';
import { SapphireClient, container, type SapphirePrefix, type SapphirePrefixHook } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { ClientConfig } from '#config';
import { LongLivingReactionCollector } from '#utils/LongLivingReactionCollector';
import { BotPrefix } from '#constants';
import Redis from 'ioredis';
import { createPrismaRedisCache } from 'prisma-redis-middleware';

const redis = new Redis();
const prisma = new PrismaClient();
const cacheMiddleware: Prisma.Middleware = createPrismaRedisCache({
	models: [{ model: 'Message', cacheTime: 300 }],
	storage: { type: 'redis', options: { client: redis, invalidation: { referencesTTL: 300 }, log: console } },
	cacheTime: 300,
	onHit: (key) => {
		console.log('hit', key);
	},
	onMiss: (key) => {
		console.log('miss', key);
	},
	onError: (key) => {
		console.log('error', key);
	}
});

prisma.$use(cacheMiddleware);

export class CardinalClient<Ready extends boolean = boolean> extends SapphireClient<Ready> {
	@Enumerable(false)
	public override llrCollectors = new Set<LongLivingReactionCollector>();

	public constructor() {
		super(ClientConfig);
	}

	public override async login(token?: string): Promise<string> {
		container.db = prisma;
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
