import { AutomodRules } from '#utils/moderationConstants';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ApplicationCommandOptionChoiceData, AutocompleteInteraction } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Autocomplete
})
export class AutocompleteHandler extends InteractionHandler {
	public override async run(interaction: AutocompleteInteraction, result: ApplicationCommandOptionChoiceData[]) {
		return interaction.respond(result);
	}

	public override async parse(interaction: AutocompleteInteraction) {
		// Get the focussed (current) option
		const focusedOption = interaction.options.getFocused(true);
		// Ensure that the option name is one that can be autocompleted, or return none if not.
		if (focusedOption.name === 'rule') {
			let formattedRules = AutomodRules.map((rule) => ({
				name: rule.readableName,
				value: rule.dbValue
			}));

			return this.some(formattedRules);
		}

		return this.none();
	}
}
