import type { GuildAutocompleteInteraction } from '#lib/types';
import type { AutomodBannedWords } from '@prisma/client';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ApplicationCommandOptionChoiceData } from 'discord.js';
import fuzzysort from 'fuzzysort';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Autocomplete
})
export class AutocompleteHandler extends InteractionHandler {
	public override async run(interaction: GuildAutocompleteInteraction, result: ApplicationCommandOptionChoiceData[]) {
		return interaction.respond(result);
	}

	public override async parse(interaction: GuildAutocompleteInteraction) {
		// Get the focussed (current) option
		const focusedOption = interaction.options.getFocused(true);
		const data = await interaction.guild.settings.automod.getSetting<AutomodBannedWords>('bannedWords');
		const bannedWords = [
			...(data?.exact ?? []).map((w) => ({ word: w, type: 'exact' })),
			...(data?.wildcard ?? []).map((w) => ({ word: w, type: 'wildcard' }))
		];
		// Ensure that the option name is one that can be autocompleted, or return none if not.
		if (focusedOption.name === 'word') {
			const filteredRules = fuzzysort.go(focusedOption.value, bannedWords, {
				key: 'word',
				limit: 10,
				threshold: -Infinity,
				all: true
			});
			let formattedRules = filteredRules.map((word) => ({
				name: `${word.obj.word} - ${word.obj.type}`,
				value: JSON.stringify({ word: word.obj.word, type: word.obj.type })
			}));

			return this.some(formattedRules);
		}

		return this.none();
	}
}
