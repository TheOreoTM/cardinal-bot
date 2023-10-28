import { CardinalEmbedBuilder, GiveawayManager } from '#lib/structures';
import type { GuildButtonInteraction } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonHandler extends InteractionHandler {
	public async run(interaction: GuildButtonInteraction) {
		const messageId = interaction.message.id;
		const guildId = interaction.guildId;

		const fromDb = await this.container.db.giveaway.findUnique({
			where: {
				messageId,
				guildId
			}
		});

		if (!fromDb) {
			interaction.reply({ ephemeral: true, embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('This giveaway has ended')] });
			return;
		}

		const manager = new GiveawayManager(fromDb);
		const canEnter = manager.canEnter({ userId: interaction.user.id, maxEntries: 1 });
		if (!canEnter) {
			interaction.reply({
				ephemeral: true,
				embeds: [
					new CardinalEmbedBuilder()
						.setStyle('fail')
						.setDescription(`You have already entered the max amount of times you're allowed to enter.`)
				]
			});
			return;
		}

		manager.addParticipant({ userId: interaction.user.id, maxEntries: 1 });

		interaction.reply({
			ephemeral: true,
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription('Successfully joined the giveaway.')]
		});

		await manager.save();
	}

	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId !== 'gw-join') return this.none();

		return this.some();
	}
}
