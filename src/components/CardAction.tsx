import {
  ActionPanel,
  Action,
  Icon,
  showToast,
  Toast,
  confirmAlert,
  Alert,
  Keyboard,
  Detail,
  Clipboard,
} from "@raycast/api";
import { showFailureToast, useCachedPromise } from "@raycast/utils";
import { deleteObject, getObjectContent, MyMindObject } from "../api";
import AddNote from "../add-a-new-note";
import { RelatedView } from "./RelatedView";

const MYMIND_WEB_URL = "https://access.mymind.com/everything";

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function CardDetail({ object, onChange }: { object: MyMindObject; onChange?: () => void }) {
  const { isLoading, data: markdown = "" } = useCachedPromise(
    (id: string) => getObjectContent(id, "markdown").catch(() => ""),
    [object.id],
  );
  const heading = object.title ? `# ${object.title}\n\n` : "";

  return (
    <Detail
      isLoading={isLoading}
      markdown={heading + markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Created" text={new Date(object.created).toLocaleString()} />
          <Detail.Metadata.Label title="Modified" text={new Date(object.modified).toLocaleString()} />
          {object.entityType && <Detail.Metadata.Label title="Type" text={object.entityType} />}
          {object.source?.url && (
            <Detail.Metadata.Link title="Source" target={object.source.url} text={safeHostname(object.source.url)} />
          )}
          {object.tags.length > 0 && (
            <Detail.Metadata.TagList title="Tags">
              {object.tags.map((t) => (
                <Detail.Metadata.TagList.Item key={t.name} text={t.name} />
              ))}
            </Detail.Metadata.TagList>
          )}
        </Detail.Metadata>
      }
      actions={<CardActions object={object} onChange={onChange} hideDetailAction />}
    />
  );
}

export function CardActions({
  object,
  onChange,
  hideDetailAction = false,
}: {
  object: MyMindObject;
  onChange?: () => void;
  hideDetailAction?: boolean;
}) {
  const mymindUrl = `${MYMIND_WEB_URL}/#${object.id}`;

  const handleDelete = async () => {
    const proceed = await confirmAlert({
      title: "Delete card",
      message: "Move this card to the trash? You can restore it within 30 days.",
      primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
    });
    if (!proceed) return;
    try {
      await deleteObject(object.id);
      await showToast({ style: Toast.Style.Success, title: "Card deleted" });
      onChange?.();
    } catch (error) {
      await showFailureToast(error, { title: "Failed to delete card" });
    }
  };

  const handleCopyMarkdown = async () => {
    const toast = await showToast({ style: Toast.Style.Animated, title: "Fetching content…" });
    try {
      const markdown = await getObjectContent(object.id, "markdown");
      await Clipboard.copy(markdown);
      toast.style = Toast.Style.Success;
      toast.title = "Copied as markdown";
    } catch (error) {
      toast.hide();
      await showFailureToast(error, { title: "Failed to copy markdown" });
    }
  };

  return (
    <ActionPanel>
      <ActionPanel.Section>
        {!hideDetailAction && (
          <Action.Push
            title="Show Details"
            icon={Icon.Sidebar}
            target={<CardDetail object={object} onChange={onChange} />}
          />
        )}
        <Action.Push
          title="Find Related"
          icon={Icon.Network}
          target={<RelatedView source={object} />}
          shortcut={{ modifiers: ["cmd", "shift"], key: "r" }}
        />
        {object.source?.url && <Action.OpenInBrowser url={object.source.url} />}
        <Action.OpenInBrowser
          title="Open in Mymind"
          url={mymindUrl}
          shortcut={{ modifiers: ["cmd", "shift"], key: "return" }}
        />
      </ActionPanel.Section>
      <ActionPanel.Section>
        <Action
          title="Copy as Markdown"
          icon={Icon.Clipboard}
          onAction={handleCopyMarkdown}
          shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
        />
        {object.source?.url && <Action.CopyToClipboard title="Copy Source URL" content={object.source.url} />}
        <Action.CopyToClipboard
          title="Copy Mymind URL"
          content={mymindUrl}
          shortcut={{ modifiers: ["cmd", "shift"], key: "l" }}
        />
      </ActionPanel.Section>
      <ActionPanel.Section>
        <Action
          title="Delete Card"
          icon={Icon.Trash}
          style={Action.Style.Destructive}
          onAction={handleDelete}
          shortcut={Keyboard.Shortcut.Common.Remove}
        />
        <Action.Push
          title="Add a New Note"
          target={<AddNote />}
          icon={Icon.Plus}
          shortcut={{ modifiers: ["cmd"], key: "n" }}
        />
      </ActionPanel.Section>
    </ActionPanel>
  );
}
