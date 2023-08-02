import { CardinalEmbedBuilder, ModerationCommand, Modlog } from '#lib/structures';
import { ModerationType } from '#utils/moderationConstants';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import type { Snowflake } from 'discord.js';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Unban a member',
	name: 'unban',
	detailedDescription: {
		extendedHelp: 'Remove a ban from a member',
		usages: ['UserID Reason', 'UserID'],
		reminder: 'Only user IDs will work',
		examples: ['508552375397515285 sorry for that', '947780201973182525']
	}
})
export class unbanCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const target: Snowflake = await args.pick('snowflake').catch(() => '');

		const ban = await message.guild.bans.fetch(target);

		if (!ban) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('I cant find that ban')]
			});
		}

		const reason = await args.rest('string').catch(() => null);

		await message.guild.bans.remove(target).catch((err: Error) => {
			send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`${err.message}`)]
			});
		});

		let member = this.container.client.users.cache.get(target);
		if (!member) member = await this.container.client.users.fetch(target);
		if (member) {
			const modlog = new Modlog({ staff: message.member, member: member, type: ModerationType.Unban, length: null, reason: reason });
			await modlog.createUnban();
		}

		return send(message, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Unbanned \`${target}\``)]
		});
	}
}
