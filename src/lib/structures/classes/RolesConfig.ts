import { container } from '@sapphire/framework';
import type { Guild } from 'discord.js';

export class RoleConfig {
	public constructor(private readonly guild: Guild) {
		this.guild = guild;
	}

	public get admins() {
		return async () => {
			const data = await container.db.guild.findUnique({ where: { guildId: this.guild.id } });
			return data?.admin ?? '0';
		};
	}

	public get staffs() {
		return async () => {
			const data = await container.db.guild.findUnique({ where: { guildId: this.guild.id } });
			return data?.staff ?? '0';
		};
	}

	public get moderators() {
		return async () => {
			const data = await container.db.guild.findUnique({ where: { guildId: this.guild.id } });
			return data?.moderator ?? '0';
		};
	}

	public get eventManagers() {
		return async () => {
			const data = await container.db.guild.findUnique({ where: { guildId: this.guild.id } });
			return data?.eventManager ?? '0';
		};
	}
}
