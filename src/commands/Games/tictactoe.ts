import { TicTacToeGame } from '#lib/games/tic-tac-toe/TicTacToeGame';
import { TicTacToeHumanController } from '#lib/games/tic-tac-toe/TicTacToeHumanController';
import { CardinalCommand } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { promptConfirmation } from '#utils/functions';
import { ApplyOptions } from '@sapphire/decorators';
import { CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { PermissionFlagsBits } from 'discord-api-types/v9';
import type { User } from 'discord.js';

@ApplyOptions<CardinalCommand.Options>({
	aliases: ['ttt'],
	description: 'Play Tic-Tac-Toe with somebody.',
	enabled: false,
	detailedDescription: {
		usages: ['User'],
		extendedHelp:
			'Tic-tac-toe (also known as noughts and crosses or Xs and Os) is a paper-and-pencil game for two players, X and O, who take turns marking the spaces in a 3×3 grid.\nThe player who succeeds in placing three of their marks in a horizontal, vertical, or diagonal row wins the game.',
		examples: ['@Oreo']
	},
	requiredClientPermissions: [PermissionFlagsBits.AddReactions, PermissionFlagsBits.ReadMessageHistory],
	runIn: [CommandOptionsRunTypeEnum.GuildAny]
})
export class UserCommand extends CardinalCommand {
	private readonly channels: Set<string> = new Set();

	public async messageRun(message: GuildMessage, args: CardinalCommand.Args) {
		if (this.channels.has(message.channel.id)) this.error(`There is currently a game in progress in this channel, try again later.`);

		const user = await args.pick('userName');
		const player1 = this.getAuthorController(message);
		const player2 = await this.getTargetController(message, user);

		this.channels.add(message.channel.id);
		const game = new TicTacToeGame(message, player1, player2);

		try {
			await game.run();
		} finally {
			this.channels.delete(message.channel.id);
		}
	}

	private getAuthorController(message: GuildMessage) {
		return new TicTacToeHumanController(message.author.username, message.author.id);
	}

	private async getTargetController(message: GuildMessage, user: User) {
		if (user.bot) this.error(`You cant play games with a bot, they will never respond.`);
		if (user.id === message.author.id) this.error(`You cant play yourself, oh wait you already did.`);

		const response = await promptConfirmation(message, {
			content: `${user.toString()}, you have been challenged by ${message.author.toString()} to a Tic-Tac-Toe match. Click the 🇾 reaction to accept`,
			target: user
		});

		if (response) return new TicTacToeHumanController(user.username, user.id);
		this.error(`${user.toString()} has declined the challenge`);
	}
}
