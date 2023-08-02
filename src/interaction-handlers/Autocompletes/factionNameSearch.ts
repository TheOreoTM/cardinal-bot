import { FuzzySearch } from '#lib/structures';
import { getSlashId } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { AutocompleteInteraction, type ApplicationCommandOptionChoiceData } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Autocomplete
})
export class AutocompleteHandler extends InteractionHandler {
	public override async run(interaction: AutocompleteInteraction, result: ApplicationCommandOptionChoiceData[]) {
		return interaction.respond(result);
	}

	public override async parse(interaction: AutocompleteInteraction) {
		// Only run this interaction for the command with ID '1000000000000000000'
		if (interaction.commandId !== (await getSlashId('faction join', this.container.client))) return this.none();

		// Get the focussed (current) option
		const focusedOption = interaction.options.getFocused(true);
		// Ensure that the option name is one that can be autocompleted, or return none if not.
		switch (focusedOption.name) {
			case 'name': {
				const factions = await this.container.db.faction.findMany({
					select: {
						name: true
					}
				});
				const factionsList = factions.map((faction) => faction.name);

				const search = new FuzzySearch(factionsList).search(focusedOption.value, 10);
				console.log(search);
				return this.some(search.map((match) => ({ name: match.target, value: match.target })));
			}
			default:
				return this.none();
		}
	}
}
