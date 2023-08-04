import type { CardinalCommand } from '#lib/structures';
import { isAdmin, isGuildOwner, isModerator, isOwner, isStaff, isTrainee } from '#utils/functions';
import { createFunctionPrecondition } from '@sapphire/decorators';
import { UserError } from '@sapphire/framework';

export const PermissionLevel = (level: PermissionLevel): MethodDecorator => {
	return createFunctionPrecondition(async (message: CardinalCommand.Message) => {
		console.log('hi');
		const serverowner = isGuildOwner(message.member);
		const admin = serverowner || (await isAdmin(message.member));
		const mod = admin || (await isModerator(message.member));
		const staff = mod || (await isStaff(message.member));
		const trainee = staff || (await isTrainee(message.member));
		console.log(admin, mod, staff, trainee);

		if (isOwner(message.member)) return true;

		let error: string;
		switch (level) {
			case 'Administrator':
				error = `This command is only for administrators *(and above)*`;
				if (!admin) throw new UserError({ identifier: 'PermissionLevelError', message: error });
				return admin;
			case 'Moderator':
				error = `This command is only for moderators *(and above)*`;
				if (!mod) throw new UserError({ identifier: 'PermissionLevelError', message: error });
				return mod;
			case 'Staff':
				error = `This command is only for staffs *(and above)*`;
				if (!staff) throw new UserError({ identifier: 'PermissionLevelError', message: error });
				return staff;
			case 'Trainee':
				error = `This command is only for trainees *(and above)*`;
				if (!trainee) throw new UserError({ identifier: 'PermissionLevelError', message: error });
				return trainee;
			case 'ServerOwner':
				error = `You ain't the server owner`;
				if (!serverowner) throw new UserError({ identifier: 'PermissionLevelError', message: error });
				return serverowner;
			case 'Everyone':
				return true;
		}
	});
};

export type PermissionLevel = 'Administrator' | 'Moderator' | 'Staff' | 'Trainee' | 'ServerOwner' | 'Everyone';
