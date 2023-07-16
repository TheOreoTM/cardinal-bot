import { CardinalColors, CardinalEmojis } from '#constants';
import { CardinalEmbedStyles } from '#lib/types';
import { type EmbedData, type APIEmbed, EmbedBuilder } from 'discord.js';

export class CardinalEmbedBuilder extends EmbedBuilder {
	readonly style: CardinalEmbedStyle = CardinalEmbedStyles.Default;
	public constructor(data?: EmbedData | APIEmbed) {
		super(data);
	}

	public setDescription(description: string | null): this {
		switch (this.style) {
			case 'default':
				super.setDescription(description);
				break;
			case 'success':
				super.setDescription(`***${CardinalEmojis.Success} ${description}***`);
				break;
			case 'fail':
				super.setDescription(`${CardinalEmojis.Fail} ${description}`);
				break;
			case 'info':
				super.setDescription(`${CardinalEmojis.Info} ${description}`);
				break;
			case 'loading':
				super.setDescription(`${CardinalEmojis.Loading} ${description}`);
				break;
			default:
				this.setDescription(description);
				break;
		}
		return this;
	}

	public setStyle(style: CardinalEmbedStyle): this {
		switch (style) {
			case 'default':
			case 'loading':
			case 'info':
				super.setColor(CardinalColors.Default);
				break;
			case 'success':
				super.setColor(CardinalColors.Success);
				break;
			case 'fail':
				super.setColor(CardinalColors.Fail);
				break;
			case 'info':
				break;
			default:
				super.setColor(CardinalColors.Default);
				break;
		}
		return this;
	}
}

type CardinalEmbedStyle = 'default' | 'info' | 'success' | 'fail' | 'loading';
