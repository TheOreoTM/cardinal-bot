import { ApplyOptions } from '@sapphire/decorators';
import { Argument } from '@sapphire/framework';

@ApplyOptions<Argument.Options>({
	name: 'commandCategory'
})
export class commandCategoryArgument extends Argument {
	public run(parameter: string, context: Argument.Context) {
		const commandCategory = parameter.toLowerCase();

		if (!commandCategory) {
			return this.error({
				parameter,
				identifier: 'MissingArgs',
				message: 'No command categort was provided',
				context
			});
		}

		const validCategories = ['admin', 'general', 'misc', 'moderation', 'pet', 'games'];

		if (!validCategories.includes(commandCategory)) {
			return this.error({
				parameter,
				identifier: 'InvalidCategory',
				message: 'An invalid category was provided',
				context
			});
		}

		return this.ok(commandCategory);
	}
}
