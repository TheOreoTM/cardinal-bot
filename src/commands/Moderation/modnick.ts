import { CardinalEmbedBuilder, CardinalIndexBuilder, ModerationCommand, Modlog } from '#lib/structures';
import { ModerationType } from '#utils/moderationConstants';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<ModerationCommand.Options>({
	description: 'Moderate the nickname of a member',
	name: 'modnick',
	detailedDescription: {
		extendedHelp: 'Change the nickname of a member to something random or something of your choosing',
		explainedUsage: [
			['--freeze/--frozen/--f', 'Use `--freeze/--frozen/--f` to freeze the nickname given and disallow the member from changing it themselves'],
			['Modnick', 'The nickname you want to change the users display name to. (max of 32 characters)']
		],
		usages: ['User', 'User Modnick', 'User --f', 'User Modnick --freeze'],
		examples: ['@gayballs Golf', '@dick_muncher', '@clink cant change --f']
	},
	flags: ['frozen']
})
export class modnickCommand extends ModerationCommand {
	public override async messageRun(message: ModerationCommand.Message, args: ModerationCommand.Args) {
		const target = await args.pick('member').catch(() => null);
		const isFrozen = args.getFlags('frozen', 'freeze', 'f');

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
		await target.setNickname(fullNick.slice(0, 32));

		return await send(message, {
			embeds: [
				new CardinalEmbedBuilder()
					.setStyle('success')
					.setDescription(`Moderated \`${target.user.username}\` with the nickname \`${fullNick}\``)
			]
		});
	}
}
