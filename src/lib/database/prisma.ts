import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const xprisma = new PrismaClient().$extends({
	name: 'xprisma',
	model: {
		guild: {
			async getMuteRole(guildId: string) {
				return (
					(
						await prisma.guild.findUnique({
							where: {
								guildId
							}
						})
					)?.roleMuted ?? null
				);
			}
		}
	}
});
