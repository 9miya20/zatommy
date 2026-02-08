import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

const timestamp = () =>
	text('created_at')
		.notNull()
		.default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`);

const updatedAt = () =>
	text('updated_at')
		.notNull()
		.default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`);

export const users = sqliteTable(
	'users',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		email: text('email').unique().notNull(),
		name: text('name').notNull().default(''),
		createdAt: timestamp()
	},
	(table) => [index('idx_users_email').on(table.email)]
);

export const folders = sqliteTable(
	'folders',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		name: text('name').notNull(),
		ownerId: integer('owner_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		parentFolderId: integer('parent_folder_id'),
		createdAt: timestamp(),
		updatedAt: updatedAt()
	},
	(table) => [index('idx_folders_owner').on(table.ownerId)]
);

export const memos = sqliteTable(
	'memos',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		title: text('title').notNull().default(''),
		content: text('content').notNull().default(''),
		ownerId: integer('owner_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		folderId: integer('folder_id').references(() => folders.id, { onDelete: 'set null' }),
		createdAt: timestamp(),
		updatedAt: updatedAt()
	},
	(table) => [
		index('idx_memos_owner').on(table.ownerId),
		index('idx_memos_folder').on(table.folderId),
		index('idx_memos_updated').on(table.updatedAt)
	]
);


// Relations
export const usersRelations = relations(users, ({ many }) => ({
	folders: many(folders),
	memos: many(memos),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
	owner: one(users, { fields: [folders.ownerId], references: [users.id] }),
	parent: one(folders, { fields: [folders.parentFolderId], references: [folders.id], relationName: 'parentChild' }),
	children: many(folders, { relationName: 'parentChild' }),
	memos: many(memos)
}));

export const memosRelations = relations(memos, ({ one }) => ({
	owner: one(users, { fields: [memos.ownerId], references: [users.id] }),
	folder: one(folders, { fields: [memos.folderId], references: [folders.id] })
}));

