import type { CardinalClient } from '#lib/CardinalClient';
import { Counter, Gauge, Histogram, collectDefaultMetrics, register } from 'prom-client';

export class Analytics {
	readonly guildCreate = new Gauge({
		name: 'guild_create',
		help: 'the number of guilds joined'
	});

	readonly guildDelete = new Gauge({
		name: 'guild_delete',
		help: 'the number of guilds left'
	});

	readonly guildCount = new Gauge({
		name: 'guild_count',
		help: 'the number of servers the bot is in'
	});

	readonly commandUsed = new Gauge({
		name: 'commands_used',
		help: 'the number of commands used',
		labelNames: ['command', 'success']
	});

	readonly gatewayPing = new Gauge({
		name: 'gateway_ping',
		help: "ms ping to discord's gateway"
	});

	readonly historicPing = new Histogram({
		name: 'historic_ping',
		help: 'historic ping to discord gateway',
		buckets: [0.1, 0.5, 1, 2, 5, 10, 15, 20, 30, 60, 120, 300]
	});

	readonly gatewayEvents = new Gauge({
		name: 'gateway_events',
		help: 'events received over the Discord gateway'
	});

	readonly messageCount = new Gauge({
		name: 'message_count',
		help: 'the number of messages sent since reboot'
	});

	readonly messageCreate = new Counter({
		name: 'message_create',
		help: 'messages created per second'
	});

	readonly trackedMessageCount = new Gauge({
		name: 'tracked_message_count',
		help: 'the number of messages tracked'
	});

	readonly userCount = new Gauge({
		name: 'user_count',
		help: 'the number of users the bot can see'
	});

	readonly channelCount = new Gauge({
		name: 'channel_count',
		help: 'the number of channels the bot can see'
	});

	constructor(private client: CardinalClient) {
		register.setDefaultLabels({ app: 'cardinal' });
		collectDefaultMetrics({ register, prefix: 'cardinal_' });
	}

	addCommandUsage(command: string, success: boolean) {
		this.commandUsed.labels(command, String(success)).inc();
	}

	updateGuildCount() {
		this.guildCount.set(this.client.guilds.cache.size);
	}

	updateChannelCount() {
		this.channelCount.set(this.client.channels.cache.size);
	}

	updateGatewayPing() {
		this.gatewayPing.set(this.client.ws.ping);
		this.historicPing.observe(this.client.ws.ping);
	}

	addGatewayEvent() {
		this.gatewayEvents.inc();
	}

	addMessage() {
		this.messageCount.inc();
		this.messageCreate.inc();
	}

	addGuild() {
		this.guildCreate.inc();
		this.updateGuildCount();
	}

	removeGuild() {
		this.guildDelete.inc();
		this.updateGuildCount();
	}

	updateTrackedMessageCount(amount: number) {
		this.trackedMessageCount.set(amount);
	}

	updateUserCount(amount = this.client.users.cache.size) {
		this.userCount.set(amount);
	}
}
