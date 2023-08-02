import { CardinalEvents, type GuildMessage } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { reply, send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<Listener.Options>({ event: CardinalEvents.MessageCreate })
export class UserEvent extends Listener {
	public override async run(message: GuildMessage) {
		if (!message.guild || message.author.bot) return;

		const user = message.member;

		const afkData = await this.container.db.afk.findUnique({
			where: {
				memberId_guildId: {
					guildId: message.guildId,
					memberId: user.id
				}
			}
		});

		if (afkData) {
			// Remove AFK
			await this.container.db.afk.delete({
				where: {
					memberId_guildId: {
						guildId: message.guildId,
						memberId: user.id
					}
				}
			});

			if (user.manageable) {
				user.setNickname(afkData.afkNick);
			}

			await reply(message, `Welcome back ${message.member}, I removed your AFK`);
		}

		const mentionedUsers = message.mentions.members;
		if (!mentionedUsers) return;

		mentionedUsers.forEach(async (user) => {
			const afkData = await this.container.db.afk.findUnique({
				where: {
					memberId_guildId: {
						guildId: message.guildId,
						memberId: user.id
					}
				}
			});

			if (!afkData) return;

			await send(message, `\`${afkData.afkNick}\` is AFK: ${afkData.afkMessage}`);
		});
	}
}
