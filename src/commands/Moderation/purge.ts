import { CardinalEmbedBuilder, CardinalSubcommand } from '#lib/structures';
import { PermissionLevels } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<CardinalSubcommand.Options>({
	permissionLevel: PermissionLevels.Moderator,
	description: 'Bulk delete messages',
	name: 'purge',
	subcommands: [
		{
			name: 'default',
			messageRun: 'default'
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
	public async default(message: CardinalSubcommand.Message, args: CardinalSubcommand.Args) {
		const amountToDelete = await args
			.pick('number', {
				minimum: 1,
				maximum: 1000
			})
			.catch(() => null);

		if (!amountToDelete) {
			return send(message, {
				embeds: [
					new CardinalEmbedBuilder().setStyle('fail').setDescription('Provide a valid amount of amessages to delete (between 1 and 1000)')
				]
			});
		}

		const totalMessagesToDelete = Math.min(amountToDelete, 1000) + 1; // Ensure it doesn't exceed 1000

		let deletedMessages = 0;
		const channel = message.channel;

		while (deletedMessages < totalMessagesToDelete) {
			const messagesToDelete = Math.min(100, totalMessagesToDelete - deletedMessages); // Delete in chunks of 100 or less

			const fetchedMessages = await channel.messages.fetch({ limit: messagesToDelete });
			await channel.bulkDelete(fetchedMessages, true);

			deletedMessages += fetchedMessages.size;

			// Add a small delay to avoid rate limits (optional)
			// await new Promise((resolve) => setTimeout(resolve, 100));
		}

		return;
	}
}
