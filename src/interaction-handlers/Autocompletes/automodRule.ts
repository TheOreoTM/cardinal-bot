import { AutomodRules } from '#utils/moderationConstants';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ApplicationCommandOptionChoiceData, AutocompleteInteraction } from 'discord.js';
import fuzzysort from 'fuzzysort';

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
		console.log(focusedOption.name, focusedOption.value);
		// Ensure that the option name is one that can be autocompleted, or return none if not.
		if (focusedOption.name === 'rule') {
			const filteredRules = fuzzysort.go(focusedOption.value, AutomodRules, { key: 'readableName', limit: 5, threshold: Infinity, all: true });
			let formattedRules = filteredRules.map((rule) => ({
				name: rule.obj.readableName,
				value: rule.obj.dbValue
			}));

			return this.some(formattedRules);
		}

		return this.none();
	}
}
