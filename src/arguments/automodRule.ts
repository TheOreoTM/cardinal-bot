import type { AutomodRule } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import { Argument } from '@sapphire/framework';

@ApplyOptions<Argument.Options>({})
export class UserArgument extends Argument<AutomodRule> {
	public override run(parameter: string) {
		const isRule = this.isAutomodRule(parameter);
		return isRule ? this.ok(parameter) : this.error({ parameter, message: 'Provide a valid automod rule', identifier: 'InvalidRule' });
	}

	private isAutomodRule(value: string): value is AutomodRule {
		return ['bannedWords', 'capitalization', 'inviteLinks', 'linkCooldown', 'links', 'massMention', 'newLines', 'spam', 'stickers'].includes(
			value
		);
	}
}
