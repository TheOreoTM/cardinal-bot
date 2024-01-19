import { CardinalEmbedBuilder, ModerationCommand } from '#lib/structures';
import { seconds } from '#utils/common';
import { ApplyOptions } from '@sapphire/decorators';
import { BucketScope } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { TextChannel } from 'discord.js';

@ApplyOptions<ModerationCommand.Options>({
	name: 'unlock',
	description: 'Unlock a channel',
	detailedDescription: {
		extendedHelp: `This command will unlock a channel, allowing users to send messages, add reaction, make and send messages in threads in it. The bot will try to restore the old permissions and then edit the permissions for the \`@everyone\`. If the bot cant find the old permissions, it will set the permissions to inherit.`,
		examples: ['', '#general'],
		usages: ['', 'Channel'],
		possibleFormats: [['Channel', 'ID/Mention/Name']],
		explainedUsage: [['Channel', 'The channel to unlock']]
	},
	aliases: ['unlockchannel'],
	cooldownDelay: seconds(20),
	cooldownScope: BucketScope.Guild,
	cooldownLimit: 3
})
export class lockCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const channel = await args.pick('guildTextChannel').catch(() => message.channel);

		if (!(channel instanceof TextChannel)) {
			send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`The channel you provided is not a text channel.`)]
			});

			return;
		}

		const guild = message.guild;

		if (channel.permissionsFor(guild.roles.everyone).has('SendMessages')) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`That channel is not locked`)]
			});
		}

		channel.permissionOverwrites
			.edit(guild.roles.everyone, {
				SendMessages: null
			})
			.catch(() => {
				send(message, {
					embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription(`I couldn't unlock that channel`)]
				});
			});

		send(message, {
			embeds: [new CardinalEmbedBuilder().setStyle('success').setDescription(`Unlocked ${channel}`)]
		});
		return;
	}
}
