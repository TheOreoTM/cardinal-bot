import { envParseArray, envParseString } from '@skyra/env-utilities';

export const ZeroWidthSpace = '\u200B';
export const LongWidthSpace = '\u3000';

export const RandomLoadingMessage = ['Computing...', 'Thinking...', 'Give me a moment', 'Loading...'];

export const BotOwner = envParseString('BOT_OWNER');
export const BotPrivilegedUsers = envParseArray('BOT_PRIVILEGED_USERS');
export const BotPrefix = envParseString('BOT_PREFIX');
export const CooldownFiltered = [BotOwner, ...BotPrivilegedUsers];

export const enum CardinalColors {
	Success = 0x46b485,
	Fail = 0xf05050,
	Warn = 0xfee65c,
	Default = 0x2b2d31
}

export const enum CardinalEmojis {
	Fail = '<:fail:1093480740571852810>',
	Success = '<:success:1093480744040534046>',
	Prompt = '<:edit:1057359923421380608>',
	Loading = '<a:loading:1096158078900129943>',
	Info = '<:info:1096158656942330006>',
	Coin = '🪙',
	Left = '◀️',
	Right = '▶️',
	Forward = '⏩',
	Backward = '⏪',
	Stop = '⏹️',
	C4Empty = '<:c4empty:1109863756638474351>',
	C4PlayerOne = '<:c4one:1109863872569032704>',
	C4WinnerOne = '<:c4onewin:1109864001963303033>',
	C4PlayerTwo = '<:c4two:1109863929838047273>',
	C4WinnerTwo = '<:c4twowin:1109864141713313872>',
	On = '<:on:1111978402405175376>',
	Off = '<:off:1111978397585907732>'
}
