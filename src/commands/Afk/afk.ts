import { CardinalCommand, CardinalEmbedBuilder } from '#lib/structures';
import { seconds } from '#utils/common';
import { sendTemporaryMessage } from '#utils/functions';
import { ApplyOptions } from '@sapphire/decorators';
import { GuildMemberLimits } from '@sapphire/discord.js-utilities';
import { BucketScope } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<CardinalCommand.Options>({
	description: 'Go AFK',
	name: 'afk',
	detailedDescription: {
		extendedHelp:
			"Mark yourself as Afk. The bot will change your nickname to indicate that you're afk and when you are pinged the bot will automatically tell users that you are afk",
		usages: ['AfkMessage', ''],
		examples: ['This chat too cringe', 'Oh no Sed is here'],
		explainedUsage: [['AfkMessage', 'The message that you want to show up when someone pings you']],
		reminder: 'You cannot use links in **AfkMessage**'
	},
	cooldownDelay: seconds(45),
	cooldownScope: BucketScope.User
})
export class afkCommand extends CardinalCommand {
	public async messageRun(message: CardinalCommand.Message, args: CardinalCommand.Args) {
		await args.repeat('url', { times: 50 }).catch(() => null); // remove urls from the message
		const isAfk = await this.container.db.afk.count({
			where: {
				memberId: message.member.id,
				guildId: message.guildId
			}
		});

		if (isAfk !== 0) {
			return sendTemporaryMessage(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('You are already AFK')],
				allowedMentions: {
					parse: ['users'],
					users: [message.author.id]
				}
			});
		}

		const afkMessage = await args.rest('string').catch(() => 'AFK');
		const afkNick = message.member.displayName;
		setTimeout(async () => {
			await this.container.db.afk.upsert({
				where: {
					memberId_guildId: {
						memberId: message.member.id,
						guildId: message.guildId
					}
				},
				update: {
					afkMessage,
					afkNick
				},
				create: {
					afkMessage,
					guildId: message.guildId,
					memberId: message.member.id,
					afkNick
				}
			});
		}, seconds(20));

		if (message.member.manageable) {
			message.member.setNickname(`[AFK] ${message.member.displayName.slice(0, GuildMemberLimits.MaximumDisplayNameLength - '[afk] '.length)}`);
		}

		return send(message, `${message.member} I set your AFK: ${afkMessage}`);
	}
}
