import { ModerationCommand } from '#lib/structures';
import type { GuildMessage, InteractionOrMessage, InteractionOrMessageCommand } from '#lib/types';
import { isAdmin } from '#utils/functions';
import { ApplyOptions } from '@sapphire/decorators';
import { Precondition, type MessageCommand, type ChatInputCommand, type ContextMenuCommand } from '@sapphire/framework';
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message } from 'discord.js';

@ApplyOptions<Precondition.Options>({
	position: 1,
	enabled: false
})
export class UserPrecondition extends Precondition {
	public override messageRun(message: Message, command: MessageCommand) {
		if (!message.guild) return this.ok();
		return this.check(message as GuildMessage, command);
	}

	public override chatInputRun(interaction: ChatInputCommandInteraction<'cached'>, command: ChatInputCommand) {
		return this.check(interaction, command);
	}

	public override contextMenuRun(interaction: ContextMenuCommandInteraction<'cached'>, command: ContextMenuCommand) {
		return this.check(interaction, command);
	}

	private async check(interactionOrMessage: InteractionOrMessage, command: InteractionOrMessageCommand | ModerationCommand) {
		const member = interactionOrMessage.member;
		const guild = interactionOrMessage.guild;
		const channel = interactionOrMessage.channel;

		if (!guild || !member) {
			throw this.error({
				message: 'You can only use my commands in a guild'
			});
		}

		const checkAdmin = await isAdmin(member);

		if (checkAdmin) return this.ok();

		if (!channel) return this.ok();

		const settings = guild.settings;
		if (!settings) return this.ok();

		const memberIsAllowed = await settings.restrictions.checkMemberAllowed(command.name, member.id);
		const channelIsAllowed = await settings.restrictions.checkChannelAllowed(command.name, channel.id);
		const roleIsAllowed = await settings.restrictions.checkRoleAllowed(command.name, member.roles.cache);

		if (memberIsAllowed === false || channelIsAllowed === false || roleIsAllowed === false)
			return this.error({
				context: { silent: true }
			});

		if (memberIsAllowed === null) return this.ok();
		return this.ok();

		// const restrictionData = await this.container.db.commandRestriction.findUnique({
		// 	where: {
		// 		id: `${guild.id}-${commandName}`
		// 	}
		// });

		// if (!restrictionData) return this.ok();

		// if (restrictionData.disabled) {
		// 	return this.error({
		// 		message: `This command is disabled`,
		// 		identifier: 'DisabledCommand'
		// 	});
		// }

		// const memberRolesMap = member.roles.cache;
		// const channelId = channel.id;

		// const hasWhitelistedRole = hasAtLeastOneKeyInMap(memberRolesMap, restrictionData.whiteListedRoles);
		// const isWhitelistedChannel = restrictionData.whiteListedChannels.includes(channelId);

		// if (hasWhitelistedRole || isWhitelistedChannel) return this.ok();

		// const hasBlacklistedRole = hasAtLeastOneKeyInMap(memberRolesMap, restrictionData.blackListedRoles);
		// const isBlacklistedChannel = restrictionData.blackListedChannels.includes(channelId);

		// if (hasBlacklistedRole || isBlacklistedChannel) {
		// 	return this.error({ context: { silent: true } });
		// }

		// return this.ok();
	}
}
