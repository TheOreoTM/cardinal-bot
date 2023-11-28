import type { AutomodRule, Automod } from '#lib/types/Data';
import type { ModerationActionType } from '#utils/moderationConstants';
import { addUniqueToArray, removeFromArray } from '#utils/utils';
import type { AutomodBannedWords } from '@prisma/client';
import { container } from '@sapphire/pieces';
import type { Guild, Snowflake } from 'discord.js';

export class AutomodConfig {
	public constructor(private readonly guild: Guild) {
		this.guild = guild;
	}

	public async removeBannedWord(word: string, type: 'exact' | 'wildcard') {
		const currentData = await this.getSetting<AutomodBannedWords>('bannedWords');
		if (!currentData) return this;
		const currentWords = currentData[type];
		if (!currentWords) return this;

		const newWords = removeFromArray(currentWords, word);

		await container.db.guild.update({
			where: {
				guildId: this.guild.id
			},
			data: {
				bannedWords: {
					upsert: {
						create: {
							enabled: false,
							guildId: this.guild.id
						},
						update: {
							[type]: {
								set: newWords
							}
						},
						where: {
							guildId: this.guild.id
						}
					}
				}
			}
		});

		return this;
	}

	public async addBannedWord(word: string, type: 'exact' | 'wildcard') {
		let toAdd: string[] = [];
		const currentData = await this.getSetting<AutomodBannedWords>('bannedWords');
		if (!currentData) toAdd = [word];
		const currentWords = currentData?.[type];
		if (!currentWords) toAdd = [word];
		if (toAdd.length === 0 && currentWords) {
			toAdd = addUniqueToArray(currentWords, word);
		}

		await container.db.guild.update({
			where: {
				guildId: this.guild.id
			},
			data: {
				bannedWords: {
					upsert: {
						create: {
							enabled: false,
							guildId: this.guild.id
						},
						update: {
							[type]: {
								set: toAdd
							}
						},
						where: {
							guildId: this.guild.id
						}
					}
				}
			}
		});

		return this;
	}

	public async setAutomuteDuration(rule: AutomodRule, amountMs: number) {
		await container.db.guild.update({
			where: {
				guildId: this.guild.id
			},
			data: {
				[rule]: {
					upsert: {
						create: {
							enabled: false,
							guildId: this.guild.id
						},
						update: {
							automuteDuration: amountMs
						},
						where: {
							guildId: this.guild.id
						}
					}
				}
			}
		});
	}

	public async setAutomuteAfter(rule: AutomodRule, amount: number) {
		await container.db.guild.update({
			where: {
				guildId: this.guild.id
			},
			data: {
				[rule]: {
					upsert: {
						create: {
							enabled: false,
							guildId: this.guild.id
						},
						update: {
							automuteAfter: amount
						},
						where: {
							guildId: this.guild.id
						}
					}
				}
			}
		});
	}

	public async addIgnoredChannel(rule: AutomodRule, channel: Snowflake) {
		let toAdd: string[] = [];
		const currentData = await this.getSetting(rule);
		if (!currentData) toAdd = [channel];
		const currentChannels = currentData?.actions;
		if (!currentChannels) toAdd = [channel];
		if (toAdd.length === 0 && currentChannels) {
			toAdd = addUniqueToArray(currentChannels, channel);
		}

		await container.db.guild.update({
			where: {
				guildId: this.guild.id
			},
			data: {
				[rule]: {
					upsert: {
						create: {
							enabled: false,
							guildId: this.guild.id
						},
						update: {
							ignoredChannels: {
								set: toAdd
							}
						},
						where: {
							guildId: this.guild.id
						}
					}
				}
			}
		});

		return this;
	}

	public async removeIgnoredChannel(rule: AutomodRule, channel: Snowflake) {
		const currentData = await this.getSetting(rule);
		if (!currentData) return this;
		const currentChannels = currentData.ignoredChannels;
		if (!currentChannels) return this;

		const newRoles = removeFromArray(currentChannels, channel);

		await container.db.guild.update({
			where: {
				guildId: this.guild.id
			},
			data: {
				[rule]: {
					upsert: {
						create: {
							enabled: false,
							guildId: this.guild.id
						},
						update: {
							ignoredChannels: newRoles
						},
						where: {
							guildId: this.guild.id
						}
					}
				}
			}
		});

		return this;
	}

	public async addIgnoredRole(rule: AutomodRule, role: Snowflake) {
		let toAdd: string[] = [];
		const currentData = await this.getSetting(rule);
		if (!currentData) toAdd = [role];
		const currentRoles = currentData?.ignoredRoles;
		if (!currentRoles) toAdd = [role];
		if (toAdd.length === 0 && currentRoles) {
			toAdd = addUniqueToArray(currentRoles, role);
		}

		await container.db.guild.update({
			where: {
				guildId: this.guild.id
			},
			data: {
				[rule]: {
					upsert: {
						create: {
							enabled: false,
							guildId: this.guild.id
						},
						update: {
							ignoredRoles: {
								set: toAdd
							}
						},
						where: {
							guildId: this.guild.id
						}
					}
				}
			}
		});

		return this;
	}

	public async removeIgnoredRole(rule: AutomodRule, role: Snowflake) {
		const currentData = await this.getSetting(rule);
		if (!currentData) return this;
		const currentRoles = currentData.ignoredRoles;
		if (!currentRoles) return this;

		const newRoles = removeFromArray(currentRoles, role);

		await container.db.guild.update({
			where: {
				guildId: this.guild.id
			},
			data: {
				[rule]: {
					upsert: {
						create: {
							enabled: false,
							guildId: this.guild.id
						},
						update: {
							ignoredRoles: newRoles
						},
						where: {
							guildId: this.guild.id
						}
					}
				}
			}
		});

		return this;
	}

