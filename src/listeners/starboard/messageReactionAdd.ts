import { buildEmbeds, buildLinkButtons } from '#utils/functions/starboard';
import { ApplyOptions } from '@sapphire/decorators';
import { isTextChannel } from '@sapphire/discord.js-utilities';
import { Events, Listener } from '@sapphire/framework';
import { channelMention, type MessageReaction, type PartialMessageReaction } from 'discord.js';

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
					authorId: targetMessage.author.id,
					channelId: targetMessage.channel.id,
					guildId: targetMessage.guild.id,
					messageId: targetMessage.id
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
			const starboardMessage = await starboardChannel.messages.fetch(existingStarboardMessage.starboardMessageId);
			if (!starboardMessage) return;

			const reactionCount = messageReaction.count;
			startBoardChannel.send(`${reactionCount > existingStarboardMessage.starCount}`)
			console.log(reactionCount, existingStarboardMessage.starCount, starboardMessage.editable);
			if (reactionCount > existingStarboardMessage.starCount && starboardMessage.editable) {
				try {
					await starboardWebhook.editMessage(starboardMessage, {
						content: `${data.starboardReaction} **${reactionCount}** | ${channelMention(targetMessage.channel.id)}`
					});
				} catch (error) {
					console.log(error);
					return;
				}
			}
			return;
		}

		// Create new starboard message
		const reactionCount = messageReaction.count;
		if (reactionCount >= data.starboardThreshold) {
			const embeds = await buildEmbeds(targetMessage, reactionCount);
			const content = `${data.starboardReaction} **${reactionCount}** | ${channelMention(targetMessage.channel.id)}`;

			const messageOnStarboard = await starboardWebhook.send({
				avatarURL: this.container.client.user?.displayAvatarURL() ?? undefined,
				username: 'Cardinal',
				content,
				embeds,
				components: [buildLinkButtons(targetMessage, targetMessage.channel.id, targetMessage.guild.id)]
			});

			await this.container.db.starboardMessage.create({
				data: {
					authorId: targetMessage.author.id,
					channelId: targetMessage.channel.id,
					guildId: targetMessage.guild.id,
					messageId: targetMessage.id,
					starCount: reactionCount,
					starboardMessageId: messageOnStarboard.id
				}
			});
		}
	}
}
