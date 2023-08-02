import { CardinalEmbedBuilder, CardinalIndexBuilder, ModerationCommand, Modlog } from '#lib/structures';
import { ModerationType } from '#utils/moderationConstants';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Moderate the nickname of a member',
	name: 'modnick',
	detailedDescription: {
		extendedHelp: 'Change the nickname of a member to something random or something of your choosing',
		reminder: 'Use `--freeze` to freeze the nickname given and disallow the member from changing it themselves',
		usages: ['User', 'User Modnick'],
		examples: ['@gayballs Golf', '@dick_muncher']
	},
	flags: ['frozen']
})
export class modnickCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const target = await args.pick('member').catch(() => null);
		const isFrozen = args.getFlags('frozen');

		if (!target) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid member to warn')]
			});
		}

		let nick = await args.rest('string').catch(() => '');

		if (nick === '') {
			nick = `Moderated Nickname ${new CardinalIndexBuilder().generateTag(8, false)}`;
		}

		const modlog = new Modlog({
			member: target,
			staff: message.member,
			type: ModerationType.Modnick
		});

		const fullNick = `${nick}${isFrozen ? ' ❄️' : ''}`;
		await modlog.createModnick({ moderatedNickname: nick, originalNickname: target.displayName, frozen: isFrozen });
		await target.setNickname(fullNick);

		return await send(message, {
			embeds: [
				new CardinalEmbedBuilder()
					.setStyle('success')
					.setDescription(`Moderated \`${target.user.username}\` with the nickname \`${fullNick}\``)
			]
		});
	}
}