	public async addAffectedChannel(rule: AutomodRule, channel: Snowflake) {
		let toAdd: string[] = [];
		const currentData = await this.getSetting(rule);
		if (!currentData) toAdd = [channel];
		const currentChannel = currentData?.affectedChannels;
		if (!currentChannel) toAdd = [channel];
		if (toAdd.length === 0 && currentChannel) {
			toAdd = addUniqueToArray(currentChannel, channel);
		}

		await container.db.guild.update({
			where: {
				guildId: this.guild.id
			},
			data: {
				[rule]: {
					upsert: {
						create: {
							enabled: false,
							guildId: this.guild.id
						},
						update: {
							affectedChannels: {
								set: toAdd
							}
						},
						where: {
							guildId: this.guild.id
						}
					}
				}
			}
		});

		return this;
	}

	public async removeAffectedChannel(rule: AutomodRule, channel: Snowflake) {
		const currentData = await this.getSetting(rule);
		if (!currentData) return this;
		const currentChannels = currentData.affectedChannels;
		if (!currentChannels) return this;

		const newRoles = removeFromArray(currentChannels, channel);

		await container.db.guild.update({
			where: {
				guildId: this.guild.id
			},
			data: {
				[rule]: {
					upsert: {
						create: {
							enabled: false,
							guildId: this.guild.id
						},
						update: {
							affectedChannels: newRoles
						},
						where: {
							guildId: this.guild.id
						}
					}
				}
			}
		});

		return this;
	}

	public async addAffectedRole(rule: AutomodRule, role: Snowflake) {
		let toAdd: string[] = [];
		const currentData = await this.getSetting(rule);
		if (!currentData) toAdd = [role];
		const currentRoles = currentData?.affectedRoles;
		if (!currentRoles) toAdd = [role];
		if (toAdd.length === 0 && currentRoles) {
			toAdd = addUniqueToArray(currentRoles, role);
		}

		await container.db.guild.update({
			where: {
				guildId: this.guild.id
			},
			data: {
				[rule]: {
					upsert: {
						create: {
							enabled: false,
							guildId: this.guild.id
						},
						update: {
							affectedRoles: {
								set: toAdd
							}
						},
						where: {
							guildId: this.guild.id
						}
					}
				}
			}
		});

		return this;
	}

	public async removeAffectedRole(rule: AutomodRule, role: Snowflake) {
		const currentData = await this.getSetting(rule);
		if (!currentData) return this;
		const currentRoles = currentData.affectedRoles;
		if (!currentRoles) return this;

		const newRoles = removeFromArray(currentRoles, role);

		await container.db.guild.update({
			where: {
				guildId: this.guild.id
			},
			data: {
				[rule]: {
					upsert: {
						create: {
							enabled: false,
							guildId: this.guild.id
						},
						update: {
							affectedRoles: newRoles
						},
						where: {
							guildId: this.guild.id
						}
					}
				}
			}
		});

		return this;
	}

	public async removeAction(rule: AutomodRule, action: ModerationActionType) {
		const currentData = await this.getSetting(rule);
		if (!currentData) return this;
		const currentActions = currentData.actions;
		if (!currentActions) return this;

		const newActions = removeFromArray(currentActions, action);

		await container.db.guild.update({
			where: {
				guildId: this.guild.id
			},
			data: {
				[rule]: {
					upsert: {
						create: {
							enabled: false,
							guildId: this.guild.id
						},
						update: {
							actions: newActions
						},
						where: {
							guildId: this.guild.id
						}
					}
				}
			}
		});

		return this;
	}

	public async addAction(rule: AutomodRule, action: ModerationActionType) {
		let toAdd: ModerationActionType[] = [];
		const currentData = await this.getSetting(rule);
		if (!currentData) toAdd = [action];
		const currentActions = currentData?.actions;
		if (!currentActions) toAdd = [action];
		if (toAdd.length === 0 && currentActions) {
			toAdd = addUniqueToArray(currentActions, action);
		}

		await container.db.guild.update({
			where: {
				guildId: this.guild.id
			},
			data: {
				[rule]: {
					upsert: {
						create: {
							enabled: false,
							guildId: this.guild.id,
							actions: [action]
						},
						update: {
							actions: {
								set: toAdd
							}
						},
						where: {
							guildId: this.guild.id
						}
					}
				}
			}
		});

		return this;
	}

	public async getSetting<T extends Automod>(rule: AutomodRule): Promise<T | null> {
		const data = await container.db.guild.findUnique({
			where: {
				guildId: this.guild.id
			},
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
		});

		if (!data) return null;
		const ruleData = data[rule];
		if (!ruleData) return null;

		return ruleData as T;
	}

	public async enableRule(rule: AutomodRule) {
		await container.db.guild.update({
			where: {
				guildId: this.guild.id
			},
			data: {
				[rule]: {
					upsert: {
						create: {
							guildId: this.guild.id,
							enabled: true
						},
						update: {
							enabled: true
						}
					}
				}
			}
		});
		return this;
	}

	public async disableRule(rule: AutomodRule) {
		await container.db.guild.update({
			where: {
				guildId: this.guild.id
			},
			data: {
				[rule]: {
					upsert: {
						create: {
							guildId: this.guild.id,
							enabled: false
						},
						update: {
							enabled: false
						}
					}
				}
			}
		});

		return this;
	}
}
