import type { Guild } from 'discord.js';
import { RoleConfig } from '#lib/structures';

export class GuildSettings {
	public roles: RoleConfig;

	public constructor(private readonly guild: Guild) {
		this.roles = new RoleConfig(this.guild);
	}
}
