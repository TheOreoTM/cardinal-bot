import { hasAtLeastOneKeyInMap } from '@sapphire/utilities';
import { GuildMember, PermissionFlagsBits } from 'discord.js';
import { BotOwner } from '#constants';

// TODO: Make these functions not async

export async function isModerator(member: GuildMember) {
	return isGuildOwner(member) || (await checkModerator(member)) || (await checkAdministrator(member));
}

export async function isAdmin(member: GuildMember) {
	return isGuildOwner(member) || (await checkAdministrator(member));
}

export function isGuildOwner(member: GuildMember) {
	return member.id === member.guild.ownerId;
}

export function isOwner(member: GuildMember) {
	return BotOwner.includes(member.id);
}

async function checkModerator(member: GuildMember) {
	const role = await member.guild.settings.roles.moderators();
	return role === '0' ? member.permissions.has(PermissionFlagsBits.BanMembers) : hasAtLeastOneKeyInMap(member.roles.cache, [role]);
}

async function checkAdministrator(member: GuildMember) {
	const role = await member.guild.settings.roles.admins();
	return role === '0' ? member.permissions.has(PermissionFlagsBits.BanMembers) : hasAtLeastOneKeyInMap(member.roles.cache, [role]);
}
