import type { Guild } from 'discord.js';
import { RoleConfig } from './RolesConfig';

export class GuildSettings {
	public roles: RoleConfig;

	public constructor(private readonly guild: Guild) {
		this.roles = new RoleConfig(this.guild);
	}
}
