import { ModerationCommand, CardinalEmbedBuilder } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { seconds } from '#utils/common';
import { BotClientID, CardinalEmojis } from '#utils/constants';
import { sendTemporaryMessage } from '#utils/functions';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message, TextChannel } from 'discord.js';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Clean the bots responses and commands',
	name: 'clean',
	detailedDescription: {
		extendedHelp: 'Delete all of the bots responses and commands used in the last 100 messages',
		usages: [''],
		examples: ['']
	}
})
export class cleanCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message) {
		const channelMessages = await message.channel.messages.fetch({
			limit: 100
		});
		const messagesToDelete: GuildMessage[] = [];
		const prefix = (await this.prefix(message)) as string;

		channelMessages.forEach(async (message: Message) => {
			if (message.author.id === BotClientID || message.content.startsWith(prefix)) {
				messagesToDelete.push(message as GuildMessage);
			}
		});
		const channel = message.channel as TextChannel;
		message.delete();
		channel.bulkDelete(messagesToDelete).catch(() => {
			return send(message, { embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Something went wrong')] });
		});

		return sendTemporaryMessage(message, `${CardinalEmojis.Success} Successfully cleaned \`${messagesToDelete.length} messages\``, seconds(4));
	}
}
