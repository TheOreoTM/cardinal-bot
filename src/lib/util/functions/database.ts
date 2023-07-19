import type { Prisma } from '@prisma/client';
import { container } from '@sapphire/framework';

/**
 *
 * @param userId The id of the user you want to check
 * @returns Boolean true if the user is registered or false otherwise
 */
export async function isUserRegistered(userId: string): Promise<boolean> {
	const data = await container.db.user.findUnique({
		where: {
			userId
		}
	});

	return data ? true : false;
}

/**
 *
 * @param userId The id og the user you want to get
 * @returns An `User` object if exists, otherwise null
 *
 */
export async function getUser(userId: string, select?: Prisma.UserSelect) {
	const user = await container.db.user.findUnique({ where: { userId }, select: select });
	return user ? user : null;
}
