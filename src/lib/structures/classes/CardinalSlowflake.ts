import { CardinalEpoch } from '#utils/constants';
import { Snowflake } from '@sapphire/snowflake';
import randomatic from 'randomatic';
import { uuid } from 'uuidv4';

export class CardinalIndexBuilder {
	constructor() {}

	public generateSnowflake() {
		return `${new Snowflake(CardinalEpoch).generate()}`;
	}

	public deconstructSnowflake(snowflake: string) {
		return new Snowflake(CardinalEpoch).deconstruct(snowflake);
	}

	public generateTag(length = 8) {
		return randomatic('Aa0', length);
	}

	public generateUuid() {
		return uuid();
	}
}
