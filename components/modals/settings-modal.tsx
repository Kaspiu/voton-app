"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ModeToggle } from "@/components/mode-toggle";
import { ClearModal } from "@/components/modals/clear-modal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useFocusMode } from "@/hooks/use-focus-mode";
import { useSettings } from "@/hooks/use-settings";
import {
  clearAllData,
  exportData,
  importData,
} from "@/lib/database/export-import";

interface SettingsItemProps {
  title: string;
  description: string;
  onAction: () => void;
  buttonLabel?: string;
  isClear?: boolean;
}

const SettingsItem = ({
  title,
  description,
  onAction,
  buttonLabel,
  isClear,
}: SettingsItemProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-2 mr-8">
        <Label>{title}</Label>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      {isClear ? (
        <ClearModal onClear={onAction} />
      ) : (
        <Button
          onClick={onAction}
          variant="outline"
          size="sm"
          className="cursor-pointer text-xs text-muted-foreground"
        >
          {buttonLabel}
        </Button>
      )}
    </div>
  );
};

export const SettingsModal = () => {
  const router = useRouter();
  const { isOpen, onClose, restoreLastPage, setRestoreLastPage } =
    useSettings();
  const { isFocusMode, setFocusMode } = useFocusMode();

  // Triggers a data import, closes the modal on success, and shows a toast for each state.
  const onImportData = () => {
    const promise = importData().then(onClose);

    toast.promise(promise, {
      loading: "Importing data...",
      success: "Data imported successfully!",
      error: "Failed to import data.",
    });
  };

  // Triggers a data export and shows a toast for each state.
  const onExportData = () => {
    const promise = exportData();

    toast.promise(promise, {
      loading: "Exporting data...",
      success: "Data exported successfully!",
      error: "Failed to export data.",
    });
  };

  // Clears all workspace data, redirects to the documents root, and shows a toast for each state.
  const onClearData = () => {
    const promise = clearAllData().then(() => router.push("/documents"));

    toast.promise(promise, {
      loading: "Clearing all data...",
      success: "All data cleared!",
      error: "Failed to clear data.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent closeClassName="top-6 right-6">
        <DialogHeader className="border-b pb-4">
          <DialogTitle>Workspace settings</DialogTitle>
        </DialogHeader>

        <h3 className="text-lg font-semibold leading-none">Preferences</h3>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2 mr-12">
              <Label>Theme</Label>
              <span className="text-xs text-muted-foreground">
                Choose a light or dark theme, or follow your system.
              </span>
            </div>
            <ModeToggle />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2 mr-12">
              <Label htmlFor="focus-mode">Focus mode</Label>
              <span
                id="focus-mode-description"
                className="text-xs text-muted-foreground"
              >
                Hide the sidebar and navbar while writing on desktop.
              </span>
            </div>
            <Switch
              id="focus-mode"
              aria-describedby="focus-mode-description"
              checked={isFocusMode}
              onCheckedChange={setFocusMode}
              className="cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2 mr-12">
              <Label htmlFor="restore-last-opened-page">
                Restore last opened page
              </Label>
              <span
                id="restore-last-opened-page-description"
                className="text-xs text-muted-foreground"
              >
                Reopen your last visited page when you return to Voton.
              </span>
            </div>
            <Switch
              id="restore-last-opened-page"
              aria-describedby="restore-last-opened-page-description"
              checked={restoreLastPage}
              onCheckedChange={setRestoreLastPage}
              className="cursor-pointer"
            />
          </div>
        </div>

        <Separator />

        <h3 className="text-lg font-semibold leading-none">Data management</h3>
        <p className="text-xs text-muted-foreground">
          Pages and folders are saved in this browser, without automatic sync.
        </p>
        <div className="flex flex-col gap-4">
          <SettingsItem
            title="Import data"
            description="Merge a Voton JSON export, or create a page from Markdown."
            buttonLabel="Import"
            onAction={onImportData}
          />
          <SettingsItem
            title="Export data"
            description="Download all your pages and folders as a JSON backup."
            buttonLabel="Export"
            onAction={onExportData}
          />
        </div>

        <SettingsItem
          title="Clear data"
          description="Permanently delete all pages and folders from this browser."
          onAction={onClearData}
          isClear
        />

        <Separator />

        <div className="text-xs text-muted-foreground font-mono">v0.2.68</div>
      </DialogContent>
    </Dialog>
  );
};
