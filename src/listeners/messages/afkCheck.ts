import { CardinalEmbedBuilder } from '#lib/structures';
import { CardinalEvents, type GuildMessage } from '#lib/types';
import { seconds } from '#utils/common';
import { CardinalEmojis } from '#utils/constants';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { reply, send } from '@sapphire/plugin-editable-commands';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type Interaction } from 'discord.js';

@ApplyOptions<Listener.Options>({ event: CardinalEvents.MessageCreate })
export class UserEvent extends Listener {
	public override async run(message: GuildMessage) {
		if (!message.guild || message.author.bot) return;

		const user = message.member;

		const afkData = await this.container.db.afk.findUnique({
			where: {
				memberId_guildId: {
					guildId: message.guildId,
					memberId: user.id
				}
			},
			select: { afkPingMessages: true, afkNick: true }
		});

		if (afkData) {
			// Remove AFK
			await this.container.db.afk.delete({
				where: {
					memberId_guildId: {
						guildId: message.guildId,
						memberId: user.id
					}
				}
			});

			if (user.manageable) {
				user.setNickname(afkData.afkNick);
			}

			const afkPings = afkData.afkPingMessages;

			const viewPingsButton = new ButtonBuilder().setCustomId(`viewAfkPings`).setLabel(`View Pings`).setStyle(ButtonStyle.Secondary);

			const afkReturnGreet = await reply(message, {
				content: `Welcome back ${message.member}, I removed your AFK. ${
					afkPings.length
						? `You got **${afkPings.length === 1 ? `${afkPings.length} ping` : `${afkPings.length} pings`} ** while you were away`
						: ''
				}`,
				components: afkPings.length ? [new ActionRowBuilder<ButtonBuilder>().addComponents(viewPingsButton)] : []
			});

			const collectorFilter = (i: Interaction) => i.user.id === message.member.id;

			try {
				const viewPings = await afkReturnGreet.awaitMessageComponent({ filter: collectorFilter, time: seconds(30) });

				if (viewPings.customId === 'viewAfkPings') {
					const embed = new CardinalEmbedBuilder().setStyle('default').setTitle('Afk Pings');

					afkPings.forEach((afkPing) => {
						embed.addFields({
							name: `${afkPing.memberName}`,
							value: `${CardinalEmojis.Reply} ${afkPing.content} [(Go there)](${afkPing.messageUrl})`
						});
					});

					viewPings.reply({
						ephemeral: true,
						embeds: [embed]
					});

					const disabledButton = viewPingsButton.setDisabled(true);
					await send(message, {
						content: afkReturnGreet.content,
						components: afkPings.length ? [new ActionRowBuilder<ButtonBuilder>().addComponents(disabledButton)] : []
					});
				}
			} catch (e) {
				const disabledButton = viewPingsButton.setDisabled(true);
				await send(message, {
					content: afkReturnGreet.content,
					components: afkPings.length ? [new ActionRowBuilder<ButtonBuilder>().addComponents(disabledButton)] : []
				});
			}
		}

		const mentionedUsers = message.mentions.members;
		if (!mentionedUsers) return;

		mentionedUsers.forEach(async (user) => {
			const afkData = await this.container.db.afk.findUnique({
				where: {
					memberId_guildId: {
						guildId: message.guildId,
						memberId: user.id
					}
				}
			});

			if (!afkData) return;

			await send(message, {
				content: `\`${afkData.afkNick}\` is AFK: ${afkData.afkMessage}`,
				allowedMentions: {
					users: [message.author.id]
				}
			});

			await this.container.db.afk
				.update({
					where: {
						memberId_guildId: {
							guildId: message.guildId,
							memberId: user.id
						}
					},
					data: {
						afkPingMessages: {
							create: {
								content: message.content,
								memberId: message.member.id,
								memberName: getTag(message.member.user),
								messageUrl: message.url
							}
						}
					}
				})
				.catch(() => null);
		});
	}
}
