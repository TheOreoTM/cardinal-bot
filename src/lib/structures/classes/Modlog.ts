import type { Prisma } from '@prisma/client';
import { container } from '@sapphire/pieces';
import { GuildMember, type User } from 'discord.js';
import { CardinalIndexBuilder } from '#lib/structures/classes/CardinalIndexBuilder';
import { ModerationType } from '#utils/moderationConstants';
import type { Nullish } from '@sapphire/utilities';

export class Modlog implements Prisma.ModlogCreateInput {
	staffId: string;
	staffName: string;
	memberId: string;
	guildId: string;
	memberName: string;
	reason?: string | null | undefined;
	type: string;
	length?: string | null | undefined;
	createdAt?: string | Date | undefined;
	warn?: Prisma.WarnCreateNestedManyWithoutModlogInput | undefined;
	modnick?: Prisma.ModnickCreateNestedManyWithoutModlogInput | undefined;
	mute?: Prisma.MuteCreateNestedManyWithoutModlogInput | undefined;

	public constructor(data: ModlogCreateInput) {
		this.memberId = data.member.id;
		this.memberName = data.member instanceof GuildMember ? data.member.user.username : data.member.username;
		this.staffId = data.staff.id;
		this.staffName = data.staff.user.username;
		this.type = data.type;
		this.reason = data.reason ? data.reason : 'No reason';
		this.length = data.length;
		this.guildId = data.staff.guild.id;
	}

	public async createKick() {
		await container.db.modlog.create({
			data: this
		});
	}

	public async createWarn() {
		const warn = await container.db.warn.create({
			data: {
				memberId: this.memberId,
				warnUid: new CardinalIndexBuilder().generateUuid(),
				modlog: {
					create: {
						guildId: this.guildId,
						memberId: this.memberId,
						memberName: this.memberName,
						staffId: this.staffId,
						staffName: this.staffName,
						type: this.type,
						length: this.length,
						reason: this.reason
					}
				}
			}
		});
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
					create: {
						memberId: this.memberId,
						guildId: this.guildId,
						memberName: this.memberName,
						staffId: this.staffId,
						staffName: this.staffName,
						type: this.type,
						length: this.length,
						reason: this.reason
					}
				}
			},
			create: {
				guildId: this.guildId,
				memberId: this.memberId,
				originalNickname: data.originalNickname,
				moderatedNickname: data.moderatedNickname,
				frozen: data.frozen,

				modlog: {
					create: {
						memberId: this.memberId,
						guildId: this.guildId,
						memberName: this.memberName,
						staffId: this.staffId,
						staffName: this.staffName,
						type: this.type,
						length: this.length,
						reason: this.reason
					}
				}
			}
		});

		this.modnick = modnick as Prisma.ModnickCreateNestedManyWithoutModlogInput;
		return this;
	}

	public async createMute(data: MuteCreateInput) {
		await container.db.mute.create({
			data: {
				expiresAt: data.expiresAt,
				memberId: this.memberId,
				modlog: {
					create: {
						guildId: this.guildId,
						memberId: this.memberId,
						memberName: this.memberName,
						staffId: this.staffId,
						staffName: this.staffName,
						type: this.type,
						reason: this.reason,
						length: this.length
					}
				}
			}
		});

		return this;
	}

	public async createBan(data: BanCreateInput) {
		await container.db.ban.create({
			data: {
				expiresAt: data.expiresAt,
				memberId: this.memberId,
				modlog: {
					create: {
						guildId: this.guildId,
						memberId: this.memberId,
						memberName: this.memberName,
						staffId: this.staffId,
						staffName: this.staffName,
						type: this.type,
						reason: this.reason,
						length: this.length
					}
				}
			}
		});

		return this;
	}

	public async createUnwarn() {
		await container.db.modlog.create({ data: this });
	}

	public async createUnmute() {
		await container.db.modlog.create({ data: this });
	}

	public async createUnban() {
		await container.db.modlog.create({ data: this });
	}
}

type BanCreateInput = MuteCreateInput;

type MuteCreateInput = {
	expiresAt?: Date | Nullish;
};

type ModlogCreateInput = {
	member: GuildMember | User;
	staff: GuildMember;
	type: ModerationType;
	reason?: string | Nullish;
	length?: string | Nullish;
};

type ModnickCreateInput = {
	originalNickname: string;
	moderatedNickname: string;
	frozen?: boolean;
};
