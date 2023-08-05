import { ApplyOptions } from '@sapphire/decorators';
import { Message } from 'discord.js';
import { CardinalCommand, CardinalEmbedBuilder } from '#lib/structures';
import type { InteractionOrMessage } from '#lib/types';
import { Sql } from '@prisma/client/runtime/library.js';
import { Stopwatch } from '@sapphire/stopwatch';
import { send } from '@sapphire/plugin-editable-commands';

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
		return this.sendBotinfo(message);
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: CardinalCommand.ChatInputCommandInteraction) {
		return this.sendBotinfo(interaction);
	}

	private async sendBotinfo(interactionOrMessage: InteractionOrMessage) {
		const stopclock = new Stopwatch();
		const botLatency = stopclock.stop().toString();

		const initialEmbed = new CardinalEmbedBuilder().setStyle('loading').setDescription('Fetching info...');
		const initialMessage =
			interactionOrMessage instanceof Message
				? await send(interactionOrMessage, { embeds: [initialEmbed] })
				: await interactionOrMessage.reply({ embeds: [initialEmbed] });

		const apiLatency = `${initialMessage.createdTimestamp - interactionOrMessage.createdTimestamp}ms`;
		const ping = `${Math.round(this.container.client.ws.ping)}ms`;

		const stopwatch = new Stopwatch();
		await this.container.db.$queryRaw(new Sql(['SELECT 1'], []));
		const dbLatency = stopwatch.stop().toString();
		const commands = await this.container.db.command.count();
		const users = this.container.client.guilds.cache.reduce((acc, val) => acc + (val.memberCount ?? 0), 0);

		const embed = new CardinalEmbedBuilder().setStyle('default').setFields([
			{
				name: 'Latency',
				value: [
					`Bot Ping: \`${ping}\``,
					`Bot Latency: \`${botLatency}\``,
					`API Latency: \`${apiLatency}\``,
					`Database Latency: \`${dbLatency}\``
				].join('\n')
			},
			{
				name: 'Bot Info',
				value: [`Commands Issued: \`${commands.toLocaleString()}\``, `Users: \`${users.toLocaleString()}\``].join('\n')
			}
		]);

		if (interactionOrMessage instanceof Message) {
			return send(interactionOrMessage, { embeds: [embed] });
		}

		return interactionOrMessage.editReply({ embeds: [embed] });
	}
}
