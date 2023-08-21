import { ApplyOptions } from '@sapphire/decorators';
import { version as discordjsVersion } from 'discord.js';
import { CardinalCommand, CardinalEmbedBuilder, Timestamp } from '#lib/structures';
import { Sql } from '@prisma/client/runtime/library.js';
import { Stopwatch } from '@sapphire/stopwatch';
import { send } from '@sapphire/plugin-editable-commands';
import { version as sapphireVersion } from '@sapphire/framework';
import { CardinalColors } from '#utils/constants';
import { countlines } from '#utils/utils';
import { roundNumber } from '@sapphire/utilities';
import { uptime } from 'os';

@ApplyOptions<CardinalCommand.Options>({
	description: 'View basic information about the bot',
	name: 'botinfo',
	detailedDescription: {
		extendedHelp:
			'Show information about the bot such as Bot Latency, Api Ping, Bot, Ping and Database Latency. Moreover, see how many commands have been ran and how many users the bot serves.',
		usages: [''],
		examples: ['']
	}
})
export class botinfoCommand extends CardinalCommand {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: CardinalCommand.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});
	}

	// Message command
	public async messageRun(message: CardinalCommand.Message) {
		return send(message, { embeds: [await this.statsEmbed()] });
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: CardinalCommand.ChatInputCommandInteraction) {
		return interaction.reply({ embeds: [await this.statsEmbed()] });
	}

	public async statsEmbed() {
		const titles = {
			stats: 'Statistics',
			uptime: 'Uptime',
			serverUsage: 'Server Usage',
			misc: 'Misc'
		};
		const stats = this.generalStatistics;
		const uptime = this.uptimeStatistics;
		const usage = this.usageStatistics;
		const misc = this.miscStatistics;
		const latency = await this.latencyStatistics();

		const fields = {
			latency: ` Bot Ping: \`${latency.botPing}\`\n Bot Latency: \`${latency.botLatency}\`\n Database latency: \`${latency.db}\``,
			stats: ` Users: ${stats.users}\n Servers: ${stats.guilds}\n Channels: ${stats.channels}\n Discord.js: ${stats.version}\n Node.js: ${stats.nodeJs}\n Framework: ${stats.sapphireVersion}`,
			uptime: ` Host: ${uptime.host}\n Total: ${uptime.total}\n Client: ${uptime.client}`,
			serverUsage: ` Heap: ${usage.ramUsed}MB (Total: ${usage.ramTotal}MB)`,
			misc: ` Lines of code: ${misc.lines}\n Files: ${misc.files}`
		};

		return new CardinalEmbedBuilder().setColor(CardinalColors.Default).setFields(
			{
				name: titles.stats,
				value: fields.stats
			},
			{
				name: titles.uptime,
				value: fields.uptime
			},
			{
				name: titles.serverUsage,
				value: fields.serverUsage
			},
			{
				name: titles.misc,
				value: fields.misc
			}
		);
	}

	private get generalStatistics(): StatsGeneral {
		const { client } = this.container;
		return {
			channels: client.channels.cache.size,
			guilds: client.guilds.cache.size,
			nodeJs: process.version,
			users: client.guilds.cache.reduce((acc, val) => acc + (val.memberCount ?? 0), 0),
			version: `v${discordjsVersion}`,
			sapphireVersion: `v${sapphireVersion}`
		};
	}

	private get uptimeStatistics(): StatsUptime {
		const now = Date.now();
		return {
			client: new Timestamp(now - this.container.client.uptime!).getRelativeTime(),
			host: new Timestamp(now - uptime() * 1000).getRelativeTime(),
			total: new Timestamp(roundNumber(now - process.uptime() * 1000)).getRelativeTime()
		};
	}

	private async latencyStatistics() {
		const stopwatch = new Stopwatch();
		await this.container.db.$queryRaw(new Sql(['SELECT 1'], []));
		const dbLatency = stopwatch.stop().toString();

		const botPing = this.container.client.ws.ping + 'ms';
		const stopwatch2 = new Stopwatch();
		const botLatency = stopwatch2.stop().toString();

		return {
			db: dbLatency,
			botPing,
			botLatency
		};
	}

	private get usageStatistics(): StatsUsage {
		const usage = process.memoryUsage();
		return {
			ramTotal: `${(usage.heapTotal / 1048576).toFixed(2)}`,
			ramUsed: `${(usage.heapUsed / 1048576).toFixed(2)}`
		};
	}

	private get miscStatistics(): StatsMisc {
		const { linesOfCode, numOfFiles } = countlines('src');
		return {
			lines: `${linesOfCode}`,
			files: `${numOfFiles}`
		};
	}
}

interface StatsGeneral {
	channels: number;
	guilds: number;
	nodeJs: string;
	users: number;
	version: string;
	sapphireVersion: string;
}

interface StatsUptime {
	client: string;
	host: string;
	total: string;
}

interface StatsUsage {
	ramTotal: string;
	ramUsed: string;
}

interface StatsMisc {
	lines: string;
	files: string;
}
