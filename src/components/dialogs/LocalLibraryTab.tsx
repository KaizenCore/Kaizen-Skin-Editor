import { useState, useEffect, useMemo } from 'react';
import {
  Download,
  Loader2,
  Trash2,
  Copy,
  Upload,
  MoreVertical,
  AlertTriangle,
  Pencil,
  X,
  Clock,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLocalLibraryStore } from '@/stores/localLibraryStore';
import { LocalSkinStorage, type LocalSkinEntry } from '@/lib/storage';
import { PngCodec } from '@/lib/io/PngCodec';
import { toast } from '@/lib/toast';

interface LocalLibraryTabProps {
  onLoadSkin: () => void;
  onUploadSkin?: (entry: LocalSkinEntry) => void;
}

export function LocalLibraryTab({ onLoadSkin, onUploadSkin }: LocalLibraryTabProps) {
  const {
    entries,
    isLoading,
    settings,
    initialize,
    loadEntry,
    deleteEntry,
    renameEntry,
    duplicateEntry,
    saveCurrent,
    updateSettings,
  } = useLocalLibraryStore();

  const [renamingEntry, setRenamingEntry] = useState<LocalSkinEntry | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingEntry, setDeletingEntry] = useState<LocalSkinEntry | null>(null);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleLoad = async (entry: LocalSkinEntry) => {
    await loadEntry(entry.id);
    onLoadSkin();
  };

  const handleDelete = async () => {
    if (!deletingEntry) return;
    await deleteEntry(deletingEntry.id);
    setDeletingEntry(null);
  };

  const handleRename = async () => {
    if (!renamingEntry || !renameValue.trim()) return;
    await renameEntry(renamingEntry.id, renameValue.trim());
    setRenamingEntry(null);
    setRenameValue('');
  };

  const handleDuplicate = async (entry: LocalSkinEntry) => {
    await duplicateEntry(entry.id);
  };

  const handleExport = async (entry: LocalSkinEntry) => {
    try {
      const doc = LocalSkinStorage.deserializeToDocument(entry);
      await PngCodec.downloadSkin(doc.layers, doc.format, entry.name);
      toast.success('Exported', `"${entry.name}" saved as PNG`);
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Export failed', 'Could not export skin as PNG');
    }
  };

  const handleUpload = (entry: LocalSkinEntry) => {
    if (onUploadSkin) {
      onUploadSkin(entry);
    } else {
      toast.info('Upload', 'Please load the skin first, then use the Upload dialog');
    }
  };

  const handleDismissWarning = () => {
    updateSettings({ warningDismissed: true });
  };

  const handleSaveCurrent = async () => {
    await saveCurrent();
  };

  const openRenameDialog = (entry: LocalSkinEntry) => {
    setRenamingEntry(entry);
    setRenameValue(entry.name);
  };

  const manualSaves = entries.filter((e) => !e.isAutoSave);
  const autoSaves = entries.filter((e) => e.isAutoSave);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Warning Banner */}
      {!settings.warningDismissed && (
        <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-600 dark:text-amber-400">
              Local storage is temporary
            </p>
            <p className="text-muted-foreground mt-1">
              These skins are stored in your browser and may be lost. Export to PNG or upload to
              Kaizen Core for permanent storage.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={handleDismissWarning}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {entries.length} {entries.length === 1 ? 'skin' : 'skins'} stored locally
        </p>
        <Button variant="outline" size="sm" onClick={handleSaveCurrent}>
          Save Current
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>No local skins yet</p>
            <p className="text-sm mt-1">Save your current work to see it here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Manual Saves */}
            {manualSaves.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-3">SAVED SKINS</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {manualSaves.map((entry) => (
                    <LocalSkinCard
                      key={entry.id}
                      entry={entry}
                      onLoad={() => handleLoad(entry)}
                      onDelete={() => setDeletingEntry(entry)}
                      onRename={() => openRenameDialog(entry)}
                      onDuplicate={() => handleDuplicate(entry)}
                      onExport={() => handleExport(entry)}
                      onUpload={() => handleUpload(entry)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Auto Saves */}
            {autoSaves.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-3">AUTO-SAVES</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {autoSaves.map((entry) => (
                    <LocalSkinCard
                      key={entry.id}
                      entry={entry}
                      onLoad={() => handleLoad(entry)}
                      onDelete={() => setDeletingEntry(entry)}
                      onRename={() => openRenameDialog(entry)}
                      onDuplicate={() => handleDuplicate(entry)}
                      onExport={() => handleExport(entry)}
                      onUpload={() => handleUpload(entry)}
                      isAutoSave
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Rename Dialog */}
      <Dialog open={renamingEntry !== null} onOpenChange={() => setRenamingEntry(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Skin</DialogTitle>
            <DialogDescription>Enter a new name for this skin.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Skin name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingEntry(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!renameValue.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deletingEntry !== null} onOpenChange={() => setDeletingEntry(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Skin</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingEntry?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingEntry(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Local Skin Card Component
interface LocalSkinCardProps {
  entry: LocalSkinEntry;
  onLoad: () => void;
  onDelete: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onUpload: () => void;
  isAutoSave?: boolean;
}

function LocalSkinCard({
  entry,
  onLoad,
  onDelete,
  onRename,
  onDuplicate,
  onExport,
  onUpload,
  isAutoSave,
}: LocalSkinCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Create object URL for thumbnail
  useEffect(() => {
    if (entry.thumbnail && entry.thumbnail instanceof Blob && entry.thumbnail.size > 0) {
      const url = URL.createObjectURL(entry.thumbnail);
      setThumbnailUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setThumbnailUrl(null);
    }
  }, [entry.thumbnail]);

  const timeAgo = useMemo(() => {
    return formatTimeAgo(entry.modifiedAt);
  }, [entry.modifiedAt]);

  return (
    <div className="group relative bg-card border rounded-lg overflow-hidden hover:border-primary transition-colors">
      {/* Thumbnail */}
      <div className="aspect-square bg-muted flex items-center justify-center p-2 relative">
        {thumbnailUrl && !imageError ? (
          <img
            src={thumbnailUrl}
            alt={entry.name}
            className="w-full h-full object-contain"
            style={{ imageRendering: 'pixelated' }}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No preview
          </div>
        )}
        {isAutoSave && (
          <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-medium bg-secondary text-secondary-foreground rounded">
            Auto
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2 space-y-1">
        <p className="text-sm font-medium truncate" title={entry.name}>
          {entry.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </span>
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {entry.layers.length}
          </span>
        </div>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button size="sm" onClick={onLoad}>
          <Download className="h-4 w-4 mr-1" />
          Load
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="secondary">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRename}>
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload to Kaizen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Helper function to format time ago
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(timestamp).toLocaleDateString();
}
