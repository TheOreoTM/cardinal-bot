import { CardinalEvents, type GuildChannel, type GuildMessage } from '#lib/types';
import type { AutomodRule, Automod } from '#lib/types/Data';
import { isAdmin } from '#utils/functions';
import { Listener, type Awaitable, type ListenerOptions, type PieceContext, UserError } from '@sapphire/framework';
import type { GuildMember, Role } from 'discord.js';
import { floatPromise, minutes } from '#utils/common';
import { canSendMessages } from '@sapphire/discord.js-utilities';
import { InfractionManager, Modlog } from '#lib/structures';
import { ModerationType, type ModerationActionType } from '#utils/moderationConstants';
import { DurationFormatter, Duration } from '@sapphire/time-utilities';
import { muteMember } from '#utils/utils';
import type { AutomodLinkCooldown } from '@prisma/client';

export abstract class ModerationMessageListener<T = unknown> extends Listener {
	private readonly rule: AutomodRule;
	public readonly reason: string;

	public constructor(context: PieceContext, options: ModerationMessageListener.Options) {
		super(context, { ...options, event: CardinalEvents.GuildUserMessage });
		this.rule = options.rule;
		this.reason = options.reason;
	}

	public async run(message: GuildMessage) {
		const shouldRun = await this.checkPreRun(message);
		if (!shouldRun) return;
		const isGuildAdmin = await isAdmin(message.member);
		if (isGuildAdmin && !isGuildAdmin) return;

		const preProcessed = await this.preProcess(message);
		if (preProcessed === null) return;
		const setting = (await message.guild.settings.automod.getSetting(this.rule))!;

		console.log('Proccessing soft punishment');
		await this.processSoftPunishment(message, preProcessed);

		const infractionManager = InfractionManager.getInstance();
		let duration: number;
		switch (this.rule) {
			case 'linkCooldown':
				duration = (setting as AutomodLinkCooldown).cooldown ?? minutes(5);
				break;

			default:
				duration = minutes(5);
				break;
		}
		infractionManager.addHeat(message.author.id, this.rule, 1, duration);
		const currentViolations = infractionManager.getHeat(message.author.id, this.rule);
		console.log(currentViolations, setting.automuteAfter);
		if (currentViolations >= setting.automuteAfter) {
			infractionManager.setHeat(message.member.id, this.rule, 0);
			if (!setting.actions) return;
			for (const action of setting.actions) {
				this.processHardPunishment(message, action, setting);
				console.log('Proccessing hard punishment');
			}
		}
	}

	protected async processSoftPunishment(message: GuildMessage, preProcessed: T) {
		if (message.deletable) {
			floatPromise(this.onDelete(message, preProcessed) as any);
		}

		if (canSendMessages(message.channel)) {
			floatPromise(this.onAlert(message, preProcessed) as any);
		}
	}

	protected async processHardPunishment(message: GuildMessage, action: ModerationActionType, settings: Automod) {
		switch (action) {
			case ModerationType.Warn:
				await this.onWarning(message);
				break;
			case ModerationType.Kick:
				await this.onKick(message);
				break;
			case ModerationType.Mute:
				const textTime = new DurationFormatter().format(settings.automuteDuration);
				const duration = new Duration(textTime);
				await this.onMute(message, duration);
				break;
			case ModerationType.Ban:
				await this.onBan(message);
				break;
		}
	}

	protected async onWarning(message: GuildMessage) {
		const staff = message.guild.members.me ?? (await message.guild.members.fetchMe());
		const modlog = new Modlog({ member: message.member, staff, type: ModerationType.Warn, reason: this.reason });
		await modlog.createWarn();
	}

	protected async onKick(message: GuildMessage) {
		const staff = message.guild.members.me ?? (await message.guild.members.fetchMe());
		await message.member.kick().catch((err) => new UserError({ message: err.message, identifier: 'KickError' }));

		const modlog = new Modlog({
			member: message.member,
			staff: staff,
			type: ModerationType.Kick,
			reason: this.reason
		});
		await modlog.createKick();
	}

	protected async onMute(message: GuildMessage, duration: Duration) {
		const staff = message.guild.members.me ?? (await message.guild.members.fetchMe());
		const muteRoleId = await message.guild.settings.roles.mute();
		let muteRole: Role | undefined;
		muteRole = message.member.roles.cache.get(muteRoleId);
		if (!muteRole) {
			muteRole = message.guild.roles.cache.find((role) => role.name.toLowerCase() === 'muted');
		}
		if (!muteRole) return;

		await muteMember(message, message.member, staff, muteRole, this.reason, duration);
	}

	protected async onBan(message: GuildMessage) {
		const staff = message.guild.members.me ?? (await message.guild.members.fetchMe());
		await message.member.ban().catch((err) => new UserError({ message: err.message, identifier: 'BanError' }));

		const modlog = new Modlog({
			member: message.member,
			staff: staff,
			type: ModerationType.Ban,
			reason: this.reason,
			length: null
		});
		modlog.createBan({});

		// let modlog: Modlog;
		// if (duration) {
		// 	modlog = new Modlog({
		// 		member: message.member,
		// 		staff: staff,
		// 		type: ModerationType.Ban,
		// 		reason: this.reason,
		// 		length: length ? new DurationFormatter().format(duration?.offset) : null
		// 	});
		// 	modlog.createBan({ expiresAt: duration.fromNow });
		// } else {
		// 	modlog = new Modlog({
		// 		member: message.member,
		// 		staff: staff,
		// 		type: ModerationType.Ban,
		// 		reason: this.reason,
		// 		length: null
		// 	});
		// 	modlog.createBan({});
		// }
	}

	protected abstract preProcess(message: GuildMessage): Promise<T | null> | T | null;
	protected abstract onDelete(message: GuildMessage, value: T): Awaitable<unknown>;
	protected abstract onAlert(message: GuildMessage, value: T): Awaitable<unknown>;
	// protected abstract onLogMessage(message: GuildMessage, value: T): Awaitable<CardinalEmbedBuilder>;

	private async checkPreRun(message: GuildMessage) {
		let enabled = false;
		const ruleData = await message.guild.settings.automod.getSetting(this.rule);
		if (!ruleData) return false;

		enabled = ruleData.enabled;

		return enabled && this.checkMessageChannel(ruleData, message.channel) && this.checkMemberRoles(ruleData, message.member);
	}

	private checkMessageChannel(settings: Automod, channel: GuildChannel) {
		const ignoredChannels = settings.ignoredChannels;
		if (ignoredChannels.includes(channel.id)) return false;

		return true;
	}

	private checkMemberRoles(settings: Automod, member: GuildMember | null) {
		if (member === null) return false;

		const ignoredRoles = settings.ignoredRoles;
		if (ignoredRoles.length === 0) return true;

		const { roles } = member;
		return !ignoredRoles.some((id) => roles.cache.has(id));
	}
}

export namespace ModerationMessageListener {
	export interface Options extends ListenerOptions {
		rule: AutomodRule;
		reason: string;
	}
}
