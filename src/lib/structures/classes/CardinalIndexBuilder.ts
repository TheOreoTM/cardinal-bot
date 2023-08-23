import { CardinalEpoch } from '#utils/constants';
import { container } from '@sapphire/pieces';
import { Snowflake } from '@sapphire/snowflake';
import randomatic from 'randomatic';
import { v4 } from 'uuid';

export class CardinalIndexBuilder {
	constructor() {}

	public generateSnowflake() {
		return `${new Snowflake(CardinalEpoch).generate()}`;
	}

	public deconstructSnowflake(snowflake: string) {
		return new Snowflake(CardinalEpoch).deconstruct(snowflake);
	}

	public generateTag(length = 8, tag = true) {
		return tag ? '#' + randomatic('Aa0', length) : randomatic('Aa0', length);
	}

	public generateUuid() {
		return v4();
	}

	public async suggestionId(guildId: string) {
		const suggestionAmount = await container.db.suggestion.count({
			where: {
				guildId
			}
		});

		return suggestionAmount + 1;
	}

	public async modlogId(guildId: string) {
		const modlog = await container.db.modlog.findFirst({
			where: {
				guildId
			},
			orderBy: {
				id: 'desc'
			}
		});

		return modlog ? modlog.id + 1 : 1;
	}
}
