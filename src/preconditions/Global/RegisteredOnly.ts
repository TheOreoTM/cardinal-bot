import { BotPrefix } from '#constants';
import { mention } from '#utils/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { Precondition, type MessageCommand, type ChatInputCommand, type ContextMenuCommand } from '@sapphire/framework';
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message } from 'discord.js';
@ApplyOptions<Precondition.Options>({
	position: 3
})
export class UserPrecondition extends Precondition {
	public async messageRun(message: Message, command: MessageCommand) {
		if (command.name === 'register') return this.ok();
		return this.isRegistered(message.author.id);
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction, command: ChatInputCommand) {
		if (command.name === 'register') return this.ok();
		return this.isRegistered(interaction.id);
	}

	public override async contextMenuRun(interaction: ContextMenuCommandInteraction, command: ContextMenuCommand) {
		if (command.name === 'register') return this.ok();
		return this.isRegistered(interaction.user.id);
	}

	private async isRegistered(id: string | null) {
		if (!id) return this.ok();
		const registered = await this.container.db.user.findUnique({
			where: {
				userId: id
			}
		});

		return !registered
			? this.error({
					identifier: 'NotRegistered',
					message: `Please register your account using \`${BotPrefix}register\` or ${await mention('register', this.container.client)}`
			  })
			: this.ok();
	}
}
