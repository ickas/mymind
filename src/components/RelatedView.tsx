import { Grid, List } from "@raycast/api";
import { useCachedPromise, useLocalStorage, showFailureToast } from "@raycast/utils";
import { getObject, getRelated, MyMindObject } from "../api";
import { GridCardItem, ListCardItem } from "./CardItem";

type ViewMode = "grid" | "list";
const VIEW_MODE_KEY = "mymind:viewMode";
const RELATED_LIMIT = 50;

async function loadRelated(id: string): Promise<MyMindObject[]> {
  const matches = await getRelated(id, RELATED_LIMIT);
  if (matches.length === 0) return [];
  const fetched = await Promise.all(matches.map((m) => getObject(m.id).catch(() => null)));
  return fetched.filter((o): o is MyMindObject => o !== null);
}

export function RelatedView({ source }: { source: MyMindObject }) {
  const { value: viewMode = "grid", isLoading: vmLoading } = useLocalStorage<ViewMode>(VIEW_MODE_KEY, "grid");

  const {
    isLoading,
    data: objects = [],
    revalidate,
  } = useCachedPromise(loadRelated, [source.id], {
    onError(error) {
      showFailureToast(error, { title: "Failed to fetch related" });
    },
  });

  const loading = isLoading || vmLoading;
  const navTitle = source.title ? `Related to "${source.title}"` : "Related";

  if (viewMode === "list") {
    return (
      <List isLoading={loading} navigationTitle={navTitle}>
        {objects.map((o) => (
          <ListCardItem key={o.id} object={o} onChange={revalidate} />
        ))}
      </List>
    );
  }

  return (
    <Grid
      isLoading={loading}
      navigationTitle={navTitle}
      columns={5}
      aspectRatio="3/2"
      fit={Grid.Fit.Contain}
      inset={Grid.Inset.Medium}
    >
      {objects.map((o) => (
        <GridCardItem key={o.id} object={o} onChange={revalidate} />
      ))}
    </Grid>
  );
}
