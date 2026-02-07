import { z } from 'zod';

export const loginSchema = z.object({
	email: z.string().email()
});

export const createMemoSchema = z.object({
	title: z.string().max(500).default(''),
	content: z.string().default(''),
	folderId: z.number().int().positive().nullable().optional()
});

export const updateMemoSchema = z.object({
	title: z.string().max(500).optional(),
	content: z.string().optional(),
	folderId: z.number().int().positive().nullable().optional()
});

export const createFolderSchema = z.object({
	name: z.string().min(1).max(200),
	parentFolderId: z.number().int().positive().nullable().optional()
});

export const updateFolderSchema = z.object({
	name: z.string().min(1).max(200).optional(),
	parentFolderId: z.number().int().positive().nullable().optional()
});

export const searchSchema = z.object({
	q: z.string().min(1).max(500)
});

export const paginationSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20)
});
