import { RestrictionAction } from '#lib/types';
import { container } from '@sapphire/pieces';
import { hasAtLeastOneKeyInMap } from '@sapphire/utilities';
import { GuildMember, type Collection, type Guild, Role, User } from 'discord.js';

export class RestrictionManager {
	public constructor(public readonly guild: Guild) {
		this.guild = guild;
	}

	public async findRestriction(commandName: string) {
		const restriction = await container.db.commandRestriction.findFirst({
			where: {
				id: `${this.guild.id}-${commandName}`
			}
		});

		if (!restriction) {
			return null;
		}

		return restriction;
	}

	public async checkMemberAllowed(commandName: string, memberId: string) {
		const restriction = await this.findRestriction(commandName);
		if (!restriction) return true; // No restriction, allow by default

		const blackListedMembersSet = new Set(restriction.blackListedMembers);
		const whiteListedMembersSet = new Set(restriction.whiteListedMembers);

		if (blackListedMembersSet.has(memberId)) {
			return false; // Member is in the blacklist, deny
		}

		if (whiteListedMembersSet.size === 0) {
			return true; // No whitelist restriction, allow by default
		}

		if (whiteListedMembersSet.has(memberId)) {
			return true; // Member is in the whitelist, allow
		}

		return false; // Member not in whitelist, deny
	}

	public async checkRoleAllowed(commandName: string, roleMap: Collection<string, Role>) {
		const restrictionData = await this.findRestriction(commandName);
		if (!restrictionData) return true; // No restrcion, allow

		const hasWhitelistedRole = hasAtLeastOneKeyInMap(roleMap, restrictionData.whiteListedRoles);
		const hasBlacklistedRole = hasAtLeastOneKeyInMap(roleMap, restrictionData.blackListedRoles);

		if (hasBlacklistedRole) return false; // One or more roles are in blacklist, deny
		if (hasWhitelistedRole) return true; // One or more roles are in whitelist, allow

		return false; // None of the roles in whtelist, deny
	}

	public async checkChannelAllowed(commandName: string, channelId: string) {
		const restriction = await this.findRestriction(commandName);
		if (!restriction) return true; // No restriction, allow by default

		const blackListedChannelsSet = new Set(restriction.blackListedChannels);
		const whiteListedChannelsSet = new Set(restriction.whiteListedChannels);

		if (blackListedChannelsSet.has(channelId)) {
			return false; // Channel is in the blacklist, deny
		}

		if (whiteListedChannelsSet.size === 0) {
			return true; // No whitelist restriction, allow by default
		}

		if (whiteListedChannelsSet.has(channelId)) {
			return true; // Channel is in the whitelist, allow
		}

		return false; // Channel not in whitelist, deny
	}

	public async add(target: GuildMember | User | Role, commandName: string, action: RestrictionAction) {
		const data: CommandRestrictionCreateInput = { id: `${this.guild.id}-${commandName}` };
		const previous = (await this.findRestriction(commandName)) ?? data;

		const whitelistedMembersSet = new Set(previous.whiteListedMembers);
		const whitelistedRolesSet = new Set(previous.whiteListedRoles);
		const blacklistedMembersSet = new Set(previous.blackListedMembers);
		const blacklistedRolesSet = new Set(previous.blackListedRoles);

		if (action === RestrictionAction.Allow) {
			// Add whitelist and remove blacklist

			target instanceof (GuildMember || User) ? whitelistedMembersSet.add(target.id) : whitelistedRolesSet.add(target.id);
			target instanceof (GuildMember || User) ? blacklistedMembersSet.delete(target.id) : blacklistedRolesSet.delete(target.id);
		}

		if (action === RestrictionAction.Deny) {
			// Add blacklist and remove whitelist

			target instanceof (GuildMember || User) ? blacklistedMembersSet.add(target.id) : blacklistedRolesSet.add(target.id);
			target instanceof (GuildMember || User) ? whitelistedMembersSet.delete(target.id) : whitelistedRolesSet.delete(target.id);
		}

		data.blackListedMembers = Array.from(blacklistedMembersSet);
		data.blackListedRoles = Array.from(blacklistedRolesSet);
		data.whiteListedMembers = Array.from(whitelistedMembersSet);
		data.whiteListedMembers = Array.from(whitelistedMembersSet);

		try {
			await container.db.commandRestriction.upsert({
				where: {
					id: `${this.guild.id}-${commandName}`
				},
				create: data,
				update: data
			});

			return true;
		} catch (error) {
			return false;
		}
	}

	public async remove(target: GuildMember | User | Role, commandName: string, action: RestrictionAction) {
		const data: CommandRestrictionCreateInput = { id: `${this.guild.id}-${commandName}` };
		const previous = (await this.findRestriction(commandName)) ?? data;

		const whitelistedMembersSet = new Set(previous.whiteListedMembers);
		const whitelistedRolesSet = new Set(previous.whiteListedRoles);
		const blacklistedMembersSet = new Set(previous.blackListedMembers);
		const blacklistedRolesSet = new Set(previous.blackListedRoles);

		if (action === RestrictionAction.Allow) {
			// Add whitelist and remove blacklist

			target instanceof (GuildMember || User) ? whitelistedMembersSet.delete(target.id) : whitelistedRolesSet.delete(target.id);
		}

		if (action === RestrictionAction.Deny) {
			// Add blacklist and remove whitelist

			target instanceof (GuildMember || User) ? blacklistedMembersSet.delete(target.id) : blacklistedRolesSet.delete(target.id);
		}

		data.blackListedMembers = Array.from(blacklistedMembersSet);
		data.blackListedRoles = Array.from(blacklistedRolesSet);
		data.whiteListedMembers = Array.from(whitelistedMembersSet);
		data.whiteListedMembers = Array.from(whitelistedMembersSet);

		try {
			await container.db.commandRestriction.upsert({
				where: {
					id: `${this.guild.id}-${commandName}`
				},
				create: data,
				update: data
			});

			return true;
		} catch (error) {
			return false;
		}
	}

	public async delete(commandName: string) {
		try {
			await container.db.commandRestriction.delete({
				where: {
					id: `${this.guild.id}-${commandName}`
				}
			});
		} catch (ignored) {}
	}
}

interface CommandRestrictionCreateInput {
	id: string;
	disabled?: boolean | undefined;
	whiteListedMembers?: string[] | undefined;
	whiteListedRoles?: string[] | undefined;
	whiteListedChannels?: string[] | undefined;
	blackListedMembers?: string[] | undefined;
	blackListedRoles?: string[] | undefined;
	blackListedChannels?: string[] | undefined;
}
