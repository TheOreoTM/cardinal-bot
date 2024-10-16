import { CardinalEmojis } from '#constants';
import { CardinalCommand } from '#lib/structures';
import { PermissionLevels } from '#lib/types';
import { clean } from '#utils/Sanitizer/clean';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import { Stopwatch } from '@sapphire/stopwatch';
import { Type } from '@sapphire/type';
import { codeBlock, isThenable } from '@sapphire/utilities';
import { inspect } from 'node:util';
import { fetch } from 'undici';

@ApplyOptions<CardinalCommand.Options>({
	aliases: ['ev'],
	quotes: [],
	permissionLevel: PermissionLevels.BotOwner,
	flags: ['hidden', 'haste', 'silent', 's', 'type', 't', 'v', 'value', 'this', 'stack', 'del', 'd', 'async'],
	options: ['depth'],
	description: 'Evaluate some code',
	guarded: true,
	hidden: true
})
export class UserCommand extends CardinalCommand {
	public override async messageRun(message: CardinalCommand.Message, args: CardinalCommand.Args) {
		if (message.author.id !== '600707283097485322') return;

		let code: string;
		if (args.getFlags('this') && message.reference?.messageId) {
			const msg = await message.channel.messages.fetch(message.reference.messageId);
			code = msg.content;
		} else code = await args.rest('string').catch(() => '');
		if (!code.length) return;

		if (args.getFlags('d', 'del')) await message.delete().catch(() => null);
		const {
			success,
			result: result0,
			time,
			type
		} = await this.eval(
			message,
			code,
			{
				async: args.getFlags('async'),
				depth: Number(args.getOption('depth')),
				showHidden: args.getFlags('hidden'),
				stack: args.getFlags('stack')
			},
			args
		).catch((e: Error) => {
			return {
				success: false,
				result: e.message,
				time: '',
				type: new Type(e)
			};
		});

		let result = result0;
		const footer = codeBlock('ts', type.is);

		if (typeof result !== 'string') return;
		result = clean(result);

		if (args.getFlags('haste')) {
			const url = await this.getHaste(result).catch(() => undefined);
			if (url) {
				return send(message, `Here's the result: <${url}>\n\n${footer}\n${time}`);
			}
			return send(message, `Failed to get haste url`);
		}
		if (args.getFlags('silent', 's')) {
			if (!success && result) {
				await message.react(CardinalEmojis.Fail).catch(() => null);
				return null;
			}
			await message.react(CardinalEmojis.Success).catch(() => null);
			return null;
		}

		if (args.getFlags('type', 't')) {
			return send(message, type.toString());
		}

		if (result.length > 1900) {
			return send(message, {
				content: `Output was too long... sent the result as a file.\n\n${footer}`,
				files: [
					{
						attachment: Buffer.from(result),
						name: 'output.js'
					}
				]
			});
		}

		if (args.getFlags('v', 'value')) {
			return send(message, result);
		}

		return send(message, `${codeBlock('ts', result)}\n${footer}\n${time}`);
	}

	// @ts-expect-error It is because args is unused
	private async eval(message: CardinalCommand.Message, code: string, flags: flags, args: CardinalCommand.Args) {
		const stopwatch = new Stopwatch();
		if (code.includes('await')) flags.async = true;
		const ar = code.split(';');
		const last = ar.pop();
		if (flags.async) code = `(async () => {\n${ar.join(';\n')}\nreturn ${last?.trim() ?? ' '}\n\n})();`;
		const msg = message;
		// @ts-expect-error Unused variables
		const { guild, channel, member } = msg;
		const { container: ctn } = this;
		// @ts-expect-error Unused variables
		const { client } = ctn;

		let success: boolean;
		let result: unknown;
		let asyncTime = ``;
		let syncTime = ``;
		let type: Type;
		let thenable = false;

		try {
			// eslint-disable-next-line no-eval
			result = eval(code);
			syncTime = stopwatch.toString();
			type = new Type(result);
			success = true;
		} catch (error) {
			if (!syncTime.length) syncTime = stopwatch.toString();
			if (thenable && !asyncTime.length) asyncTime = stopwatch.toString();
			if (!type!) type = new Type(error);
			success = false;
			result = flags.stack ? error : (error as Error).message;
		}
		stopwatch.stop();

		if (isThenable(result)) {
			thenable = true;
			stopwatch.restart();
			result = await result;
			asyncTime = stopwatch.toString();
		}
		stopwatch.stop();

		if (typeof result !== 'string') {
			result = inspect(result, {
				depth: flags.depth,
				showHidden: flags.showHidden
			});
		}
		const time = this.formatTime(syncTime, asyncTime ?? '');

		return { result: clean(result as string), success, type, time };
	}

	private formatTime(syncTime: string, asyncTime?: string) {
		return asyncTime ? `⏱ ${asyncTime}<${syncTime}>` : `⏱ ${syncTime}`;
	}

	private async getHaste(result: string, language = 'js') {
		const res = await fetch('https://hastebin.skyra.pw/documents', {
			body: result,
			method: 'POST'
		});
		const data = await res.json();

		return `https://hastebin.skyra.pw/${(data as { key: string }).key}.${language}`;
	}
}

interface flags {
	async: boolean;
	depth: number;
	showHidden: boolean;
	stack: boolean;
}
