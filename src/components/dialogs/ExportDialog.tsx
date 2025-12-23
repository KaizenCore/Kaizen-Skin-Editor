import { useState, useCallback } from 'react';
import { Download, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEditorStore } from '@/stores/editorStore';
import { PngCodec } from '@/lib/io';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const { document } = useEditorStore();
  const [filename, setFilename] = useState('skin');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!document) return;

    setIsExporting(true);

    try {
      await PngCodec.downloadSkin(document.layers, document.format, `${filename}.png`);
      onOpenChange(false);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [document, filename, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Skin</DialogTitle>
          <DialogDescription>Save your skin as a PNG file.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Filename</Label>
            <div className="flex gap-2 items-center">
              <Input
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="skin"
              />
              <span className="text-muted-foreground">.png</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Format</Label>
            <p className="text-sm text-muted-foreground">
              {document?.format === 'modern' ? '64x64 (Modern)' : '64x32 (Legacy)'}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Model</Label>
            <p className="text-sm text-muted-foreground">
              {document?.model === 'slim' ? 'Slim (Alex)' : 'Classic (Steve)'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || !filename.trim()}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
