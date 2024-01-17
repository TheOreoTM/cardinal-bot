import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const Note = pgTable('Note', {
	id: serial('id').primaryKey(),
	noteId: integer('noteId'),
	guildId: text('guildId'),
	userId: text('userId'),
	staffId: text('staffId'),
	staffName: text('staffName'),
	note: text('note'),
	createdAt: timestamp('createdAt').default(new Date())
});
