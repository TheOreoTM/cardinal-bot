import { CardinalEmbedBuilder, CardinalSubcommand } from '#lib/structures';
import { minutes } from '#utils/common';
import { getUser } from '#utils/functions';
import { ApplyOptions } from '@sapphire/decorators';
import { UserError } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import {
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	type ModalActionRowComponentBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	ButtonBuilder,
	ButtonStyle,
	type Interaction,
	ComponentType
} from 'discord.js';
import randomatic from 'randomatic';

@ApplyOptions<CardinalSubcommand.Options>({
	name: 'faction',
	detailedDescription: {
		extendedHelp: '',
		usages: [],
		examples: []
	},
	subcommands: [
		{
			name: 'info',
			messageRun: 'messageFactionInfo',
			chatInputRun: 'slashFactionInfo',
			default: true
		},
		{
			name: 'create',
			messageRun: 'messageFactionCreate',
			chatInputRun: 'slashFactionCreate'
		}
	]
})
export class factionCommand extends CardinalSubcommand {
	public async messageFactionInfo(message: CardinalSubcommand.Message) {
		const userData = await this.container.db.user.findUnique({ where: { userId: message.member.id } });
		const prefix = await this.container.client.fetchPrefix(message);
		if (!userData) {
			throw new UserError({
				identifier: 'NotRegistered',
				message: `Please register your account using \`${prefix}register\``
			});
		}

		const faction = await this.container.db.faction.findUnique({ where: { id: userData.factionId ?? -1 } });

		if (!userData.factionId || !faction) {
			return await send(message, {
				embeds: [
					new CardinalEmbedBuilder()
						.setDescription(
							`You are not in a faction\n\n> Use \`${prefix}faction create\` or \`${prefix}faction join\` to join/create a faction.`
						)
						.setStyle('fail')
				]
			});
		}

		return JSON.stringify(faction, null, 2);
	}

	public async messageFactionCreate(message: CardinalSubcommand.Message) {
		// TODO: Remove this from this function and put it in a seperate function
		const factionCreateModal = new ModalBuilder().setTitle('Create a Faction').setCustomId(`${message.author.id}-faction-create`);
		const factionNameInput = new TextInputBuilder()
			.setCustomId('factionNameInput')
			.setMaxLength(32)
			.setMinLength(2)
			.setRequired(true)
			.setLabel('Faction Name')
			.setPlaceholder('The Cullers')
			.setStyle(TextInputStyle.Short);
		const factionDescriptionInput = new TextInputBuilder()
			.setCustomId('factionDescriptionInput')
			.setMaxLength(280)
			.setMinLength(8)
			.setLabel('Faction Description')
			.setPlaceholder('The best faction in the server')
			.setRequired(true)
			.setStyle(TextInputStyle.Paragraph);

		factionCreateModal.addComponents([
			new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(factionNameInput),
			new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(factionDescriptionInput)
		]);

		const factionInvitionTypeSelectMenu = new StringSelectMenuBuilder()
			.setCustomId('factionInvitionType')
			.setPlaceholder('Pick your faction status type...')
			.addOptions(
				new StringSelectMenuOptionBuilder().setLabel('Open').setValue('open').setDescription('Anyone can join this faction'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Invite Only')
					.setValue('restricted')
					.setDescription('People can only join by sending an invite to join')
					.setDefault(false),
				new StringSelectMenuOptionBuilder()
					.setLabel('Closed')
					.setValue('closed')
					.setDescription('No one can join this faction')
					.setDefault(false)
			);
		const components = [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(factionInvitionTypeSelectMenu)];

		const promptForCreationButton = new ButtonBuilder()
			.setCustomId('promptForCreation')
			.setStyle(ButtonStyle.Secondary)
			.setLabel('Create Faction');
		const promptForCreationEmbed = new CardinalEmbedBuilder()
			.setStyle('info')
			.setDescription('Click the button below to start your faction creation.');
		const response = await send(message, {
			embeds: [promptForCreationEmbed],
			components: [new ActionRowBuilder<ButtonBuilder>().addComponents(promptForCreationButton)]
		});

		const collectorFilter = (i: Interaction) => i.user.id === message.author.id;

		try {
			const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: minutes(1) });
			if (confirmation.customId === 'promptForCreation') {
				promptForCreationButton.setDisabled(true);
				await response.edit({
					embeds: [promptForCreationEmbed],
					components: [new ActionRowBuilder<ButtonBuilder>().addComponents(promptForCreationButton)]
				});
				confirmation.showModal(factionCreateModal);
				const submitted = await confirmation.awaitModalSubmit({ time: minutes(5), filter: collectorFilter }).catch(() => null);

				if (submitted) {
					const { fields } = submitted;
					const description = fields.getTextInputValue('factionDescriptionInput');
					const name = fields.getTextInputValue('factionNameInput');
					const factionEmbed = new CardinalEmbedBuilder().setTitle(name).setDescription(description);
					const selectmenu = await submitted.reply({ embeds: [factionEmbed], components: components });

					const confirmation = await selectmenu.awaitMessageComponent({
						filter: collectorFilter,
						time: minutes(1),
						componentType: ComponentType.StringSelect
					});
					if (confirmation.customId === 'factionInvitionType') {
						const embed = new CardinalEmbedBuilder(confirmation.message.embeds[0].data)
							.addFields({
								value: confirmation.values[0],
								name: 'Status'
							})
							.setStyle('default');
						await confirmation.reply({ content: 'Successfully created your faction!', ephemeral: true });
						await selectmenu.edit({ embeds: [embed], components: [] });

						// TODO: Make factions
						const user = await getUser(message.author.id, { faction: true });
						if (!user)
							throw new UserError({
								message: 'Something is wrong, it seems you dont exist. Try re-registering.',
								identifier: 'UserNotFound'
							});
						const factionTag = randomatic('Aa0', 8);
						const faction = await this.container.db.faction.create({
							data: { description, name, ownerId: message.author.id, tag: factionTag }
						});
						user.factionId = faction.id;
						await this.container.db.user.update({
							where: { userId: message.author.id },
							data: { positionInFaction: 'leader', factionId: faction.id }
						});
					}
				}
			}
		} catch (err) {
			console.log(err);
			await response.edit({
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Confirmation not received within 1 minute, cancelling')],
				components: []
			});
		}
	}

	// public async chatInputInfo(interaction: CardinalSubcommand.ChatInputCommandInteraction) {}

	// public async chatInputCreate(interaction: CardinalSubcommand.ChatInputCommandInteraction) {}
}
