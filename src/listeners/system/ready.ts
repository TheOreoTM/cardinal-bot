import { ApplyOptions } from '@sapphire/decorators';
import { Listener, Store } from '@sapphire/framework';
import { blue, gray, green, magenta, magentaBright, white, yellow } from 'colorette';
import { GuildSettings } from '#lib/structures';
import { CardinalClient } from '#lib/CardinalClient';
import { CardinalEvents } from '#lib/types';
const dev = process.env.NODE_ENV !== 'production';

@ApplyOptions<Listener.Options>({ event: CardinalEvents.ClientReady, once: true, enabled: true })
export class UserEvent extends Listener {
	private readonly style = dev ? yellow : blue;

	public async run(client: CardinalClient) {
		this.container.client = client;

		this.printBanner();
		this.printStoreDebugInformation();

		// Setup the different collections for guilds
		const guilds = client.guilds.cache;
		for (const guild of guilds.values()) {
			guild.settings = new GuildSettings(guild);
		}
	}

	private printBanner() {
		const success = green('+');

		const llc = dev ? magentaBright : white;
		const blc = dev ? magenta : blue;

		const line01 = llc(String.raw`    ______               ___             __`);
		const line02 = llc(String.raw`   / ____/___ __________/ (_)___  ____ _/ /`);
		const line03 = llc(String.raw`  / /   / __ '/ ___/ __  / / __ \/ __ '/ / `);
		const line04 = llc(String.raw` / /___/ /_/ / /  / /_/ / / / / / /_/ / /  `);
		const line05 = llc(String.raw` \____/\__,_/_/   \__,_/_/_/ /_/\__,_/_/   `);
		const line06 = llc(String.raw`                                           `);

		// Offset Pad
		const pad = ' '.repeat(7);

		console.log(
			String.raw`
${line01}
${line02}
${line03} ${pad}${blc('1.0.0')}
${line04} ${pad}[${success}] Gateway
${line05}${dev ? ` ${pad}${blc('<')}${llc('/')}${blc('>')} ${llc('DEVELOPMENT MODE')}` : ''}
${line06}
		`.trim()
		);
	}

	private printStoreDebugInformation() {
		const { client, logger } = this.container;
		const stores = [...client.stores.values()];
		const last = stores.pop()!;

		for (const store of stores) logger.info(this.styleStore(store, false));
		logger.info(this.styleStore(last, true));
	}

	private styleStore(store: Store<any>, last: boolean) {
		return gray(`${last ? '└─' : '├─'} Loaded ${this.style(store.size.toString().padEnd(3, ' '))} ${store.name}.`);
	}
}
