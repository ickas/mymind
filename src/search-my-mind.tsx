import { Grid, List, showToast, Toast, openExtensionPreferences } from "@raycast/api";
import { useState } from "react";
import { showFailureToast, useCachedPromise, useLocalStorage, getFavicon } from "@raycast/utils";
import { listObjects, MyMindApiError, MyMindObject } from "./api";
import { CardActions } from "./components/CardAction";

type ViewMode = "grid" | "list";
const VIEW_MODE_KEY = "mymind:viewMode";
const FALLBACK_ICON = "../assets/mymind-logo.svg";

function matchesQuery(obj: MyMindObject, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    obj.title.toLowerCase().includes(q) ||
    obj.tags.some((tag) => tag.name.toLowerCase().includes(q)) ||
    (obj.source?.url.toLowerCase().includes(q) ?? false)
  );
}

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
    async () => {
      try {
        return await listObjects({ limit: 1000 });
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
        showFailureToast(error, { title: "Failed to fetch your mind" });
        return [];
      }
    },
    [],
    { keepPreviousData: true },
  );

  const filtered = (objects ?? []).filter((obj) => matchesQuery(obj, searchText));
  const loading = isLoading || viewModeLoading;

  if (viewMode === "list") {
    return (
      <List
        isLoading={loading}
        onSearchTextChange={setSearchText}
        searchBarPlaceholder="Search your mind..."
        searchBarAccessory={
          <List.Dropdown tooltip="View" value={viewMode} onChange={(v) => setViewMode(v as ViewMode)}>
            <List.Dropdown.Item title="Grid" value="grid" />
            <List.Dropdown.Item title="List" value="list" />
          </List.Dropdown>
        }
        throttle
      >
        {filtered.map((obj) => (
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
      searchBarPlaceholder="Search your mind..."
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
      {filtered.map((obj) => (
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
