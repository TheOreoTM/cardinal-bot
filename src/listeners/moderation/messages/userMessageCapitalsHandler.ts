import { ModerationMessageListener } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { deleteMessage, sendTemporaryMessage } from '#utils/functions';
import { ApplyOptions } from '@sapphire/decorators';
import { getCode, isUpper } from '@skyra/char';

@ApplyOptions<ModerationMessageListener.Options>({
	name: 'userMessageCapitalsHandlder',
	reason: 'Sending banned words',
	rule: 'capitalization',
	enabled: true
})
export class CapitalizationModerationListener extends ModerationMessageListener {
	protected async preProcess(message: GuildMessage) {
		if (message.content.length === 0) return null;

		const data = await this.container.db.guild.findUnique({
			where: {
				guildId: message.guildId
			},
			select: {
				capitalization: true
			}
		});

		const rule = data?.capitalization!;
		const maxPercentage = rule.percentage;
		if (!maxPercentage) return null;

		let length = 0;
		let count = 0;

		for (const char of message.content) {
			const charCode = getCode(char);
			if (isUpper(charCode)) count++;
			length++;
		}

		const percentage = (count / length) * 100;
		return percentage >= maxPercentage ? 1 : null;
	}

	protected onDelete(message: GuildMessage) {
		return deleteMessage(message);
	}

	protected onAlert(message: GuildMessage) {
		return sendTemporaryMessage(message, `${message.member}, Too many caps`);
	}
}
