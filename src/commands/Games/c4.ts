import { ConnectFourGame } from '#lib/games/connect-four/ConnectFourGame';
import { ConnectFourHumanController } from '#lib/games/connect-four/ConnectFourHumanController';
import { CardinalCommand } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { promptConfirmation } from '#utils/functions';
import { ApplyOptions } from '@sapphire/decorators';
import { CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { PermissionFlagsBits } from 'discord-api-types/v9';
import type { User } from 'discord.js';

@ApplyOptions<CardinalCommand.Options>({
	aliases: ['connect-four'],
	description: 'Play Connect-Four with somebody.',
	detailedDescription: {
		usages: ['User'],
		extendedHelp:
			'This game is best played on PC.\nConnect Four is a two-player connection game in which the players first choose a color and then take turns dropping colored discs from the top into a seven-column, six-row vertically suspended grid.',
		examples: ['Cardinal']
	},
	flags: ['easy', 'medium', 'hard'],
	requiredClientPermissions: [PermissionFlagsBits.UseExternalEmojis, PermissionFlagsBits.AddReactions, PermissionFlagsBits.ReadMessageHistory],
	runIn: [CommandOptionsRunTypeEnum.GuildAny]
})
export class UserCommand extends CardinalCommand {
	private readonly channels = new Set<string>();

	public async messageRun(message: GuildMessage, args: CardinalCommand.Args) {
		if (this.channels.has(message.channel.id)) this.error(`There is currently an ongoing game in this channel, try again later.`);

		const user = await args.pick('userName');
		const player1 = this.getAuthorController(message);
		const player2 = await this.getTargetController(message, user);

		this.channels.add(message.channel.id);
		const game = new ConnectFourGame(message, player1, player2);

		try {
			await game.run();
		} finally {
			this.channels.delete(message.channel.id);
		}
	}

	private getAuthorController(message: GuildMessage) {
		return new ConnectFourHumanController(message.author.username, message.author.id);
	}

	private async getTargetController(message: GuildMessage, user: User) {
		if (user.bot) this.error(`You cant play with bots, they will never respond.`);
		if (user.id === message.author.id) this.error(`You cant play yourself, oh wait you already did`);

		const response = await promptConfirmation(message, {
			content: `${user.toString()}, you have been challenged by ${message.author.toString()} to a Connect-Four match. Click the 🇾 reaction to accept!`,
			target: user
		});

		if (response) return new ConnectFourHumanController(user.username, user.id);
		this.error(`${user.toString()} has declined the challenge`);
	}
}
