import { QuestionDifficulty, QuestionType, TrivaCategories, getQuestion, type QuestionData } from '#lib/games/TriviaManager';
import { CardinalCommand, CardinalEmbedBuilder } from '#lib/structures';
import { seconds, minutes, floatPromise } from '#utils/common';
import { sendTemporaryMessage } from '#utils/functions';
import { shuffle } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { Args } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { EmbedBuilder, MessageCollector, type Message, type User } from 'discord.js';
import { decode } from 'he';

@ApplyOptions<CardinalCommand.Options>({
	description: 'Play a game of trivia',
	name: 'trivia',
	detailedDescription: {
		usages: [
			`Answer questions of trivia here, with categories ranging from books to mythology! (powered by OpenTDB)\n\n**Categories**: ${TrivaCategories}`
		],
		examples: ['', 'Category', 'Category multiple/boolean/truefalse', 'multiple easy/medium/hard', 'hard 2m']
	}
})
export class triviaCommand extends CardinalCommand {
	#channels = new Set<string>();

	public async messageRun(message: Message, args: CardinalCommand.Args) {
		const category = await args.pick(triviaCommand.category).catch(() => TrivaCategories.general);
		const questionType = await args.pick(triviaCommand.questionType).catch(() => QuestionType.Multiple);
		const difficulty = await args.pick(triviaCommand.questionDifficulty).catch(() => QuestionDifficulty.Easy);
		const duration = args.finished
			? seconds(30)
			: await args.pick('duration', {
					minimum: seconds(1),
					maximum: minutes(1)
			  });

		if (this.#channels.has(message.channel.id)) this.error('A game of trivia is already being played in this channel');
		this.#channels.add(message.channel.id);

		try {
			await send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('loading').setDescription(`Loading trivia`)]
			});
			const data = await getQuestion(category, difficulty, questionType);
			const possibleAnswers =
				questionType === QuestionType.Boolean
					? ['True', 'False']
					: shuffle([data.correct_answer, ...data.incorrect_answers].map((ans) => decode(ans)));
			const correctAnswer = decode(data.correct_answer);

			const questionEmbed = this.buildQuestionEmbed(data, possibleAnswers);
			await send(message, { embeds: [questionEmbed] });
			const filter = (msg: Message) => {
				const num = Number(msg.content);
				return Number.isInteger(num) && num > 0 && num <= possibleAnswers.length;
			};
			const collector = new MessageCollector(message.channel, {
				filter,
				time: duration
			});

			let winner: User | null = null;
			// users who have already participated
			const participants = new Set<string>();

			return collector
				.on('collect', (collected: Message) => {
					if (participants.has(collected.author.id)) return;
					const attempt = possibleAnswers[parseInt(collected.content, 10) - 1];
					if (attempt === decode(data.correct_answer)) {
						winner = collected.author;
						return collector.stop();
					}
					participants.add(collected.author.id);
					floatPromise(sendTemporaryMessage(collected, `I am sorry, but **${attempt}** is not the correct answer. Better luck next time!`));
				})
				.on('end', () => {
					this.#channels.delete(message.channel.id);

					const content = winner
						? `We have a winner! ${winner} had a right answer with **${correctAnswer}**`
						: `Looks like nobody got it! The right answer was **${correctAnswer}**.`;
					floatPromise(send(message, content));
				});
		} catch (error) {
			this.#channels.delete(message.channel.id);
			this.container.logger.fatal(error);
			this.error(`Something went wrong`);
		}
	}

	public buildQuestionEmbed(data: QuestionData, possibleAnswers: string[]) {
		const questionDisplay = possibleAnswers.map((possible, i) => `${i + 1}. ${possible}`);
		return new EmbedBuilder()
			.setAuthor({ name: 'Trivia' })
			.setTitle(data.category)
			.setColor(0xf37917)
			.setThumbnail('http://i.imgur.com/zPtu5aP.png')
			.setDescription([`Difficulty: ${data.difficulty}`, '', decode(data.question), '', questionDisplay.join('\n')].join('\n'));
	}

	private static category = Args.make<number>((parameter, { argument }) => {
		const lowerCasedParameter = parameter.toLowerCase();
		const category = Reflect.get(TrivaCategories, lowerCasedParameter);
		if (typeof category === 'number') return Args.ok(category);
		return Args.error({
			argument,
			parameter,
			identifier: 'InvalidCategory'
		});
	});

	private static questionType = Args.make<QuestionType>((parameter, { argument }) => {
		const lowerCasedParameter = parameter.toLowerCase();
		if (lowerCasedParameter === 'boolean' || lowerCasedParameter === 'truefalse') return Args.ok(QuestionType.Boolean);
		if (lowerCasedParameter === 'multiple') return Args.ok(QuestionType.Multiple);
		return Args.error({ argument, parameter });
	});

	private static questionDifficulty = Args.make<QuestionDifficulty>((parameter, { argument }) => {
		const lowerCasedParameter = parameter.toLowerCase();
		if (lowerCasedParameter === 'easy') return Args.ok(QuestionDifficulty.Easy);
		if (lowerCasedParameter === 'medium') return Args.ok(QuestionDifficulty.Medium);
		if (lowerCasedParameter === 'hard') return Args.ok(QuestionDifficulty.Hard);
		return Args.error({ argument, parameter });
	});
}
