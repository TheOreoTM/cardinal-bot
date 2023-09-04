import { CardinalEmbedBuilder, CardinalSubcommand } from '#lib/structures';
import { PermissionLevels } from '#lib/types';
import { seconds } from '#utils/common';
import { ApplyOptions } from '@sapphire/decorators';
import { DiscordInviteLinkRegex, HttpUrlRegex } from '@sapphire/discord.js-utilities';
import { Args, BucketScope } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message, TextChannel } from 'discord.js';

@ApplyOptions<CardinalSubcommand.Options>({
	permissionLevel: PermissionLevels.Moderator,
	description: 'Bulk delete messages',
	name: 'purge',
	cooldownScope: BucketScope.Guild,
	cooldownDelay: seconds(8),
	subcommands: [
		{
			name: 'default',
			messageRun: 'default',
			default: true
		},
		{
			name: 'user',
			messageRun: 'user'
		},
		{
			name: 'match',
			messageRun: 'match'
		},
		{
			name: 'startsWith',
			messageRun: 'startsWith'
		},
		{
			name: 'endsWith',
			messageRun: 'endsWith'
		},
		{
			name: 'not',
			messageRun: 'not'
		},
		{
			name: 'invites',
			messageRun: 'invites'
		},
		{
			name: 'links',
			messageRun: 'links'
		},
		{
			name: 'images',
			messageRun: 'images'
		},
		{
			name: 'mentions',
			messageRun: 'mentions'
		},
		{
			name: 'embeds',
			messageRun: 'embeds'
		},
		{
			name: 'bots',
			messageRun: 'bots'
		},
		{
			name: 'humans',
			messageRun: 'humans'
		},
		{
			name: 'text',
			messageRun: 'text'
		}
	],

	detailedDescription: {
		extendedHelp: 'Delete a number of messages from a channel. (limit: 1000)',
		usages: ['Count'],
		examples: ['101'],
		explainedUsage: [['Count', 'The number of messages to delete between 1 and 1000']]
	}
})
export class purgeCommand extends CardinalSubcommand {
	public async default(message: Message, args: CardinalSubcommand.Args) {
		const amountToDelete = await args.pick(purgeCommand.amount);
		const channel = message.channel as TextChannel;
		const totalMessagesToDelete = Math.min(amountToDelete, 1000) + 1; // Ensure it doesn't exceed 1000

		args.message.deletable ? await args.message.delete() : null;

		let deletedMessages = 0;

		while (deletedMessages < totalMessagesToDelete) {
			const messagesToDelete = Math.min(100, totalMessagesToDelete - deletedMessages); // Delete in chunks of 100 or less

			const fetchedMessages = await channel.messages.fetch({ limit: messagesToDelete });

			let messagesToDeleteFiltered = fetchedMessages;

			await channel.bulkDelete(messagesToDeleteFiltered, true);

			deletedMessages += fetchedMessages.size;
		}
	}
	public async user(message: Message, args: CardinalSubcommand.Args) {
		const member = await args.pick('member').catch(() => null);

		if (!member) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a member to purge the message for')]
			});
		}

		return this.fetchMessageAndPurge(args, (message) => {
			return message.author.id === member.id;
		});
	}

	public async match(message: Message, args: CardinalSubcommand.Args) {
		const matchString = await args.pick('string').catch(() => null);

		if (!matchString) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a string to match for')]
			});
		}

		return this.fetchMessageAndPurge(args, (message) => {
			return message.content.includes(matchString);
		});
	}

	public async startsWith(message: Message, args: CardinalSubcommand.Args) {
		const matchString = await args.pick('string').catch(() => null);

		if (!matchString) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a string to match for')]
			});
		}

		return this.fetchMessageAndPurge(args, (message) => {
			return message.content.startsWith(matchString);
		});
	}

	public async endsWith(message: Message, args: CardinalSubcommand.Args) {
		const matchString = await args.pick('string').catch(() => null);

		if (!matchString) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a string to match for')]
			});
		}

		return this.fetchMessageAndPurge(args, (message) => {
			return message.content.endsWith(matchString);
		});
	}

	public async not(message: Message, args: CardinalSubcommand.Args) {
		const matchString = await args.pick('string').catch(() => null);

		if (!matchString) {
			return send(message, {
				embeds: [new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a string to match for')]
			});
		}

		return this.fetchMessageAndPurge(args, (message) => {
			return !message.content.includes(matchString);
		});
	}

	public async invites(message: Message, args: CardinalSubcommand.Args) {
		message;
		return this.fetchMessageAndPurge(args, (message) => {
			return DiscordInviteLinkRegex.test(message.content);
		});
	}

	public async links(message: Message, args: CardinalSubcommand.Args) {
		message;
		return this.fetchMessageAndPurge(args, (message) => {
			return HttpUrlRegex.test(message.content);
		});
	}

	public async images(message: Message, args: CardinalSubcommand.Args) {
		message;
		return this.fetchMessageAndPurge(args, (message) => {
			return message.attachments.size !== 0;
		});
	}

	public async mentions(message: Message, args: CardinalSubcommand.Args) {
		const mentionFilter = (msg: Message) => {
			return msg.content.includes('@') || msg.mentions.users.size > 0;
		};
		message;
		return this.fetchMessageAndPurge(args, mentionFilter);
	}

	public async embeds(message: Message, args: CardinalSubcommand.Args) {
		message;
		return this.fetchMessageAndPurge(args, (message) => {
			return message.embeds.length !== 0;
		});
	}

	public async bots(message: Message, args: CardinalSubcommand.Args) {
		message;
		return this.fetchMessageAndPurge(args, (message) => {
			return message.author.bot;
		});
	}

	public async humans(message: Message, args: CardinalSubcommand.Args) {
		message;
		return this.fetchMessageAndPurge(args, (message) => {
			return !message.author.bot;
		});
	}

	public async text(message: Message, args: CardinalSubcommand.Args) {
		message;
		return this.fetchMessageAndPurge(args, (message) => {
			return message.attachments.size === 0 && message.content.length !== 0;
		});
	}

	private async fetchMessageAndPurge(args: CardinalSubcommand.Args, filter?: (msg: Message) => boolean) {
		const amountToDelete = await args.pick(purgeCommand.amount);
		const channel = args.message.channel as TextChannel;
		const totalMessagesToDelete = Math.min(amountToDelete, 1000) + 1; // Ensure it doesn't exceed 1000

		args.message.deletable ? await args.message.delete() : null;

		let deletedMessages = 0;

		while (deletedMessages < totalMessagesToDelete) {
			const messagesToDelete = Math.min(100, totalMessagesToDelete - deletedMessages); // Delete in chunks of 100 or less

			const fetchedMessages = await channel.messages.fetch({ limit: messagesToDelete });

			let messagesToDeleteFiltered = fetchedMessages;
			if (filter) {
				messagesToDeleteFiltered = fetchedMessages.filter(filter);
			}

			await channel.bulkDelete(messagesToDeleteFiltered, true);

			deletedMessages += fetchedMessages.size;

			// await new Promise((resolve) => setTimeout(resolve, 100));
		}
	}

	private static amount = Args.make<number>((parameter, { argument }) => {
		const param = parseInt(parameter);
		if (isNaN(param)) return Args.error({ argument, parameter, message: 'Provide a valid amount of amessages to delete (between 1 and 1000)' });
		if (param > 0 && param <= 1000) return Args.ok(param + 1);
		return Args.error({ argument, parameter, message: 'Provide a valid amount of amessages to delete (between 1 and 1000)' });
	});
}
