import { Grid, List, showToast, Toast, openExtensionPreferences } from "@raycast/api";
import { useState } from "react";
import { showFailureToast, useCachedPromise, useLocalStorage, getFavicon } from "@raycast/utils";
import { listObjects, search, getObject, MyMindApiError, MyMindObject } from "./api";
import { CardActions } from "./components/CardAction";

type ViewMode = "grid" | "list";
const VIEW_MODE_KEY = "mymind:viewMode";
const FALLBACK_ICON = "../assets/mymind-logo.svg";
const SEARCH_LIMIT = 50;
const BROWSE_LIMIT = 1000;

function itemIcon(obj: MyMindObject) {
  return obj.source?.url ? getFavicon(obj.source.url) : FALLBACK_ICON;
}

function itemSubtitle(obj: MyMindObject): string | undefined {
  if (!obj.source?.url) return undefined;
  try {
    return new URL(obj.source.url).hostname;
  } catch {
    return obj.source.url;
  }
}

async function loadObjects(query: string): Promise<MyMindObject[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return listObjects({ limit: BROWSE_LIMIT });
  }
  const matches = await search({
    q: trimmed,
    limit: SEARCH_LIMIT,
    semantic: true,
    rerank: true,
  });
  if (matches.length === 0) return [];
  const fetched = await Promise.all(matches.map((m) => getObject(m.id).catch(() => null)));
  return fetched.filter((o): o is MyMindObject => o !== null);
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const {
    value: viewMode = "grid",
    setValue: setViewMode,
    isLoading: viewModeLoading,
  } = useLocalStorage<ViewMode>(VIEW_MODE_KEY, "grid");

  const {
    isLoading,
    data: objects,
    revalidate,
  } = useCachedPromise(
    async (query: string) => {
      try {
        return await loadObjects(query);
      } catch (error) {
        if (error instanceof MyMindApiError && error.isUnauthorized) {
          showToast({
            style: Toast.Style.Failure,
            title: "Authentication required",
            message: "Set your access key in extension preferences",
            primaryAction: {
              title: "Open Extension Preferences",
              onAction: openExtensionPreferences,
            },
          });
          return [];
        }
        showFailureToast(error, { title: "Search failed" });
        return [];
      }
    },
    [searchText],
    { keepPreviousData: true },
  );

  const items = objects ?? [];
  const loading = isLoading || viewModeLoading;

  if (viewMode === "list") {
    return (
      <List
        isLoading={loading}
        onSearchTextChange={setSearchText}
        searchBarPlaceholder="Search your mind…"
        searchBarAccessory={
          <List.Dropdown tooltip="View" value={viewMode} onChange={(v) => setViewMode(v as ViewMode)}>
            <List.Dropdown.Item title="Grid" value="grid" />
            <List.Dropdown.Item title="List" value="list" />
          </List.Dropdown>
        }
        throttle
      >
        {items.map((obj) => (
          <List.Item
            key={obj.id}
            icon={itemIcon(obj)}
            title={obj.title || "Untitled"}
            subtitle={obj.source?.url}
            accessories={[{ date: new Date(obj.modified) }]}
            actions={<CardActions object={obj} onChange={revalidate} />}
          />
        ))}
      </List>
    );
  }

  return (
    <Grid
      isLoading={loading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search your mind…"
      columns={5}
      aspectRatio="3/2"
      fit={Grid.Fit.Contain}
      inset={Grid.Inset.Medium}
      searchBarAccessory={
        <Grid.Dropdown tooltip="View" value={viewMode} onChange={(v) => setViewMode(v as ViewMode)}>
          <Grid.Dropdown.Item title="Grid" value="grid" />
          <Grid.Dropdown.Item title="List" value="list" />
        </Grid.Dropdown>
      }
      throttle
    >
      {items.map((obj) => (
        <Grid.Item
          key={obj.id}
          content={itemIcon(obj)}
          title={obj.title || "Untitled"}
          subtitle={itemSubtitle(obj)}
          actions={<CardActions object={obj} onChange={revalidate} />}
        />
      ))}
    </Grid>
  );
}
