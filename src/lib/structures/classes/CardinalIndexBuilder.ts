import { CardinalEpoch } from '#utils/constants';
import { container } from '@sapphire/pieces';
import { Snowflake } from '@sapphire/snowflake';
import randomatic from 'randomatic';
import { v4 } from 'uuid';

export class CardinalIndexBuilder {
	constructor() {}

	public static generateSnowflake() {
		return `${new Snowflake(CardinalEpoch).generate()}`;
	}

	public static deconstructSnowflake(snowflake: string) {
		return new Snowflake(CardinalEpoch).deconstruct(snowflake);
	}

	public static generateTag(length = 8, tag = true) {
		return tag ? '#' + randomatic('Aa0', length) : randomatic('Aa0', length);
	}

	public static generateUuid() {
		return v4();
	}

	public static async suggestionId(guildId: string) {
		const suggestionAmount = await container.db.suggestion.count({
			where: {
				guildId
			}
		});

		return suggestionAmount + 1;
	}

	public static async modlogId(guildId: string) {
		const modlog = await container.db.modlog.count({
			where: {
				guildId
			}
		});

		return modlog + 1;
	}

	public static async noteId(userId: string, guildId: string) {
		const note = await container.db.note.count({
			where: {
				guildId,
				userId
			}
		});
		return note + 1;
	}
}
