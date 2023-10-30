import { CardinalEvents } from '#lib/types';
import { container } from '@sapphire/framework';
import { pickRandom } from '@sapphire/utilities';
import { CardinalEmbedBuilder, Timestamp } from '#lib/structures';
import { CardinalColors } from '#utils/constants';
import { andList } from '#utils/formatters';

import { bold, userMention } from 'discord.js';

export class GiveawayManager {
	readonly data: GiveawayData;

	constructor(data?: Partial<GiveawayData>) {
		this.data = {
			id: data?.id || 0,
			messageId: data?.messageId || '',
			channelId: data?.channelId || '',
			hosterId: data?.hosterId || '',
			guildId: data?.guildId || '',
			prize: data?.prize || '',
			description: data?.description || null,
			winnerAmount: data?.winnerAmount || 0,
			participants: data?.participants || [],
			expired: data?.expired || false,
			expiresAt: data?.expiresAt || new Date()
		};
	}

	get endsAtTimestamp() {
		return Math.floor(this.endsAt.getTime() / 1000);
	}

	get endsAt() {
		return this.data.expiresAt;
	}

	get channelId() {
		return this.data.channelId;
	}

	get messageId() {
		return this.data.messageId;
	}

	get guildId() {
		return this.data.guildId;
	}

	get hosterId() {
		return this.data.hosterId;
	}

	get winnerAmount() {
		return this.data.winnerAmount;
	}

	get participants() {
		return this.data.participants;
	}

	get prize() {
		return this.data.prize;
	}

	get description() {
		return this.data.description;
	}

	/**
	 * Pick new winners without including the current winners if possible
	 * @param currentWinners The list of winners
	 * @returns An array of new winners
	 */
	public reroll(currentWinners: string[] = []) {
		const remainingParticipants = this.data.participants.filter((participant) => !currentWinners.includes(participant));

		if (remainingParticipants.length === 0) {
			// If there are no remaining participants, include the current winners in the reroll

			const newWinners = this.getWinners();
			return newWinners;
		} else {
			if (this.data.participants.length === 1) return this.data.participants;
			// Implement your logic to randomly select new winners from remainingParticipants
			const newWinners = pickRandom(remainingParticipants, this.data.winnerAmount);
			return newWinners;
		}
	}

	public getWinners(): string[] | null {
		if (this.data.participants.length < this.data.winnerAmount) {
			return null;
		}

		if (this.data.participants.length === 1) {
			return this.data.participants;
		}

		const winners = pickRandom(this.data.participants, this.data.winnerAmount);

		if (this.data.winnerAmount === 1) return [winners.toString()];
		return winners;
	}

