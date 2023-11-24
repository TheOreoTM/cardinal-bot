import { CardinalEmbedBuilder } from '#lib/structures';
import type { AutomodRule, GuildButtonInteraction } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonHandler extends InteractionHandler {
	public async run(interaction: GuildButtonInteraction) {
		const guild = interaction.guild;
		const rule = interaction.customId.split('-').pop() as AutomodRule;
		await guild.settings.automod.enableRule(rule);

		interaction.reply({
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Successfully enabled rule \`${rule}\``)]
		});
	}

	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId.startsWith('enable-rule')) return this.some();

		return this.none();
	}
}
