import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const bookings = sqliteTable(
	'bookings',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		title: text('title').notNull(),
		description: text('description'),
		name: text('name').notNull(),
		contact: text('contact').notNull(),
		isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
		/** true = ohne angegebene Endzeit eingetragen („offenes Ende") */
		openEnd: integer('open_end', { mode: 'boolean' }).notNull().default(false),
		/** Beginn als Unix-Zeit in Millisekunden (UTC) */
		startsAt: integer('starts_at').notNull(),
		/** Ende als Unix-Zeit in Millisekunden (UTC), immer > startsAt */
		endsAt: integer('ends_at').notNull(),
		/** SHA-256-Hex-Hash des geheimen Bearbeitungs-Tokens */
		editTokenHash: text('edit_token_hash').notNull(),
		createdAt: integer('created_at').notNull()
	},
	(t) => [
		index('idx_bookings_starts_at').on(t.startsAt),
		index('idx_bookings_ends_at').on(t.endsAt)
	]
);

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
