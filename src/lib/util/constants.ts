import { envParseArray, envParseString } from '@skyra/env-utilities';

export const CardinalEpoch = 1689677721;
export const ZeroWidthSpace = '\u200B';
export const LongWidthSpace = '\u3000';
export const UsernameRegex = new RegExp('[^a-zA-Z0-9_]');

export const RandomLoadingMessage = ['Computing...', 'Thinking...', 'Give me a moment', 'Loading...'];

export const BotOwner = envParseString('BOT_OWNER');
export const BotPrivilegedUsers = envParseArray('BOT_PRIVILEGED_USERS');
export const CooldownFiltered = [BotOwner, ...BotPrivilegedUsers];
export const BotPrefix = envParseString('BOT_PREFIX');
export const BotClientID = '740962735306702858';
export const BotVersion = '2.0.0';

export const MainServerID = '519734247519420438';
/**
 * When the first logged timed message was created
 */
export const FirstTimedMessageDate = new Date('2023-08-03T14:21:08.952Z');
/**
 * When the first logged message was created
 */
export const FirstMessageDate = new Date('2023-08-01T20:36:02.055Z');

export const enum CardinalColors {
	Success = 0x46b485,
	Fail = 0xf05050,
	Warn = 0xfee65c,
	Info = 0x297bd1,
	Loading = 0x23272a,
	Default = 0x2b2d31
}

export const enum CardinalEmojis {
	Cardinal = '<:cardinal:1143546907801682001>',
	Fail = '<:fail:1093480740571852810>',
	Success = '<:success:1093480744040534046>',
	Prompt = '<:edit:1138939490166112366>',
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
	Off = '<:off:1111978397585907732>',
	Online = '<:online:1131233305782669403>',
	Invisible = '<:invisible:1131233401731567666>',
	Dnd = '<:dnd:1131233360925163652>',
	Idle = '<:idle:1131233326523490424> ',
	Reply = '<:reply:1136774317993107536>',
	Gear = '⚙️'
}
