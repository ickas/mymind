import { ActionPanel, Action, Icon, showToast, Toast, confirmAlert, Alert, Keyboard } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { deleteObject, MyMindObject } from "../api";
import AddNote from "../add-a-new-note";

const MYMIND_WEB_URL = "https://access.mymind.com/everything";

export function CardActions({ object, onChange }: { object: MyMindObject; onChange?: () => void }) {
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

  const mymindUrl = `${MYMIND_WEB_URL}/#${object.id}`;

  return (
    <ActionPanel>
      <ActionPanel.Section>
        {object.source?.url && <Action.OpenInBrowser url={object.source.url} />}
        <Action.OpenInBrowser title="Open in Mymind" url={mymindUrl} />
        {object.source?.url && <Action.CopyToClipboard title="Copy Source URL" content={object.source.url} />}
        <Action.CopyToClipboard title="Copy Mymind URL" content={mymindUrl} />
        <Action
          title="Delete Card"
          icon={Icon.Trash}
          style={Action.Style.Destructive}
          onAction={handleDelete}
          shortcut={Keyboard.Shortcut.Common.Remove}
        />
      </ActionPanel.Section>
      <ActionPanel.Section>
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
