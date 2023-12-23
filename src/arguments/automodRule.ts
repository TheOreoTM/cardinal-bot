import type { AutomodRule } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import { Argument } from '@sapphire/framework';

@ApplyOptions<Argument.Options>({})
export class UserArgument extends Argument<AutomodRule> {
	private readonly automodRules = [
		'bannedWords',
		'capitalization',
		'inviteLinks',
		'linkCooldown',
		'links',
		'massMention',
		'newLines',
		'spam',
		'stickers'
	];

	public override run(parameter: string) {
		const validRule = this.isAutomodRule(parameter, false);
		return validRule ? this.ok(validRule) : this.error({ parameter, message: 'Provide a valid automod rule', identifier: 'InvalidRule' });
	}

	private isAutomodRule(value: string, caseSensitive = true): AutomodRule | null {
		const lookupValue = caseSensitive ? value : value.toLowerCase();
		const foundRule = this.automodRules.find((rule) => (caseSensitive ? rule === lookupValue : rule.toLowerCase() === lookupValue));

		if (foundRule) {
			return foundRule as AutomodRule;
		}

		return null;
	}
}
