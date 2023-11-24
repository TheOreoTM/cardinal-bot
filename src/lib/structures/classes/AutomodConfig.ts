import type { AutomodRule, Automod } from '#lib/types/Data';
import { container } from '@sapphire/pieces';
import type { Guild } from 'discord.js';

export class AutomodConfig {
	public constructor(private readonly guild: Guild) {
		this.guild = guild;
	}

	public async getSetting<T extends Automod>(rule: AutomodRule): Promise<T | null> {
		const data = await container.db.guild.findUnique({
			where: {
				guildId: this.guild.id
			},
			select: {
				automodSettings: {
					select: {
						bannedWords: true,
						capitalization: true,
						inviteLinks: true,
						linkCooldown: true,
						links: true,
						massMention: true,
						newLines: true,
						spam: true,
						stickers: true
					}
				}
			}
		});

		if (!data) return null;
		const automodSettings = data.automodSettings;
		if (!automodSettings) return null;
		const ruleData = automodSettings[rule];
		if (!ruleData) return null;

		return ruleData as T;
	}

	public async enableRule(rule: AutomodRule) {
		await container.db.guildAutomod.update({
			where: {
				guildId: this.guild.id
			},
			data: {
				[rule]: {
					upsert: {
						create: {
							enabled: true
						},
						update: {
							enabled: true
						}
					}
				}
			}
		});
	}

	public async disableRule(rule: AutomodRule) {
		await container.db.guildAutomod.update({
			where: {
				guildId: this.guild.id
			},
			data: {
				[rule]: {
					upsert: {
						create: {
							enabled: false
						},
						update: {
							enabled: false
						}
					}
				}
			}
		});
	}
}
