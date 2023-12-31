import { cast } from '@sapphire/utilities';
import { BaseReactionController } from '#lib/games/base/BaseReactionController';
import type { TicTacToeGame } from './TicTacToeGame.js';

export class TicTacToeHumanController extends BaseReactionController<number> {
	public async await(): Promise<number> {
		const reaction = await this.collectAvailableReaction();
		if (reaction === null) return -1;

		const game = cast<TicTacToeGame>(this.game);
		return game.reactions.indexOf(reaction);
	}

	protected resolveCollectedValidity(collected: string): boolean {
		const game = cast<TicTacToeGame>(this.game);
		const index = game.reactions.indexOf(collected);
		return index !== -1 && game.board[index] === 0;
	}
}
