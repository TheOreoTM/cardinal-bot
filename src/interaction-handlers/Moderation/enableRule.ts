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
		const splits = interaction.customId.split('-');
		const rule = splits.pop() as AutomodRule;
		const memberId = splits.pop();
		if (memberId !== interaction.member.id) {
			interaction.reply({
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('This embed doesnt belong to you')],
				ephemeral: true
			});

			return;
		}
		await guild.settings.automod.enableRule(rule);

		interaction.reply({
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Successfully enabled rule \`${rule}\``)]
		});
	}

	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId.startsWith('enablerule')) return this.some();

		return this.none();
	}
}
