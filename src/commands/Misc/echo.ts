import { CardinalCommand } from '#lib/structures';
import { ApplyOptions } from '@sapphire/decorators';
import { type Args } from '@sapphire/framework';
import { Message } from 'discord.js';

@ApplyOptions<CardinalCommand.Options>({
	name: 'echo'
})
export class UserCommand extends CardinalCommand {
	public async messageRun(message: Message, args: Args) {
		const content = await args.rest('string');
		return message.reply(content);
	}
}
