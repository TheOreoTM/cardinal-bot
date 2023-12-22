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

		const exactWordsPattern = this.createPattern(rule.exact);
		const exactRegExpString = `\\b(${exactWordsPattern})\\b`; // Use word boundaries to match whole words only
		const exactRegExp = new RegExp(exactRegExpString, 'i'); // 'i' flag for case-insensitive matching
		const isExactMatch = exactRegExp.test(content);

		const wildcardWordsPattern = this.createPattern(rule.wildcard, true);
		const wildcardRegExpString = `\\b(${wildcardWordsPattern})\\b`;
		const wildcardRegExp = new RegExp(wildcardRegExpString, 'i');
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

	private createPattern(words: string[], wildcard = false) {
		const basePattern = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

		if (wildcard) {
			return basePattern.map((word) => `.*${word}.*`).join('|');
		}
		return basePattern.join('|');
	}
}
