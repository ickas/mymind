import { List, showToast, Toast, openExtensionPreferences } from "@raycast/api";
import { useState } from "react";
import { showFailureToast, useCachedPromise, getFavicon } from "@raycast/utils";
import { listObjects, MyMindApiError } from "./api";
import { CardActions } from "./components/CardAction";

export default function Command() {
  const [searchText, setSearchText] = useState("");

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

  const filtered = (objects ?? []).filter((obj) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      obj.title?.toLowerCase().includes(q) ||
      obj.tags?.some((tag) => tag.name.toLowerCase().includes(q)) ||
      obj.source?.url.toLowerCase().includes(q)
    );
  });

  return (
    <List isLoading={isLoading} onSearchTextChange={setSearchText} searchBarPlaceholder="Search your mind..." throttle>
      {filtered.map((obj) => (
        <List.Item
          key={obj.id}
          icon={obj.source?.url ? getFavicon(obj.source.url) : "../assets/mymind-logo.svg"}
          title={obj.title || "Untitled"}
          subtitle={obj.source?.url}
          accessories={[{ date: new Date(obj.modified) }]}
          actions={<CardActions object={obj} onChange={revalidate} />}
        />
      ))}
    </List>
  );
}
