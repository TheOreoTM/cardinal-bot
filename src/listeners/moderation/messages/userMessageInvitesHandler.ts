import { ModerationMessageListener } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { deleteMessage, sendTemporaryMessage } from '#utils/functions';
import { ApplyOptions } from '@sapphire/decorators';

const enum CodeType {
	DiscordGG,
	ThirdPart
}

@ApplyOptions<ModerationMessageListener.Options>({
	name: 'userMessageInvitesHandler',
	reason: 'Sending banned invites',
	rule: 'inviteLinks',
	enabled: true
})
export class InviteModerationListener extends ModerationMessageListener {
	private readonly kInviteRegExp =
		/(?<source>discord\.(?:gg|io|me|plus|link)|invite\.(?:gg|ink)|discord(?:app)?\.com\/invite)\/(?<code>[\w-]{2,})/gi;

	protected async preProcess(message: GuildMessage): Promise<string[] | null> {
		if (message.content.length === 0) return null;

		let value: RegExpExecArray | null = null;
		const promises: Promise<string | null>[] = [];
		const scanned = new Set<string>();
		while ((value = this.kInviteRegExp.exec(message.content)) !== null) {
			const { code, source } = value.groups!;

			// Get from cache, else fetch it from API.
			const identifier = this.getCodeIdentifier(source);

			// If it has already been scanned, skip
			const key = `${source}${code}`;
			if (scanned.has(key)) continue;
			scanned.add(key);

			promises.push(identifier === CodeType.DiscordGG ? this.scanLink(message, key, code) : Promise.resolve(key));
		}

		const resolved = (await Promise.all(promises)).filter((invite) => invite !== null) as string[];
		return resolved.length === 0 ? null : resolved;
	}

	protected onDelete(message: GuildMessage) {
		return deleteMessage(message);
	}

	protected onAlert(message: GuildMessage) {
		return sendTemporaryMessage(message, `${message.member}, Too many caps`);
	}

	private async scanLink(message: GuildMessage, url: string, code: string) {
		return (await this.fetchIfAllowedInvite(message, code)) ? null : url;
	}

	private async fetchIfAllowedInvite(message: GuildMessage, code: string) {
		const data = await message.client.fetchInvite(code).catch(() => null);

		// Invalid invites should not be deleted.
		if (!data) return true;

		// Invites that don't have a guild should be deleted.
		if (data.guild === null) return false;

		// Invites that point to the own server should be allowed.
		if (data.guild.id === message.guild.id) return true;

		// Any other invite should not be allowed.
		return false;
	}

	private getCodeIdentifier(source: string): CodeType {
		switch (source.toLowerCase()) {
			case 'discordapp.com/invite':
			case 'discord.com/invite':
			case 'discord.gg':
				return CodeType.DiscordGG;
			default:
				return CodeType.ThirdPart;
		}
	}
}
