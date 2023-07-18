import { ApplyOptions } from '@sapphire/decorators';
import { Precondition } from '@sapphire/framework';
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message } from 'discord.js';

@ApplyOptions<Precondition.Options>({
	position: 2
})
export class UserPrecondition extends Precondition {
	#message = 'You may only use this command in a guild';
	public override messageRun(message: Message) {
		return message.guild ? this.ok() : this.error({ message: this.#message });
	}

	public override chatInputRun(interaction: ChatInputCommandInteraction) {
		return interaction.guild ? this.ok() : this.error({ message: this.#message });
	}

	public override contextMenuRun(interaction: ContextMenuCommandInteraction) {
		return interaction.guild ? this.ok() : this.error({ message: this.#message });
	}
}
