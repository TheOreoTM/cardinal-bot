import { CardinalEvents } from '#lib/types';
import { endGiveaway } from '#utils/utils';
import { UserError, container } from '@sapphire/framework';
import { pickRandom } from '@sapphire/utilities';

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

			const newWinners = pickRandom(this.data.participants, this.data.winnerAmount);
			return newWinners;
		} else {
			// Implement your logic to randomly select new winners from remainingParticipants
			const newWinners = pickRandom(remainingParticipants, this.data.winnerAmount);
			return newWinners;
		}
	}

	public getWinners(): string[] | null {
		if (this.data.participants.length < this.data.winnerAmount) {
			return null;
		}

		const winners = pickRandom(this.data.participants, this.data.winnerAmount);
		return winners;
	}

	public async end() {
		await endGiveaway(this.data);
	}

	/**
	 * @deprecated Use end() instead
	 * Only call this when you want to forcefully end a giveaway. Make sure to not call it in a file where the giveaway tracking is automatically taking place.
	 */
	public forceEnd() {
		container.client.emit(CardinalEvents.GiveawayEnd, this);
	}

	public addParticipant({ userId, maxEntries = 1 }: { userId: string; maxEntries?: number }) {
		const amountOfExistingEntries = this.data.participants.filter((participant) => participant === userId).length;
		if (amountOfExistingEntries + 1 > maxEntries) {
			throw new UserError({
				message: `Too many entries. You're allowed to have ${maxEntries}, but you already have ${amountOfExistingEntries}`,
				identifier: 'EntryLimit'
			});
		}

		this.data.participants.push(userId);
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
			prize: data.prize
		};
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
	expiresAt: Date;
};
