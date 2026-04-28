import { api } from "./client";
import { MyMindObject, MyMindObjectSchema, ObjectListSchema, RelatedMatchListSchema, RelatedMatch } from "./schemas";

export interface ListObjectsOptions {
  id?: string;
  limit?: number;
  signal?: AbortSignal;
}

export async function listObjects(opts: ListObjectsOptions = {}): Promise<MyMindObject[]> {
  const data = await api.get<unknown>("/objects", {
    query: { id: opts.id, limit: opts.limit },
    signal: opts.signal,
  });
  return ObjectListSchema.parse(data);
}

export async function getObject(id: string, signal?: AbortSignal): Promise<MyMindObject> {
  const data = await api.get<unknown>(`/objects/${encodeURIComponent(id)}`, { signal });
  return MyMindObjectSchema.parse(data);
}

export async function getRelated(id: string, limit = 50, signal?: AbortSignal): Promise<RelatedMatch[]> {
  const data = await api.get<unknown>(`/objects/${encodeURIComponent(id)}/related`, {
    query: { limit },
    signal,
  });
  return RelatedMatchListSchema.parse(data);
}

interface CreateBase {
  title?: string;
  tags?: string[];
  spaceIds?: string[];
}

export type CreateObjectInput =
  | ({ kind: "note"; markdown: string } & CreateBase)
  | ({ kind: "url"; url: string } & CreateBase);

interface CreateObjectResponse {
  id: string;
  title?: string;
  created?: string;
  modified?: string;
  bumped?: string;
}

function buildCreateBody(input: CreateObjectInput): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (input.title) body.title = input.title;
  if (input.tags?.length) body.tags = input.tags.map((name) => ({ name }));
  if (input.spaceIds?.length) body.spaces = input.spaceIds.map((id) => ({ id }));
  if (input.kind === "note") {
    body.content = input.markdown;
  } else if (input.kind === "url") {
    body.url = input.url;
  }
  return body;
}

export async function createObject(input: CreateObjectInput): Promise<CreateObjectResponse> {
  return api.post<CreateObjectResponse>("/objects", buildCreateBody(input));
}

export async function deleteObject(id: string): Promise<void> {
  await api.delete(`/objects/${encodeURIComponent(id)}`);
}

export async function restoreObject(id: string): Promise<void> {
  await api.post(`/objects/${encodeURIComponent(id)}/restore`);
}

export async function addTagsToObject(id: string, tags: string[]): Promise<void> {
  if (!tags.length) return;
  await api.post(
    `/objects/${encodeURIComponent(id)}/tags`,
    tags.map((name) => ({ name })),
  );
}

export async function pinObject(id: string, position?: number): Promise<void> {
  await api.post(`/objects/${encodeURIComponent(id)}/pin`, position !== undefined ? { position } : undefined);
}

export async function unpinObject(id: string): Promise<void> {
  await api.delete(`/objects/${encodeURIComponent(id)}/pin`);
}

export async function updateObjectTitle(id: string, title: string): Promise<void> {
  await api.patch(`/objects/${encodeURIComponent(id)}`, { title });
}

export type ContentFormat = "markdown" | "prose" | "html";

const CONTENT_ACCEPT: Record<ContentFormat, string> = {
  markdown: "text/markdown",
  prose: "application/prose+json",
  html: "text/html",
};

export async function getObjectContent(id: string, format: ContentFormat = "markdown"): Promise<string> {
  const response = await api.getRaw(`/objects/${encodeURIComponent(id)}/content`, {
    accept: CONTENT_ACCEPT[format],
  });
  return response.text();
}

export async function updateObjectContent(
  id: string,
  content: string,
  format: Exclude<ContentFormat, "html"> = "markdown",
): Promise<void> {
  await api.put(`/objects/${encodeURIComponent(id)}/content`, content, {
    contentType: format === "markdown" ? "text/markdown" : "application/prose+json",
  });
}

export interface ObjectDownload {
  url: string;
  contentType?: string;
}

export async function getObjectDownloadUrl(id: string): Promise<ObjectDownload> {
  return {
    url: `https://api.mymind.com/objects/${encodeURIComponent(id)}/download`,
    contentType: undefined,
  };
}
