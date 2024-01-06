import { GuildSettings } from '#lib/structures';
import { CardinalEvents } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import type { Guild } from 'discord.js';

@ApplyOptions<Listener.Options>({
	event: CardinalEvents.GuildCreate
})
export class UserEvent extends Listener {
	public override async run(guild: Guild) {
		await guild.members.fetch();

		guild.settings = new GuildSettings(guild);
		await this.container.client.guilds.fetch();
	}
}
