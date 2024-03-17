import { CardinalEmbedBuilder } from '#lib/structures';
import { getTag } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { MessageLimits, isTextChannel } from '@sapphire/discord.js-utilities';
import { Events, Listener } from '@sapphire/framework';
import { cutText } from '@sapphire/utilities';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type MessageReaction, type PartialMessageReaction } from 'discord.js';

@ApplyOptions<Listener.Options>({ event: Events.MessageReactionAdd })
export class UserEvent extends Listener<typeof Events.MessageReactionAdd> {
	public override async run(partialMessageReaction: MessageReaction | PartialMessageReaction) {
		const messageReaction = await partialMessageReaction.fetch();
		const targetMessage = await messageReaction.message.fetch();
		if (!targetMessage.guild) return;

		const data = await this.container.db.guild.findUnique({
			where: {
				guildId: targetMessage.guild.id
			}
		});
		if (!data) return;

		if (data.starboardChannel === null) return;
		const starboardChannel = targetMessage.guild.channels.cache.get(data.starboardChannel);
		if (!starboardChannel || isTextChannel(starboardChannel) === false) return;

		if (data.starboardReaction === null) return;
		if (data.starboardThreshold === null) return;
		if (data.starboardWebhookToken === null || data.starboardWebhookId === null) return;

		if (messageReaction.emoji.name !== data.starboardReaction) return;

		const existingStarboardMessage = await this.container.db.starboardMessage.findUnique({
			where: {
				messageId_channelId_guildId_authorId: {
					messageId: targetMessage.id,
					channelId: targetMessage.channel.id,
					guildId: targetMessage.guild.id,
					authorId: targetMessage.author.id
				}
			}
		});

		const webhooks = await starboardChannel.fetchWebhooks();
		let starboardWebhook = webhooks.find((webhook) => webhook.token === data.starboardWebhookToken);
		if (!starboardWebhook) {
			starboardWebhook = await starboardChannel.createWebhook({ name: 'Starboard', reason: 'Starboard webhook not found' });

			await this.container.db.guild.update({
				where: {
					guildId: targetMessage.guild.id
				},
				data: {
					starboardWebhookId: starboardWebhook.id,
					starboardWebhookToken: starboardWebhook.token
				}
			});
		}

		// Update reaction count on starboard message
		if (existingStarboardMessage) {
			const starboardMessage = await starboardWebhook.fetchMessage(existingStarboardMessage.starboardMessageId);
			if (!starboardMessage) return;

			const reactionCount = messageReaction.count;
			if (reactionCount > existingStarboardMessage.starCount && starboardMessage.editable) {
				try {
					await starboardMessage.edit({
						content: `${data.starboardReaction} **${reactionCount}** | ${targetMessage.channel}`
					});
				} catch {
					return;
				}
			}
			return;
		}

		// Create new starboard message
		const reactionCount = messageReaction.count;
		if (reactionCount >= data.starboardThreshold) {
			let starboardEmbed = new CardinalEmbedBuilder().setStyle('info').setAuthor({
				name: getTag(targetMessage.author),
				iconURL: targetMessage.author.displayAvatarURL()
			});
			const content = targetMessage.content.length > 0 ? cutText(targetMessage.content, MessageLimits.MaximumLength) : null;

			if (content) {
				starboardEmbed.setDescription(content);
			}

			if (targetMessage.attachments.size > 0) {
				starboardEmbed.setImage(targetMessage.attachments.first()!.url);
			}

			if (targetMessage.embeds.length > 0) {
				starboardEmbed = new CardinalEmbedBuilder(targetMessage.embeds[0].data);
			}

			try {
				const jumpToMessage = new ButtonBuilder().setURL(targetMessage.url).setLabel('Jump to message').setStyle(ButtonStyle.Link);
				const row = new ActionRowBuilder<ButtonBuilder>().addComponents(jumpToMessage);

				const referencedMessage = await targetMessage.fetchReference().catch(() => null);

				if (referencedMessage) {
					const referencedJumpToMessage = new ButtonBuilder()
						.setURL(referencedMessage.url)
						.setLabel('Jump to replied message')
						.setStyle(ButtonStyle.Link);
					row.addComponents(referencedJumpToMessage);
				}

				const starboardMessage = await starboardWebhook.send({
					content: `**${reactionCount}** ${data.starboardReaction} ${targetMessage.channel} [Jump!](${targetMessage.url})`,
					embeds: [starboardEmbed],
					components: [row]
				});
				await this.container.db.starboardMessage.create({
					data: {
						authorId: targetMessage.author.id,
						channelId: targetMessage.channel.id,
						guildId: targetMessage.guild.id,
						messageId: targetMessage.id,
						starboardMessageId: starboardMessage.id,
						starCount: reactionCount
					}
				});
			} catch {
				return;
			}
		}
	}
}
