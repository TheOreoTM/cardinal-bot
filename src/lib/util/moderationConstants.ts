import type { AutomodRule } from '#lib/types';
import type { PrismaModerationType } from '@prisma/client';

export enum ModerationType {
	Warn = 'warn',
	Modnick = 'modnick',
	Mute = 'mute',
	Ban = 'ban',
	Kick = 'kick',
	Unmute = 'unmute',
	Unban = 'unban',
	Unwarn = 'unwarn',
	AfkReset = 'afkreset',
	AfkClear = 'afkclear'
}

export type ModerationActionType = PrismaModerationType;

export const AutomodRules: ReadonlyArray<{ readableName: string; dbValue: AutomodRule }> = [
	{
		dbValue: 'bannedWords',
		readableName: 'Banned Words'
	},
	{
		dbValue: 'capitalization',
		readableName: 'Capitalization'
	},
	{
		dbValue: 'inviteLinks',
		readableName: 'Invite Links'
	},
	{
		dbValue: 'linkCooldown',
		readableName: 'Link Cooldown'
	},
	{
		dbValue: 'links',
		readableName: 'Links'
	},
	{
		dbValue: 'massMention',
		readableName: 'Mass Mention'
	},
	{
		dbValue: 'newLines',
		readableName: 'New Lines'
	},
	{
		dbValue: 'spam',
		readableName: 'Fast Spam'
	},
	{
		dbValue: 'stickers',
		readableName: 'Stickers'
	}
];
