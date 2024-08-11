import { CardinalCommand, CardinalEmbedBuilder } from '#lib/structures';
import type { InteractionOrMessage } from '#lib/types';
import { seconds } from '#utils/common';
import { sendInteractionOrMessage, sendTemporaryMessage } from '#utils/functions';
import { ApplyOptions } from '@sapphire/decorators';
import { GuildMemberLimits } from '@sapphire/discord.js-utilities';
import { BucketScope } from '@sapphire/framework';

@ApplyOptions<CardinalCommand.Options>({
	description: 'Go AFK',
	name: 'afk',
	detailedDescription: {
		extendedHelp:
			"Mark yourself as Afk. The bot will change your nickname to indicate that you're afk and when you are pinged the bot will automatically tell users that you are afk",
		usages: ['AfkMessage', ''],
		examples: ['This chat too cringe', 'Oh no Sed is here'],
		explainedUsage: [['AfkMessage', 'The message that you want to show up when someone pings you']],
		reminder: 'You cannot use links in **AfkMessage**'
	},
	cooldownDelay: seconds(45),
	cooldownScope: BucketScope.User
})
export class afkCommand extends CardinalCommand {
	public registerApplicationCommands(registry: CardinalCommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) =>
					option.setName('message').setDescription('The message to be displayed when you are pinged').setRequired(true).setMinLength(1)
				)
		);
	}

	public async messageRun(message: CardinalCommand.Message, args: CardinalCommand.Args) {
		const isAfk = await this.container.db.afk.count({
			where: {
				memberId: message.member.id,
				guildId: message.guildId
			}
		});

		if (isAfk !== 0) {
			return sendTemporaryMessage(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('You are already AFK')]
			});
		}

		let afkMessage = await args.rest('string', { maximum: 250 }).catch(() => 'AFK');
		const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;

		afkMessage
			.replaceAll(urlRegex, '')
			.replaceAll(/\s{2,}/g, ' ')
			.trim();

		return await this.goAfk(message, afkMessage);
	}

	public async chatInputRun(interaction: CardinalCommand.ChatInputCommandInteraction) {
		const afkMessage = interaction.options.getString('message', true);
		return this.goAfk(interaction, afkMessage);
	}

	private async goAfk(interactionOrMessage: InteractionOrMessage, afkMessage: string) {
		const isAfk = await this.container.db.afk.count({
			where: {
				memberId: interactionOrMessage.member.id,
				guildId: interactionOrMessage.guildId
			}
		});

		if (isAfk !== 0) {
			return sendInteractionOrMessage(interactionOrMessage, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('You are already AFK')]
			});
		}

		const afkNick = interactionOrMessage.member.displayName;
		setTimeout(async () => {
			await this.container.db.afk.upsert({
				where: {
					memberId_guildId: {
						memberId: interactionOrMessage.member.id,
						guildId: interactionOrMessage.guildId
					}
				},
				update: {
					afkMessage,
					afkNick
				},
				create: {
					afkMessage,
					guildId: interactionOrMessage.guildId,
					memberId: interactionOrMessage.member.id,
					afkNick
				}
			});
		}, seconds(20));

		if (interactionOrMessage.member.manageable) {
			interactionOrMessage.member.setNickname(
				`[AFK] ${interactionOrMessage.member.displayName.slice(0, GuildMemberLimits.MaximumDisplayNameLength - '[afk] '.length)}`
			);
		}

		return sendInteractionOrMessage(interactionOrMessage, {
			content: `${interactionOrMessage.member} I set your AFK: ${afkMessage}`,
			allowedMentions: {
				users: [interactionOrMessage.member.id]
			}
		});
	}
}
