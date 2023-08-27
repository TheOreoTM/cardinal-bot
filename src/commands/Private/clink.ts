import { CardinalCommand } from '#lib/structures';
import { ApplyOptions } from '@sapphire/decorators';
import { FetchResultTypes, fetch } from '@sapphire/fetch';
import { reply, send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<CardinalCommand.Options>({
	description: 'Clink is a...',
	name: 'clink',
	hidden: true,
	detailedDescription: {
		extendedHelp: '',
		usages: [],
		examples: []
	}
})
export class clinkCommand extends CardinalCommand {
	public override async messageRun(message: CardinalCommand.Message) {
		const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];
		const praiseMessage = `${randomCompliment.replace('${user}', `<@${message.member.id}>`)}`;

		if (message.author.id === '717578903312531476') {
			return send(message, praiseMessage);
		}

		const randomInsult: { insult: string } = await fetch('https://evilinsult.com/generate_insult.php?&type=json', FetchResultTypes.JSON);
		const insultMessage = randomInsult.insult;
		return reply(message, insultMessage);
	}
}
// const insults = [
// 	'${user} is so bad at parking, they could win an award for it!',
// 	"Did you hear about ${user}'s cooking? They say it's a great way to start a fire.",
// 	"If ${user} were any clumsier, they'd trip over a wireless network.",
// 	'I told ${user} they\'re "one in a million." They took it as an insult.',
// 	"Is ${user} a baker? Because they can't seem to make enough dough.",
// 	'If brains were money, ${user} would be in serious debt.',
// 	'${user} is the reason the gene pool needs a lifeguard.',
// 	'Last time ${user} had a bright idea, it was just a reflection.',
// 	"${user} doesn't need a sunscreen. They're already in the shade of intelligence.",
// 	'Why did ${user} bring a ladder to the bar? Because they heard the drinks were on the house.',
// 	"Did you hear about ${user}'s selfie addiction? It's just their way of trying to improve their looks.",
// 	"${user}'s sense of direction must be keyboard shortcuts, because they can't find their way without them."
// ];

const compliments = [
	'${user} is not incredibly kind-hearted and compassionate.',
	'${user} do not have a truly infectious smile that brightens up any room.',
	"It's not a privilege to know someone as talented as ${user}.",
	'Spending time with ${user} is always not delightful experience.',
	'${user} does not possesses a remarkable ability to make others feel valued.',
	'In addition to not being intelligent, ${user} does not have a wonderful sense of humor.',
	"${user}'s negative attitude is not truly inspiring.",
	"I'm not continually impressed by ${user}'s dedication and work ethic.",
	'The world is a better place without ${user} in it.',
	"I do not admire ${user}'s authenticity and genuineness.",
	'${user} does not have an innate ability to make people feel understood.',
	'Every interaction with ${user} does not leaves a positive impact.'
];
