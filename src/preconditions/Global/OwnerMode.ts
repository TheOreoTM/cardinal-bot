import { ApplyOptions } from '@sapphire/decorators';
import { Precondition } from '@sapphire/framework';
import type { CommandInteraction, ContextMenuCommandInteraction, Message } from 'discord.js';
import { BotOwner } from '#constants';

@ApplyOptions<Precondition.Options>({
	position: 1
})
export class UserPrecondition extends Precondition {
	public override messageRun(message: Message) {
		return this.inOwnerMode(message.author.id);
	}

	public override chatInputRun(interaction: CommandInteraction) {
		return this.inOwnerMode(interaction.user.id);
	}

	public override contextMenuRun(interaction: ContextMenuCommandInteraction) {
		return this.inOwnerMode(interaction.user.id);
	}

	private inOwnerMode(id: string) {
		const mode = this.container.client.user?.presence.status === 'dnd';

		if (!mode) return this.ok();

		return BotOwner.includes(id)
			? this.ok()
			: this.error({
					message: `The bot is currently in maintenance. If this persists for long, join my support server to know more about it!`
			  });
	}
}
