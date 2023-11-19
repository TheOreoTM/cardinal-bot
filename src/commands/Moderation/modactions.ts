import { CardinalEmbedBuilder, CardinalPaginatedMessageEmbedFields, ModerationCommand, Timestamp } from '#lib/structures';
import { capitalizeWords } from '#utils/formatters';
import { generatePaginatedEmbeds, getTag } from '#utils/utils';
import type { Modlog } from '@prisma/client';
import { ApplyOptions } from '@sapphire/decorators';
import { GuildMember, type APIEmbedField, User } from 'discord.js';

@ApplyOptions<ModerationCommand.Options>({
	description: 'View all the actions a staff member has taken',
	name: 'modactions',
	detailedDescription: {
		examples: ['@theoreotm', ''],
		explainedUsage: [['Member/User', 'The staff member you want to view the actions of']],
		extendedHelp: 'View all the moderative actions a staff member has taken that warrants a modlog for the target member.',
		usages: ['Member/User', '']
	}
})
export class modactionsCommand extends ModerationCommand {
	public registerApplicationCommands(registry: ModerationCommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addUserOption((option) =>
					option.setName('target').setDescription('The staff member you want to view the actions of').setRequired(true)
				)
		);
	}

	public async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const argTarget = await args.pick('member').catch(async () => await args.pick('user').catch(() => message.author));
		const target = argTarget instanceof GuildMember ? argTarget.user : argTarget;
		const guildId = message.guildId;

		await this.sendModActions(message, target, guildId);
		return;
	}

	public async chatInputRun(interaction: ModerationCommand.ChatInputCommandInteraction) {
		const target = interaction.options.getUser('target', true);

		await this.sendModActions(interaction, target, interaction.guildId);
		return;
	}

	private async sendModActions(
		interactionOrMessage: ModerationCommand.Message | ModerationCommand.ChatInputCommandInteraction,
		target: User,
		guildId: string
	) {
		const modActions = await this.container.db.modlog.findMany({
			where: {
				staffId: target.id,
				guildId: guildId
			}
		});

		const template = new CardinalEmbedBuilder()
			.setStyle('default')
			.setAuthor({ iconURL: target.displayAvatarURL(), name: `${modActions.length} Mod Actions for ${getTag(target)} (${target.id})` });

		const addField = (action: Modlog): APIEmbedField => {
			const formattedTime = new Timestamp(action.createdAt.getTime());
			const values = [`**Type:** ${capitalizeWords(action.type)}`, `**User:** <@${action.memberId}> (${action.memberId})`];
			const reason = `**Reason:** ${action.reason} - ${formattedTime.getLongDateTime()}`;

			action.length ? values.push(`**Length:** ${action.length}`, reason) : values.push(reason);
			return {
				name: `Case ${action.caseId}`,
				value: values.join('\n')
			};
		};

		const paginatedEmbeds = generatePaginatedEmbeds(modActions, template, addField, 10);

		const display = new CardinalPaginatedMessageEmbedFields();
		display.addPageEmbeds(paginatedEmbeds);

		display.run(interactionOrMessage);
	}
}
