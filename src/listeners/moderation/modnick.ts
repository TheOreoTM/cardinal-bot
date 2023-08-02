import { CardinalEmbedBuilder } from '#lib/structures';
import { CardinalEvents } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import { ButtonLimits } from '@sapphire/discord.js-utilities';
import { Listener } from '@sapphire/framework';
import { ActionRowBuilder, AuditLogEvent, ButtonBuilder, ButtonStyle, type GuildMember } from 'discord.js';

@ApplyOptions<Listener.Options>({
	event: CardinalEvents.GuildMemberUpdate
})
export class UserEvent extends Listener {
	public override async run(oldMember: GuildMember, newMember: GuildMember) {
		if (oldMember.partial) oldMember = await oldMember.fetch();
		if (newMember.partial) newMember = await newMember.fetch();

		const conditions =
			(oldMember.nickname && !newMember.nickname) || // * Member removed nickname
			(!oldMember.nickname && newMember.nickname) || // * Member added Nickname
			(oldMember.nickname && newMember.nickname && oldMember.nickname !== newMember.nickname); // * Member changed nickname

		if (!conditions) return;

		const logs = await oldMember.guild
			.fetchAuditLogs({
				type: AuditLogEvent.MemberUpdate,
				limit: 1
			})
			.catch(() => null);

		const entry = logs?.entries.first();

		if (!logs || !entry) return;

		if (entry.executor?.id !== entry.target?.id) return;

		const modnickData = await this.container.db.modnick.findUnique({ where: { memberId: oldMember.id } });
		if (!modnickData) return;

		if (!modnickData.frozen) return;

		try {
			oldMember.setNickname(modnickData.moderatedNickname + ' ❄️', 'Frozen Nickname');
			const sentFromButton = new ButtonBuilder()
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(true)
				.setLabel(`Sent from ${oldMember.guild.name.slice(0, ButtonLimits.MaximumLabelCharacters - 'sent from'.length)}`)
				.setCustomId(`sentFrom-${oldMember.guild.id}`);
			await newMember.send({
				components: [new ActionRowBuilder<ButtonBuilder>().addComponents(sentFromButton)],
				embeds: [
					new CardinalEmbedBuilder()
						.setStyle('info')
						.setDescription(
							`You aren't allowed to change your nickname if it's frozen (has a snowflake). If you think this is a mistake please contact a moderator.`
						)
				]
			});
		} catch (error) {
			// noop
		}
	}
}
