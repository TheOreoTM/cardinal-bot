import { CardinalColors, CardinalEmojis } from '#constants';
import { CardinalEmbedStyles } from '#lib/types';
import { EmbedBuilder, type APIEmbed, type EmbedData } from 'discord.js';

export class CardinalEmbedBuilder extends EmbedBuilder {
	readonly style: CardinalEmbedStyle = CardinalEmbedStyles.Default;

	public constructor(data?: EmbedData | APIEmbed) {
		super(data);
	}

	setStyle(style: CardinalEmbedStyle): this {
		switch (style) {
			case 'default':
			case 'loading':
				super.setColor(CardinalColors.Default);
				break;
			case 'success':
				super.setColor(CardinalColors.Success);
				break;
			case 'fail':
				super.setColor(CardinalColors.Fail);
				break;
			default:
				super.setColor(CardinalColors.Default);
				break;
		}
		return this;
	}

	setDescription(description: string | null): this {
		switch (this.data.color) {
			case CardinalColors.Default:
				super.setDescription(description);
				break;
			case CardinalColors.Success:
				return super.setDescription(`***${CardinalEmojis.Success} ${description}***`);
			case CardinalColors.Fail:
				super.setDescription(`${CardinalEmojis.Fail} ${description}`);
				break;
			case CardinalColors.Default:
				super.setDescription(`${CardinalEmojis.Info} ${description}`);
				break;
			case CardinalColors.Default:
				super.setDescription(`${CardinalEmojis.Loading} ${description}`);
				break;
			default:
				super.setDescription(description);
				break;
		}
		return this;
	}
}

type CardinalEmbedStyle = 'default' | 'info' | 'success' | 'fail' | 'loading';
