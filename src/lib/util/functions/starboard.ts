import { CardinalColors } from '#utils/constants';
import { extractImageUrl, getImageUrl } from '#utils/utils';
import { container } from '@sapphire/framework';
import { isNullishOrEmpty } from '@sapphire/utilities';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	Message,
	messageLink,
	type MessageContextMenuCommandInteraction
} from 'discord.js';

export function buildReplyComponents(...messages: [label: string, messageUrl: string][]) {
	const actionRow = new ActionRowBuilder<ButtonBuilder>();

	for (const [label, url] of messages) {
		actionRow.addComponents(
			new ButtonBuilder() //
				.setLabel(label)
				.setURL(url)
				.setStyle(ButtonStyle.Link)
		);
	}

	return actionRow;
}

export async function buildEmbeds(targetMessage: Message, amountOfStarsForMessage: number) {
	const embedOfStarredMessage = buildEmbed({ message: targetMessage, amountOfStarsForMessage });
	const embeds: EmbedBuilder[] = [embedOfStarredMessage];

	await addReferencedEmbedToEmbeds(targetMessage, embeds);

	return embeds;
}

interface BuildEmbedParameters {
	message: MessageContextMenuCommandInteraction['targetMessage'];
	isReferencedMessage?: boolean;
	amountOfStarsForMessage?: number;
}

function buildEmbed({ message, isReferencedMessage = false }: BuildEmbedParameters) {
	const authorName = isReferencedMessage ? `Replying to ${message.author.tag}` : message.author.tag;

	const embed = new EmbedBuilder()
		.setAuthor({
			name: authorName,
			iconURL: message.author.displayAvatarURL(),
			url: getMessageUrl(message, isReferencedMessage)
		})
		.setTimestamp(message.createdAt)
		.setFooter({ text: `Message ID: ${message.id}` })
		.setColor(isReferencedMessage ? CardinalColors.Default : CardinalColors.Info);

	if (!isNullishOrEmpty(message.content)) {
		embed.setDescription(message.content);
	}

	if (message.attachments.size) {
		const firstAttachmentUrl = getImageUrl(message.attachments.first()?.url);

		if (firstAttachmentUrl) {
			embed.setImage(firstAttachmentUrl);
		}
	}

	// If no image was found through attachment then check the content of the message
	if (!embed.data.image?.url) {
		const extractionResult = extractImageUrl(message.cleanContent);

		if (extractionResult && extractionResult.imageUrl) {
			embed.setImage(extractionResult.imageUrl);
			embed.setDescription(extractionResult.contentWithoutImageUrl || null);
		}
	}

	return embed;
}

async function addReferencedEmbedToEmbeds(message: MessageContextMenuCommandInteraction['targetMessage'], embeds: EmbedBuilder[]) {
	if (
		embeds.length <= 10 &&
		message.reference &&
		message.reference.messageId &&
		message.reference.guildId &&
		message.reference.channelId === message.channelId &&
		message.reference.guildId === message.guildId
	) {
		const referencedGuild = await container.client.guilds.fetch(message.reference.guildId);
		const referencedChannel = await referencedGuild.channels.fetch(message.reference.channelId);

		if (referencedChannel?.isTextBased()) {
			const referencedMessage = await referencedChannel.messages.fetch(message.reference.messageId);

			const embedOfReferencedMessage = buildEmbed({ message: referencedMessage, isReferencedMessage: true });
			embeds.unshift(embedOfReferencedMessage);

			if (referencedMessage.reference) {
				await addReferencedEmbedToEmbeds(referencedMessage, embeds);
			}
		}
	}
}

export function buildLinkButtons(targetMessage: Message, channelId: string, guildId: string) {
	const actionRow = new ActionRowBuilder<ButtonBuilder>();

	const originalMessageButton = new ButtonBuilder() //
		.setLabel('Original Message')
		.setURL(getMessageUrl(targetMessage))
		.setStyle(ButtonStyle.Link);

	actionRow.addComponents(originalMessageButton);

	if (
		targetMessage.reference &&
		targetMessage.reference.messageId &&
		targetMessage.reference.channelId &&
		targetMessage.reference.guildId &&
		targetMessage.reference.channelId === channelId &&
		targetMessage.reference.guildId === guildId
	) {
		const referencedMessageButton = new ButtonBuilder() //
			.setLabel('First Referenced Message')
			.setURL(getMessageUrl(targetMessage, true))
			.setStyle(ButtonStyle.Link);

		actionRow.addComponents(referencedMessageButton);
	}

	return actionRow;
}

function getMessageUrl(message: MessageContextMenuCommandInteraction['targetMessage'], isReferencedMessage = false) {
	if (isReferencedMessage) {
		if (message.reference && message.reference.messageId && message.reference.guildId) {
			return messageLink(message.reference.channelId, message.reference.messageId, message.reference.guildId);
		}
	}

	return message.url;
}
