import { authenticated } from '#lib/api/util';
import { CardinalColors, CardinalEmojis } from '#utils/constants';
import { ApplyOptions } from '@sapphire/decorators';
import { methods, Route, type ApiRequest, type ApiResponse, HttpCodes } from '@sapphire/plugin-api';
import { s } from '@sapphire/shapeshift';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, type TextChannel } from 'discord.js';

@ApplyOptions<Route.Options>({
	name: 'postAppeal',
	route: 'postAppeal'
})
export class UserRoute extends Route {
	@authenticated()
	public async [methods.POST](request: ApiRequest, response: ApiResponse) {
		const body = request.body;

		const result = this.parseIncomingData(body);
		if (result.error) {
			return response.error(HttpCodes.BadRequest);
		}

		const data = result.unwrap();

		const latestAppeal = await this.container.db.appeal.findFirst({
			where: {
				guildId: data.guildId
			},
			orderBy: {
				idx: 'desc'
			}
		});

		const nextIdx = latestAppeal ? latestAppeal.idx + 1 : 1;

		const appeal = await this.container.db.appeal.create({
			data: {
				idx: nextIdx,
				...data
			}
		});

		const guildData = await this.container.db.guild.findUnique({
			where: {
				guildId: appeal.guildId
			}
		});

		if (!guildData?.channelAppeal) {
			return response.error(HttpCodes.BadRequest, { error: 'No appeal channel found' });
		}

		const appealChannel = (await this.container.client.channels.fetch(guildData.channelAppeal)) as TextChannel;

		if (!appealChannel) {
			return response.error(HttpCodes.BadRequest, { error: 'No appeal channel found' });
		}

		const user = this.container.client.users.cache.get(appeal.userId);

		const accceptButton = new ButtonBuilder()
			.setCustomId(`@appeal/a/${appeal.id}`)
			.setDisabled()
			.setStyle(ButtonStyle.Success)
			.setLabel('Approve');

		const rejectButton = new ButtonBuilder().setCustomId(`@appeal/r/${appeal.id}`).setDisabled().setStyle(ButtonStyle.Danger).setLabel('Reject');

		const viewModlogsButton = new ButtonBuilder().setCustomId(`@appeal/m/${appeal.id}`).setLabel('View Modlogs').setDisabled();

		appealChannel.send({
			embeds: [
				new EmbedBuilder()
					.setTitle(`Appeal #${appeal.idx}`)
					.setAuthor({ iconURL: user?.displayAvatarURL(), name: `@${user?.username ?? 'dummyuser'}` })
					.setFields(
						{
							name: '1. What type of action are you appealing?',
							value: [
								`${appeal.muteOrBan === 'mute' ? CardinalEmojis.Success : CardinalEmojis.Fail} Mute`,
								`${appeal.muteOrBan === 'ban' ? CardinalEmojis.Success : CardinalEmojis.Fail} Ban`
							].join('\n')
						},
						{
							name: '2. Why were you moderated?',
							value: `${appeal.reason}`
						},
						{
							name: '3. What is your appeal?',
							value: `${appeal.appeal}`
						},
						{
							name: '4. Anything else you would like to add?',
							value: `${appeal.extra}`
						}
					)
					.setFooter({ text: `User ID: ${appeal.userId}` })
					.setTimestamp()
					.setColor(CardinalColors.Info)
			],
			components: [new ActionRowBuilder<ButtonBuilder>().addComponents(accceptButton, rejectButton, viewModlogsButton)]
		});

		return response.status(200).json(appeal);
	}

	private parseIncomingData(data: any) {
		const validator = s.object({
			guildId: s.string,
			userId: s.string,
			muteOrBan: s.string,
			reason: s.string,
			appeal: s.string,
			extra: s.string
		});

		const result = validator.run(data);
		return result;
	}
}
