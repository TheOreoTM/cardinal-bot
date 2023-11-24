import type { AutomodRule } from '#lib/types/Data';
import { container } from '@sapphire/pieces';
import { Collection, type Snowflake } from 'discord.js';

export class InfractionManager {
	private static instance: InfractionManager;
	private infractionCollection: Collection<`${Snowflake}-${AutomodRule}`, number> = new Collection();
	private constructor() {}

	public addHeat(userId: Snowflake, rule: AutomodRule, amount: number, duration: number) {
		const currentHeat = this.infractionCollection.get(`${userId}-${rule}`) ?? 0;

		this.infractionCollection.set(`${userId}-${rule}`, currentHeat + amount);

		container.tasks.create('RemoveInfractionTask', { userId, amount, duration });
	}

	public removeHeat(userId: Snowflake, rule: AutomodRule, amount: number) {
		const currentHeat = this.infractionCollection.get(`${userId}-${rule}`) ?? 0;

		if (currentHeat === 0) return;

		this.infractionCollection.set(`${userId}-${rule}`, currentHeat - amount);
	}

	public setHeat(userId: Snowflake, rule: AutomodRule, amount: number) {
		this.infractionCollection.set(`${userId}-${rule}`, amount);
	}

	public getHeat(userId: Snowflake, rule: AutomodRule) {
		return this.infractionCollection.get(`${userId}-${rule}`) ?? 0;
	}

	public static getInstance(): InfractionManager {
		return this.instance || (this.instance = new InfractionManager());
	}
}
