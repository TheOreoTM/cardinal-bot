import type { Key } from '#lib/types';

// # Cache keys

export const baseCacheKey = (guildId: string): string => `cardinal:guilds:${guildId}`;

export const coreCacheKey = (guildId: string): Key => `${baseCacheKey(guildId)}:core` as Key;

export const moderationCacheKey = (guildId: string): Key => `${baseCacheKey(guildId)}:moderation` as Key;

const statsCacheKey = (guildId: string): Key => `${baseCacheKey(guildId)}:stats` as Key;
export const userStatsCacheKey = (guildId: string, userId: string): Key => `${statsCacheKey(guildId)}:user:${userId}` as Key;
export const channelStatsCacheKey = (guildId: string, userId: string): Key => `${statsCacheKey(guildId)}:channel:${userId}` as Key;
export const roleStatsCacheKey = (guildId: string, userId: string): Key => `${statsCacheKey(guildId)}:role:${userId}` as Key;
export const serverStatsCacheKey = (guildId: string): Key => `${statsCacheKey(guildId)}:server` as Key;
export const topStatsCacheKey = (guildId: string): Key => `${statsCacheKey(guildId)}:top` as Key;

// # Field Values

export const enum StatsCacheFields {
	Lookback = 'lookback',
	Daily = 'daily'
}
