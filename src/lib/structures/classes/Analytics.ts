import type { CardinalClient } from '#lib/CardinalClient';
import { container } from '@sapphire/pieces';
import { Gauge, collectDefaultMetrics, register } from 'prom-client';

export class Analytics {
	// readonly guildCreate = new Gauge({
	// 	name: 'guild_create',
	// 	help: 'the number of guilds joined',
	// 	async collect() {
	// 		this.set(container.client.guilds.cache.size);
	// 	}
	// });

	// readonly guildDelete = new Gauge({
	// 	name: 'guild_delete',
	// 	help: 'the number of guilds left'
	// });

	readonly guildCount = new Gauge({
		name: 'cardinal_guild_count',
		help: 'the number of servers the bot is in',
		async collect() {
			this.set(container.client.guilds.cache.size);
		}
	});

	readonly commandUsed = new Gauge({
		name: 'cardinal_commands_used',
		help: 'The total number of commands used',
		async collect() {
			this.set(await container.db.command.count());
		}
	});

	readonly gatewayPing = new Gauge({
		name: 'cardinal_ws_ping',
		help: "Ping to discord's gateway",
		collect() {
			this.set(container.client.ws.ping);
		}
	});

	readonly gatewayEvents = new Gauge({
		name: 'cardinal_gateway_events_count',
		help: 'Events received over the Discord gateway'
	});

	readonly messageCount = new Gauge({
		name: 'cardinal_message_count',
		help: 'The number of messages received since reboot'
	});

	readonly trackedMessageCount = new Gauge({
		name: 'cardinal_tracked_message_count',
		help: 'The number of messages tracked for stats'
	});

	readonly userCount = new Gauge({
		name: 'cardinal_cached_user_count',
		help: 'The total number of users the bot has cached.',
		async collect() {
			this.set(container.client.users.cache.size);
		}
	});

	readonly memberCount = new Gauge({
		name: 'cardinal_member_count',
		help: 'The total members in all guilds the bot is in.',
		async collect() {
			this.set(container.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0));
		}
	});

	readonly channelCount = new Gauge({
		name: 'cardinal_channel_count',
		help: 'The total number of channels the bot can see.',
		async collect() {
			this.set(container.client.channels.cache.size);
		}
	});

	constructor(private client: CardinalClient) {
		register.setDefaultLabels({ app: 'cardinal' });
		collectDefaultMetrics({ register, prefix: 'cardinal_' });
	}

	addGatewayEvent() {
		this.gatewayEvents.inc();
	}

	addMessage() {
		this.messageCount.inc();
	}

	updateTrackedMessageCount(amount: number) {
		this.trackedMessageCount.set(amount);
	}

	updateUserCount(amount = this.client.users.cache.size) {
		this.userCount.set(amount);
	}
}
