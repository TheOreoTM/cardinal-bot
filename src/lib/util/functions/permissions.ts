import { hasAtLeastOneKeyInMap } from '@sapphire/utilities';
import { GuildMember, PermissionFlagsBits } from 'discord.js';
import { BotOwner } from '#constants';

// TODO: Make these functions not async
// ? How????????

export async function isTrainee(member: GuildMember) {
	return (await isStaff(member)) || (await checkTrainee(member));
}

export async function isStaff(member: GuildMember) {
	return (await isModerator(member)) || (await checkStaff(member));
}

export async function isModerator(member: GuildMember) {
	return (await isAdmin(member)) || (await checkModerator(member));
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

async function checkTrainee(member: GuildMember) {
	const role = await member.guild.settings.roles.trainee();
	return role === '0' ? member.permissions.has(PermissionFlagsBits.BanMembers) : hasAtLeastOneKeyInMap(member.roles.cache, [role]);
}

async function checkStaff(member: GuildMember) {
	const role = await member.guild.settings.roles.staff();
	return role === '0' ? member.permissions.has(PermissionFlagsBits.BanMembers) : hasAtLeastOneKeyInMap(member.roles.cache, [role]);
}

async function checkModerator(member: GuildMember) {
	const role = await member.guild.settings.roles.moderator();
	return role === '0' ? member.permissions.has(PermissionFlagsBits.BanMembers) : hasAtLeastOneKeyInMap(member.roles.cache, [role]);
}

async function checkAdministrator(member: GuildMember) {
	if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
	const role = await member.guild.settings.roles.admin();
	return role === '0' ? member.permissions.has(PermissionFlagsBits.Administrator) : hasAtLeastOneKeyInMap(member.roles.cache, [role]);
}

export async function canManage(member: GuildMember, target: GuildMember) {
	const me = member.guild.members.me ?? (await member.guild.members.fetchMe());

	if (member.id === me.id) return false;

	if (target.roles.highest.position >= me.roles.highest.position) return false;

	if (member.id === target.id) return false;

	if (member.roles.highest.position <= target.roles.highest.position) return false;

	if (await isTrainee(target)) return false;

	return true;
}
