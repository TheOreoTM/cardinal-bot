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
