import { container } from '@sapphire/pieces';
import { ChannelType, Collection, type Guild, type OverwriteData, type Snowflake } from 'discord.js';
import { CardinalEmbedBuilder } from '#lib/structures';
import type { GuildChannel } from '#lib/types';
import type { Nullish } from '@sapphire/utilities';

export class LockdownManager {
	private readonly db = container.db;
	public report: LockdownReport = { fullSuccess: true, channels: [] };

	public constructor(private readonly guild: Guild) {
		this.guild = guild;
	}

	public async unlock() {
		this.report = { fullSuccess: true, channels: [] }; // Reset the unlockdown report
		const data = await this.db.guild.findUnique({ where: { guildId: this.guild.id } });
		if (!data) return;

		const channels = await this.getLockdownChannels();

		channels.forEach(({ channel, data }) => this.unlockChannel(channel, data));
	}

	public async lock() {
		this.report = { fullSuccess: true, channels: [] }; // Reset the lockdown report
		const data = await this.db.guild.findUnique({ where: { guildId: this.guild.id } });
		if (!data) return;

		const report: LockdownReport = { fullSuccess: true, channels: [] };

		const channels = await this.getLockdownChannels();

		channels.forEach(({ channel }) => this.lockChannel(channel));

		return report;
	}

	public get isLocked() {
		return async () => {
			const data = await this.db.guild.findUnique({ where: { guildId: this.guild.id } });
			return data?.isLocked ?? false;
		};
	}

	public async unlockChannel(channel: GuildChannel, data: LockedChannel | Nullish) {
		const unlockEmbed = new CardinalEmbedBuilder().setStyle('info').setDescription('🔓 This channel has been unlocked');
		const overwrites = data?.overwrites;

		if (!overwrites) {
			channel.permissionOverwrites
				.edit(this.guild.id, defaultUnlockOptions, { reason: 'Unlocking channel w/ default options' })
				.then(() => {
					channel.send({ embeds: [unlockEmbed] });
					this.report.channels.push({ channelId: channel.id, success: true });
				})
				.catch((e) => {
					this.report.channels.push({ channelId: channel.id, success: false, error: `Failed to edit permissions: ${e}` });
				});
		}

		if (overwrites) {
			channel.permissionOverwrites
				.set(
					overwrites.map((overwrite) => ({ id: overwrite.id, allow: overwrite.allow, deny: overwrite.deny })) as OverwriteData[],
					`Unlocking channel`
				)
				.then(() => {
					channel.send({ embeds: [unlockEmbed] });
					this.report.channels.push({ channelId: channel.id, success: true });
				})
				.catch((e) => {
					this.report.channels.push({ channelId: channel.id, success: false, error: `Failed to edit permissions: ${e}` });
				});
		}

		this.db.lockedChannel.deleteMany({
			where: {
				channelId: channel.id
			}
		});
	}

	public async lockChannel(channel: GuildChannel) {
		const lockEmbed = new CardinalEmbedBuilder()
			.setStyle('info')
			.setDescription('🔒 This channel has been locked by a moderator. Please wait until the lockdown is over.');

		const permissionOverwrites = channel.permissionOverwrites.cache;
		const overwrites = permissionOverwrites.map((overwrite) => overwrite.toJSON()) as Overwrite[];

		channel.permissionOverwrites
			.edit(this.guild.id, lockOptions)
			.then(() => channel.send({ embeds: [lockEmbed] }))
			.catch((e) => {
				this.report.channels.push({ channelId: channel.id, success: false, error: `Failed to edit permissions: ${e}` });
			});

		this.report.channels.push({ channelId: channel.id, success: true });

		this.db.lockedChannel.upsert({
			create: {
				channelId: channel.id,
				guildId: this.guild.id,
				overwrites: {
					create: overwrites
				}
			},
			update: {
				channelId: channel.id,
				guildId: this.guild.id,
				overwrites: {
					create: overwrites
				}
			},
			where: {
				channelId: channel.id
			}
		});
	}

	/**
	 * Retrieves the lockdown channels based on the configuration in the database.
	 * @returns A promise that resolves to an array of GuildChannel objects representing the lockdown channels.
	 */
	private async getLockdownChannels(): Promise<Collection<Snowflake, LockedChannelData>> {
		const channels: Collection<Snowflake, LockedChannelData> = new Collection();

		const promisedata = this.db.guild.findUnique({ where: { guildId: this.guild.id } });
		const promiseChannelsData = this.getLockdownChannelsData();

		const [data, channelsData] = await Promise.all([promisedata, promiseChannelsData]).catch(() => {
			return [null, null];
		});

		if (!data) return channels;
		if (!channelsData) return channels;

		const lockdownChannels = data.lockdownChannelList;
		const listType = data.lockdownChannelListType as LockdownChannelListType;

		this.guild.channels.cache.forEach((channel) => {
			if (channel.type !== ChannelType.GuildText) return;
			const data = channelsData.get(channel.id);
			if (!data) return;

			if (listType === 'include' && lockdownChannels.includes(channel.id)) {
				channels.set(channel.id, { channel, data });
			}

			if (listType === 'exclude' && !lockdownChannels.includes(channel.id)) {
				channels.set(channel.id, { channel, data });
			}
		});

		return channels;
	}

	private async getLockdownChannelsData(): Promise<Collection<Snowflake, LockedChannel>> {
		const data = await this.db.lockedChannel.findMany({
			where: {
				guildId: this.guild.id
			},
			select: {
				overwrites: {
					select: {
						allow: true,
						deny: true,
						id: true,
						type: true
					}
				},
				channelId: true,
				guildId: true
			}
		});

		const channels = new Collection<Snowflake, LockedChannel>();

		data.forEach((channel) => {
			channels.set(channel.channelId, channel);
		});

		return channels;
	}
}

const lockOptions = {
	SendMessages: false,
	AddReactions: false,
	CreatePublicThreads: false,
	CreatePrivateThreads: false
};

const defaultUnlockOptions = {
	SendMessages: null,
	AddReactions: null,
	CreatePublicThreads: null,
	CreatePrivateThreads: null
};

type Overwrite = {
	allow: string;
	deny: string;
	id: string;
	type: number;
};

type LockdownChannelListType = 'exclude' | 'include';

type LockdownReport = {
	fullSuccess: boolean;
	channels: { channelId: string; success: boolean; error?: string }[];
};

type LockedChannelData = {
	channel: GuildChannel;
	data: LockedChannel;
};

type LockedChannel = {
	channelId: string;
	guildId: string;
	overwrites: Overwrite[] | Nullish;
};
