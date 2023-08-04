import type { Guild } from 'discord.js';
import { ChannelConfig, RoleConfig } from '#lib/structures';

export class GuildSettings {
	public roles: RoleConfig;
	public channels: ChannelConfig;

	public constructor(private readonly guild: Guild) {
		this.roles = new RoleConfig(this.guild);
		this.channels = new ChannelConfig(this.guild);
	}
}
