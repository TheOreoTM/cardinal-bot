import { ModerationMessageListener } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { deleteMessage, getContent, sendTemporaryMessage } from '#utils/functions';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<ModerationMessageListener.Options>({
	name: 'userMessageBannedWords',
	reason: 'Sending banned words',
	rule: 'bannedWords',
	enabled: true
})
export class BannedWordModerationListener extends ModerationMessageListener {
	protected async preProcess(message: GuildMessage) {
		const content = getContent(message);
		if (content === null) return null;

		const data = await this.container.db.guild.findUnique({
			where: {
				guildId: message.guildId
			},
			select: {
				bannedWords: true
			}
		});

		const rule = data?.bannedWords!;

		const exactRegExp = this.createBannedWordsRegExp(rule.exact);
		const isExactMatch = exactRegExp.test(content);

		const wildcardRegExp = this.createBannedWordsRegExp(rule.wildcard, true);
		const isWildcardMatch = wildcardRegExp.test(content);

		if (isWildcardMatch || isExactMatch) {
			return true;
		}

		return null;
	}

	protected onDelete(message: GuildMessage) {
		return deleteMessage(message);
	}

	protected onAlert(message: GuildMessage) {
		return sendTemporaryMessage(message, `${message.member}, That word isn't allowed in this server`);
	}

	private createBannedWordsRegExp(words: string[], replaceWildcard = false) {
		const wordsPattern = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

		return new RegExp(`\\b(${replaceWildcard ? wordsPattern.replace(/\*/g, '.*') : wordsPattern})\\b`, 'i');
	}
}
