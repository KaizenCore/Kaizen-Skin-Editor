import { useState, useCallback, useRef } from 'react';
import { Upload, User, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useEditorStore } from '@/stores/editorStore';
import { PngCodec, MojangApi } from '@/lib/io';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { loadSkin } = useEditorStore();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);

      try {
        const { imageData, format, model } = await PngCodec.loadFromFile(file);
        loadSkin(imageData, format, model, file.name.replace('.png', ''));
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load skin');
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [loadSkin, onOpenChange]
  );

  const handleUsernameImport = useCallback(async () => {
    if (!username.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const { imageData, model } = await MojangApi.fetchSkinByUsername(username.trim());
      loadSkin(imageData, 'modern', model, username.trim());
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch skin');
    } finally {
      setIsLoading(false);
    }
  }, [username, loadSkin, onOpenChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && username.trim()) {
        handleUsernameImport();
      }
    },
    [username, handleUsernameImport]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Skin</DialogTitle>
          <DialogDescription>
            Import a skin from a PNG file or a Minecraft username.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File upload */}
          <div className="space-y-2">
            <Label>From File</Label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".png"
                className="hidden"
                onChange={handleFileImport}
                disabled={isLoading}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose PNG File
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Supports 64x64 (modern) and 64x32 (legacy) skins
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Username import */}
          <div className="space-y-2">
            <Label>From Minecraft Username</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <Button onClick={handleUsernameImport} disabled={isLoading || !username.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Fetches the current skin from Mojang servers
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
