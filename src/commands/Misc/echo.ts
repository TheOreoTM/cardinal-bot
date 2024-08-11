import { ApplyOptions } from '@sapphire/decorators';
import { Command, type Args } from '@sapphire/framework';
import { Message } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'echo'
})
export class UserCommand extends Command {
	public async messageRun(message: Message, args: Args) {
		const content = await args.rest('string');
		return message.reply(content);
	}
}
