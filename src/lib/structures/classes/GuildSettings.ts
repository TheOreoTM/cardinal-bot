import type { Guild } from 'discord.js';
import { ChannelConfig, RestrictionManager, RoleConfig } from '#lib/structures';
import type { Guild as PrismaGuild } from '@prisma/client';
import { container } from '@sapphire/pieces';
import { AutomodConfig } from './AutomodConfig';

export class GuildSettings {
	public roles: RoleConfig;
	public channels: ChannelConfig;
	public restrictions: RestrictionManager;
	public automod: AutomodConfig;
	private guildData: PrismaGuild | null = null;

	public constructor(private readonly guild: Guild) {
		this.roles = new RoleConfig(this.guild);
		this.channels = new ChannelConfig(this.guild);
		this.restrictions = new RestrictionManager(this.guild);
		this.automod = new AutomodConfig(this.guild);

		this.init();
	}

	private async init() {
		const data = await container.db.guild.findUnique({
			where: {
				guildId: this.guild.id
			}
		});

		this.guildData = data;
	}

	get createSuggestionThread() {
		return this.guildData?.suggestionCreateThread ? this.guildData.suggestionCreateThread : false;
	}
}
