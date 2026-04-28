import { z } from "zod";

export const ObjectTagSchema = z.object({
  name: z.string(),
  flags: z.number().optional(),
});
export type ObjectTag = z.infer<typeof ObjectTagSchema>;

export const ObjectSpaceSchema = z.object({
  id: z.string(),
});
export type ObjectSpace = z.infer<typeof ObjectSpaceSchema>;

export const ObjectSourceSchema = z.object({
  url: z.string(),
});
export type ObjectSource = z.infer<typeof ObjectSourceSchema>;

export const ObjectNoteSchema = z.object({
  id: z.string(),
  content: z.unknown().optional(),
});
export type ObjectNote = z.infer<typeof ObjectNoteSchema>;

export const MyMindObjectSchema = z.object({
  id: z.string(),
  title: z.string().optional().default(""),
  content: z.unknown().optional(),
  spaces: z.array(ObjectSpaceSchema).optional().default([]),
  tags: z.array(ObjectTagSchema).optional().default([]),
  notes: z.array(ObjectNoteSchema).optional(),
  source: ObjectSourceSchema.optional(),
  bumped: z.string(),
  created: z.string(),
  modified: z.string(),
  deleted: z.string().optional(),
});
export type MyMindObject = z.infer<typeof MyMindObjectSchema>;

export const ObjectListSchema = z.array(MyMindObjectSchema);

export const SearchResultSchema = z.object({
  id: z.string(),
  score: z.number(),
  semanticScore: z.number().optional(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;
export const SearchResultListSchema = z.array(SearchResultSchema);

export const SpaceObjectRefSchema = z.object({
  id: z.string(),
});

export const SpaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
  created: z.string().optional(),
  objects: z.array(SpaceObjectRefSchema).optional(),
});
export type Space = z.infer<typeof SpaceSchema>;
export const SpaceListSchema = z.array(SpaceSchema);

export const TagSchema = z.object({
  name: z.string(),
  flags: z.number().optional(),
});
export type Tag = z.infer<typeof TagSchema>;
export const TagListSchema = z.array(TagSchema);

export const RelatedMatchSchema = z.object({
  id: z.string(),
  score: z.number(),
});
export type RelatedMatch = z.infer<typeof RelatedMatchSchema>;
export const RelatedMatchListSchema = z.array(RelatedMatchSchema);
