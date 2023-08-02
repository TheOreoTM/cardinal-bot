import { container } from '@sapphire/framework';
import type { Guild } from 'discord.js';

export class RoleConfig {
	public constructor(private readonly guild: Guild) {
		this.guild = guild;
	}

	public get mute() {
		return async () => {
			const data = await container.db.guild.findUnique({ where: { guildId: this.guild.id } });
			return data?.roleMuted ?? '0';
		};
	}

	public get admin() {
		return async () => {
			const data = await container.db.guild.findUnique({ where: { guildId: this.guild.id } });
			return data?.roleAdmin ?? '0';
		};
	}

	public get staff() {
		return async () => {
			const data = await container.db.guild.findUnique({ where: { guildId: this.guild.id } });
			return data?.roleStaff ?? '0';
		};
	}

	public get moderator() {
		return async () => {
			const data = await container.db.guild.findUnique({ where: { guildId: this.guild.id } });
			return data?.roleModerator ?? '0';
		};
	}

	public get trainee() {
		return async () => {
			const data = await container.db.guild.findUnique({ where: { guildId: this.guild.id } });
			return data?.roleTrainee ?? '0';
		};
	}
}
