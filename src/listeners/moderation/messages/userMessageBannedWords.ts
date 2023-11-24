import { ModerationMessageListener } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { deleteMessage, getContent, sendTemporaryMessage } from '#utils/functions';
import { containsAny } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<ModerationMessageListener.Options>({
	name: 'userMessageBannedWords',
	reason: 'Sending banned words',
	rule: 'bannedWords',
	enabled: true
})
export class bannedWordModerationListener extends ModerationMessageListener {
	protected async preProcess(message: GuildMessage) {
		const content = getContent(message);
		console.log('🚀 ~ file: userMessageBannedWords.ts:16 ~ bannedWordModerationListener ~ preProcess ~ content:', content);
		if (!content) return null;
		const words = content.split(' ');
		const data = await this.container.db.guild.findUnique({
			where: {
				guildId: message.guildId
			},
			select: {
				bannedWords: true
			}
		});
		const rule = data?.bannedWords!;
		const bannedWords = [...rule.exact, 'nigga'];

		const hasBannedWord = containsAny(words, bannedWords);

		return hasBannedWord ? true : null;
	}

	protected onDelete(message: GuildMessage) {
		return deleteMessage(message);
	}

	protected onAlert(message: GuildMessage) {
		return sendTemporaryMessage(message, `${message.member}, That word isnt allowed in this server`);
	}
}
