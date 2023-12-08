import type { GuildFeature } from 'discord-api-types/payloads/v10';
import type { Permissions } from 'discord-api-types/globals';
import type { LoginData } from '@sapphire/plugin-api';
import type { Guild, User } from 'discord.js';

export type IDiscordUser = Pick<User, 'avatar' | 'id' | 'username'>;

export type IDiscordGuild = Pick<Guild, 'icon' | 'id' | 'name'>;

export type FormattedGuild = Omit<IDiscordGuild, 'icon'> & {
	features: GuildFeature[];
	permissions: Permissions;
} & {
	icon: string | null;
	owner: boolean;
};

export type TransformedLoginData = LoginData & {
	user: IDiscordUser | null | undefined;
	guilds: FormattedGuild[] | null | undefined;
};
