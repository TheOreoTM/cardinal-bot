import type { Prisma } from '@prisma/client';
import { container } from '@sapphire/pieces';
import { GuildMember, type User } from 'discord.js';
import { CardinalIndexBuilder, CardinalEmbedBuilder } from '#lib/structures';
import { ModerationType } from '#utils/moderationConstants';
import type { Nullish } from '@sapphire/utilities';
import { CardinalColors } from '#utils/constants';
import { capitalizeWords } from '#utils/formatters';
import { getTag } from '#utils/utils';

export class Modlog implements Prisma.ModlogCreateInput {
	caseId: number = 0;
	staffId: string = '';
	staffName: string = '';
	memberId: string = '';
	guildId: string = '';
	memberName: string = '';
	reason?: string | null | undefined;
	type: string = '';
	length?: string | null | undefined;
	createdAt?: string | Date | undefined;
	warn?: Prisma.WarnCreateNestedManyWithoutModlogInput | undefined;
	modnick?: Prisma.ModnickCreateNestedManyWithoutModlogInput | undefined;
	mute?: Prisma.MuteCreateNestedManyWithoutModlogInput | undefined;

	public constructor(data?: ModlogCreateInput) {
		if (data) {
			this.caseId = data.caseId ? data.caseId : 0;
			this.memberId = data.member.id;
			this.memberName = data.member instanceof GuildMember ? getTag(data.member.user) : getTag(data.member);
			this.staffId = data.staff.id;
			this.staffName = getTag(data.staff.user);
			this.type = data.type;
			this.reason = data.reason ? data.reason : 'No reason';
			this.length = data.length;
			this.guildId = data.staff.guild.id;
		}
	}

	public async createModlog() {
		return {
			caseId: await new CardinalIndexBuilder().modlogId(this.guildId),
			guildId: this.guildId,
			memberId: this.memberId,
			memberName: this.memberName,
			staffId: this.staffId,
			staffName: this.staffName,
			type: this.type,
			reason: this.reason,
			length: this.length
		};
	}

	public async createKick() {
		const kick = await container.db.modlog.create({
			data: this
		});

		await this.sendModlog(kick.id);
	}

	public async createWarn() {
		const warn = await container.db.warn.create({
			data: {
				memberId: this.memberId,
				warnUid: new CardinalIndexBuilder().generateUuid(),
				modlog: {
					create: await this.createModlog()
				}
			}
		});

		await this.sendModlog(warn.modlogId);
		this.warn = warn as Prisma.WarnCreateNestedManyWithoutModlogInput;
		return this;
	}

	public async createModnick(data: ModnickCreateInput) {
		const modnick = await container.db.modnick.upsert({
			where: {
				memberId: this.memberId
			},
			update: {
				guildId: this.guildId,
				memberId: this.memberId,
				originalNickname: data.originalNickname,
				moderatedNickname: data.moderatedNickname,
				frozen: data.frozen,

				modlog: {
					create: await this.createModlog()
				}
			},
			create: {
				guildId: this.guildId,
				memberId: this.memberId,
				originalNickname: data.originalNickname,
				moderatedNickname: data.moderatedNickname,
				frozen: data.frozen,

				modlog: {
					create: await this.createModlog()
				}
			}
		});

		await this.sendModlog(modnick.modlogId);
		this.modnick = modnick as Prisma.ModnickCreateNestedManyWithoutModlogInput;
		return this;
	}

	public async createMute(data: MuteCreateInput) {
		const mute = await container.db.mute.create({
			data: {
				expiresAt: data.expiresAt,
				memberId: this.memberId,
				removedRoles: data.removedRoles ? data.removedRoles : [],
				modlog: {
					create: await this.createModlog()
				}
			}
		});

		if (data.expiresAt) {
			const offset = data.expiresAt.getTime() - Date.now();
			container.tasks.create('UnmuteMemberTask', { muteId: mute.id }, offset);
		}

		await this.sendModlog(mute.modlogId);

		return this;
	}

	public async createBan(data: BanCreateInput) {
		const ban = await container.db.ban.create({
			data: {
				expiresAt: data.expiresAt,
				memberId: this.memberId,

				modlog: {
					create: await this.createModlog()
				}
			}
		});

		if (data.expiresAt) {
			const offset = data.expiresAt.getTime() - Date.now();
			container.tasks.create('UnbanMemberTask', { banId: ban.id }, offset);
		}

		await this.sendModlog(ban.modlogId);
		return this;
	}

	public async createUnwarn() {
		const unwarn = await container.db.modlog.create({ data: this });
		await this.sendModlog(unwarn.id);
	}

	public async createUnmute() {
		const unmute = await container.db.modlog.create({ data: this });
		console.log('hi');
		await this.sendModlog(unmute.id);
	}

	public async createUnban() {
		const unban = await container.db.modlog.create({ data: this });
		await this.sendModlog(unban.id);
	}

	public async createAfkClear() {
		const afkclear = await container.db.modlog.create({ data: this });
		await this.sendModlog(afkclear.id);
	}

	public async createAfkReset() {
		const afkreset = await container.db.modlog.create({ data: this });
		await this.sendModlog(afkreset.id);
	}

	private async sendModlog(modlogId: number) {
		const guild = container.client.guilds.cache.get(this.guildId) ?? (await container.client.guilds.fetch(this.guildId));
		if (!guild) return;

		const modlogChannel = await guild.settings.channels.modlog();
		if (!modlogChannel) return;

		const modlogEmbed = new CardinalEmbedBuilder()
			.setColor(CardinalColors.Warn)
			.setAuthor({ name: `Case ${modlogId} | ${capitalizeWords(this.type)} | ${this.memberName}` })
			.addFields(
				{
					name: 'User',
					value: `<@${this.memberId}>`,
					inline: true
				},
				{
					name: 'Moderator',
					value: `<@${this.staffId}>`,
					inline: true
				}
			);

		if (this.length) {
			modlogEmbed.addFields({
				name: 'Length',
				value: `${this.length}`,
				inline: true
			});
		}

		modlogEmbed.addFields({
			name: 'Reason',
			value: `${this.reason}`,
			inline: true
		});

		try {
			await modlogChannel.send({
				embeds: [modlogEmbed]
			});
		} catch (ignored) {}
	}

	public async getModlog(caseId: number, guildId: string) {
		return await container.db.modlog.findUnique({
			where: {
				guildId_caseId: {
					guildId: guildId,
					caseId: caseId
				}
			}
		});
	}
}

type BanCreateInput = MuteCreateInput;

type MuteCreateInput = {
	expiresAt?: Date | Nullish;
	removedRoles?: string[] | Nullish;
};

type ModlogCreateInput = {
	member: GuildMember | User;
	staff: GuildMember;
	type: ModerationType;
	reason?: string | Nullish;
	length?: string | Nullish;
	caseId?: number | Nullish;
};

type ModnickCreateInput = {
	originalNickname: string;
	moderatedNickname: string;
	frozen?: boolean;
};