	public async end(data?: { winnersList?: string[] | null; reroll?: boolean }) {
		const winners = data?.winnersList ? data.winnersList : this.getWinners();

		const channel = container.client.channels.cache.get(this.channelId);
		if (!channel || !channel.isTextBased()) {
			console.log('No gw channel 1', this.channelId);
			return;
		}

		const message = await channel.messages.fetch(this.messageId).catch(() => {
			channel.send({
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`The original giveaway message was deleted`)]
			});
			console.log('No gw channel 2', this.channelId);

			return;
		});

		if (!message) {
			channel.send({
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`The original giveaway message was deleted`)]
			});
			return;
		}

		if (!winners) {
			message.edit({
				components: [],
				embeds: [
					new CardinalEmbedBuilder(message.embeds[0].data)
						.setColor(CardinalColors.Fail)
						.setDescription('Not enough entries to get a winner.')
				]
			});

			message.reply({ embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Not enough entries to get a winner.')] });
			return;
		}

		console.log(winners);
		const formattedEndTime = new Timestamp(this.endsAt.getTime());
		let formattedWinners = winners.map((winnerId) => `<@${winnerId}>`);
		const description = [];
		if (this.description) description.push(`**Description:** ${this.description}`);
		description.push(`Ended: ${formattedEndTime.getRelativeTime()} (${formattedEndTime.getLongDateTime()})`);
		description.push(`Hosted by: ${userMention(this.hosterId)}`);
		description.push(`Participants: **${this.participants.length}**`);
		description.push(`Winners: ${andList(formattedWinners)}`);

		const embed = new CardinalEmbedBuilder()
			.setStyle('default')
			.setTitle(this.prize)
			.setDescription(description.join('\n'))
			.setTimestamp(this.endsAt);

		if (message) {
			message.edit({ content: '', embeds: [embed], components: [] });
		}

		const replyMessage = data?.reroll
			? `${bold(`[REROLL]`)} Congratulations ${andList(formattedWinners)}! You are the new winner of the ${bold(this.prize)}`
			: `Congratulations ${andList(formattedWinners)}! You won the ${bold(this.prize)}`;

		await message.reply({
			content: replyMessage
		});

		this.data.expired = true;
		this.save();
	}

	/**
	 * @deprecated Use end() instead
	 * Only call this when you want to forcefully end a giveaway. Make sure to not call it in a file where the giveaway tracking is automatically taking place.
	 */
	public forceEnd() {
		container.client.emit(CardinalEvents.GiveawayEnd, this);
	}

	public canEnter({ userId, maxEntries = 1 }: { userId: string; maxEntries?: number }) {
		const amountOfExistingEntries = this.data.participants.filter((participant) => participant === userId).length;
		if (amountOfExistingEntries + 1 > maxEntries) return false;
		return true;
	}

	public addParticipant({ userId, maxEntries = 1 }: { userId: string; maxEntries?: number }) {
		if (!this.canEnter({ userId, maxEntries })) return null;
		this.data.participants.push(userId);
		return true;
	}

	public async delete() {
		try {
			await container.db.giveaway.delete({
				where: {
					messageId: this.messageId
				}
			});
		} catch {
			// noop
		} finally {
			this.end();
		}
	}

	public setEndAt(date: Date) {
		this.data.expiresAt = date;
	}

	public setDescription(desc: string) {
		this.data.description = desc;
	}

	public setGuild(id: string) {
		this.data.guildId = id;
	}

	public setChannel(id: string) {
		this.data.channelId = id;
	}

	public setMessage(id: string) {
		this.data.messageId = id;
	}

	public setPrize(prize: string) {
		this.data.prize = prize;
	}

	public setWinnerAmount(amount: number) {
		this.data.winnerAmount = amount;
	}

	public setHoster(id: string) {
		this.data.hosterId = id;
	}

	public static fromDatabase(data: GiveawayData): GiveawayManager {
		return new GiveawayManager(data);
	}

	public toDatabase(): Omit<GiveawayData, 'id'> {
		const data = this.data;
		return {
			winnerAmount: data.winnerAmount,
			channelId: data.channelId,
			description: data.description,
			expiresAt: data.expiresAt,
			guildId: data.guildId,
			hosterId: data.hosterId,
			messageId: data.messageId,
			participants: data.participants,
			expired: data.expired,
			prize: data.prize
		};
	}

	/**
	 * Update the message with the new information
	 *
	 */
	public async updateMessage() {
		const channel = container.client.channels.cache.get(this.channelId);
		if (!channel || !channel.isTextBased()) {
			return;
		}
		const message = await channel.messages.fetch(this.messageId).catch(() => {
			channel.send({
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`The original giveaway message was deleted`)]
			});
			return;
		});

		if (!message) {
			channel.send({
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`The original giveaway message was deleted`)]
			});
			return;
		}

		const formattedEndTime = new Timestamp(this.endsAt.getTime());

		const description = [];
		if (this.description) description.push(`${this.description}\n`);
		description.push(`Ends: ${formattedEndTime.getRelativeTime()} (${formattedEndTime.getLongDateTime()})`);
		description.push(`Hosted by: ${userMention(this.hosterId)}`);
		description.push(`Participants: **${this.participants.length}**`);
		description.push(`Winners: **${this.winnerAmount}**`);

		const embed = new CardinalEmbedBuilder()
			.setStyle('default')
			.setTitle(this.prize)
			.setDescription(description.join('\n'))
			.setTimestamp(this.endsAt);

		message.edit({ embeds: [embed] });
	}
	/**
	 * Reflect the changes in the Database
	 */
	public async save() {
		return await container.db.giveaway.upsert({
			where: {
				messageId: this.messageId
			},
			create: {
				...this.toDatabase()
			},
			update: {
				...this.toDatabase()
			}
		});
	}
}
export type GiveawayData = {
	id: number;
	messageId: string;
	hosterId: string;
	channelId: string;
	guildId: string;
	prize: string;
	description: string | null;
	winnerAmount: number;
	participants: string[];
	expired: boolean;
	expiresAt: Date;
};
