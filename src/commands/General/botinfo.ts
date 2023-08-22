import { ApplyOptions } from '@sapphire/decorators';
import { ButtonBuilder, ButtonStyle, version as discordjsVersion } from 'discord.js';
import { CardinalCommand, CardinalEmbedBuilder, Timestamp } from '#lib/structures';
import { Sql } from '@prisma/client/runtime/library.js';
import { Stopwatch } from '@sapphire/stopwatch';
import { send } from '@sapphire/plugin-editable-commands';
import { version as sapphireVersion } from '@sapphire/framework';
import { BotVersion, CardinalColors, CardinalEmojis, ZeroWidthSpace } from '#utils/constants';
import { countlines } from '#utils/utils';
import { uptime, type CpuInfo, cpus } from 'os';
import { roundNumber } from '@sapphire/utilities';
import { ActionRowBuilder } from 'discord.js';

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
		return send(message, { embeds: [await this.statsEmbed()], components: [this.supportButton] });
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: CardinalCommand.ChatInputCommandInteraction) {
		return interaction.reply({ embeds: [await this.statsEmbed()], components: [this.supportButton] });
	}

	public async statsEmbed() {
		const commandsRan = (await this.container.db.command.count()).toLocaleString();
		const titles = {
			latency: 'Latency',
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
			latency: ` Bot Ping: \`${latency.botPing}\`\n Bot Latency: \`${latency.botLatency}\`\n DB latency: \`${latency.db}\``,
			stats: ` Users: \`${stats.users}\`\n Servers: \`${stats.guilds}\`\n Channels: \`${stats.channels}\`\n Commands Issued \`${commandsRan}\`\n Bot: \`${stats.botVersion}\``,
			uptime: ` VPS: ${uptime.host}\n Client: ${uptime.client}`,
			serverUsage: ` Heap: \`${usage.ramUsed}MB\` (Total: \`${usage.ramTotal}MB\`)\n CPU Load: ${usage.cpuLoad}`,
			misc: ` Lines of code: \`${misc.lines}\`\n Files: \`${misc.files}\``
		};

		return new CardinalEmbedBuilder().setColor(CardinalColors.Default).setFields(
			{
				name: titles.latency,
				value: fields.latency,
				inline: true
			},
			{
				name: titles.stats,
				value: fields.stats,
				inline: true
			},
			{
				name: titles.misc,
				value: fields.misc,
				inline: true
			},
			{
				name: ZeroWidthSpace,
				value: ZeroWidthSpace
			},
			{
				name: titles.uptime,
				value: fields.uptime,
				inline: true
			},
			{
				name: titles.serverUsage,
				value: fields.serverUsage,
				inline: true
			}
		);
	}

	private get supportButton() {
		return new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setURL('https://discord.gg/54ZR2b8AYV')
				.setStyle(ButtonStyle.Link)
				.setLabel('Support Server')
				.setEmoji(CardinalEmojis.Cardinal)
		);
	}

	private get generalStatistics(): StatsGeneral {
		const { client } = this.container;
		return {
			channels: client.channels.cache.size.toLocaleString(),
			guilds: client.guilds.cache.size.toLocaleString(),
			nodeJs: process.version,
			users: client.guilds.cache.reduce((acc, val) => acc + (val.memberCount ?? 0), 0).toLocaleString(),
			version: `v${discordjsVersion}`,
			sapphireVersion: `v${sapphireVersion}`,
			botVersion: `v${BotVersion}`
		};
	}

	private get uptimeStatistics(): StatsUptime {
		const now = Date.now();
		return {
			client: new Timestamp(now - this.container.client.uptime!).getRelativeTime(),
			host: new Timestamp(now - uptime() * 1000).getRelativeTime()
		};
	}

	private async latencyStatistics() {
		const stopwatch = new Stopwatch(0);
		await this.container.db.$queryRaw(new Sql(['SELECT 1'], []));
		const dbLatency = stopwatch.stop().toString();

		const botPing = this.container.client.ws.ping + 'ms';
		const stopwatch2 = new Stopwatch(0);
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
			cpuLoad: `\`${cpus().map(botinfoCommand.formatCpuInfo.bind(null)).join('` `')}\``,
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

	private static formatCpuInfo({ times }: CpuInfo) {
		return `${roundNumber(((times.user + times.nice + times.sys + times.irq) / times.idle) * 10000) / 100}%`;
	}

	// private formatBytes(bytes: number) {
	// 	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	// 	if (bytes === 0) return '0 Byte';
	// 	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	// 	return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
	// }
}

interface StatsGeneral {
	channels: string;
	guilds: string;
	nodeJs: string;
	users: string;
	version: string;
	sapphireVersion: string;
	botVersion: string;
}

interface StatsUptime {
	client: string;
	host: string;
}

interface StatsUsage {
	cpuLoad: string;
	ramTotal: string;
	ramUsed: string;
}

interface StatsMisc {
	lines: string;
	files: string;
}
