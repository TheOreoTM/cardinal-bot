import { container } from '@sapphire/pieces';
import { ChannelType, type Guild } from 'discord.js';
import { CardinalEmbedBuilder } from './CardinalEmbedBuilder';
import type { GuildChannel } from '#lib/types';

export class LockdownManager {
	private readonly db = container.db;
	private lockdownReport: LockdownReport = { fullSuccess: true, channels: [] };

	public constructor(private readonly guild: Guild) {
		this.guild = guild;
	}

	public async unlock() {
		const data = await this.db.guild.findUnique({ where: { guildId: this.guild.id } });
		if (!data) return;

		const channels = await this.getLockdownChannels();

		channels.forEach(async (channel) => {
			const channelData = await this.db.lockdown.findUnique({ where: { channelId: channel.id } });

			let permission: boolean | null = null;
			if (channelData) {
				const { oldPermission } = channelData;
				if (oldPermission === OldPermission.None) permission = null;
				if (oldPermission === OldPermission.Allow) permission = true;
				if (oldPermission === OldPermission.Deny) permission = false;
			}

			channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: permission }).catch((e) => {
				this.lockdownReport.channels.push({ channelId: channel.id, success: false, error: e.message });
				this.lockdownReport.fullSuccess = false;
				return;
			});
		});
	}

	public async lock() {
		const data = await this.db.guild.findUnique({ where: { guildId: this.guild.id } });
		if (!data) return;

		const report: LockdownReport = { fullSuccess: true, channels: [] };

		const channels = await this.getLockdownChannels();

		channels.forEach((channel) => this.lockChannel(channel));

		await this.db.guild.update({
			where: { guildId: this.guild.id },
			data: { isLocked: true }
		});

		return report;
	}

	public get isLocked() {
		return async () => {
			const data = await this.db.guild.findUnique({ where: { guildId: this.guild.id } });
			return data?.isLocked ?? false;
		};
	}

	private lockChannel(channel: GuildChannel) {
		const lockdownEmbed = new CardinalEmbedBuilder()
			.setStyle('info')
			.setDescription('This channel has been locked down by a moderator. Please wait until the lockdown is over.');

		let oldPermission: number = OldPermission.None;

		const allowEveryone = channel.permissionsFor(channel.guild.roles.everyone).has('SendMessages');
		if (allowEveryone) {
			oldPermission = OldPermission.Allow;
		} else {
			oldPermission = OldPermission.Deny;
		}

		channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: false }).catch((e) => {
			this.lockdownReport.channels.push({ channelId: channel.id, success: false, error: e.message });
			return;
		});

		channel.send({ embeds: [lockdownEmbed] });

		const data = {
			channelId: channel.id,
			guildId: this.guild.id,
			oldPermission: oldPermission
		};

		this.db.lockdown.upsert({
			create: data,
			update: data,
			where: { channelId: channel.id }
		});

		this.lockdownReport.channels.push({ channelId: channel.id, success: true });
	}

	/**
	 * Retrieves the lockdown channels based on the configuration in the database.
	 * @returns A promise that resolves to an array of GuildChannel objects representing the lockdown channels.
	 */
	private async getLockdownChannels(): Promise<GuildChannel[]> {
		const data = await this.db.guild.findUnique({ where: { guildId: this.guild.id } });
		if (!data) return [];

		const lockdownChannels = data.lockdownChannelList;
		const listType = data.lockdownChannelListType as LockdownChannelListType;

		const channels: GuildChannel[] = [];

		this.guild.channels.cache.forEach((channel) => {
			if (channel.type !== ChannelType.GuildText) return;

			if (listType === 'include' && lockdownChannels.includes(channel.id)) {
				channels.push(channel);
			}

			if (listType === 'exclude' && !lockdownChannels.includes(channel.id)) {
				channels.push(channel);
			}
		});

		return channels;
	}
}

type LockdownChannelListType = 'exclude' | 'include';
type LockdownReport = {
	fullSuccess: boolean;
	channels: { channelId: string; success: boolean; error?: string }[];
};

enum OldPermission {
	None,
	Allow,
	Deny
}
