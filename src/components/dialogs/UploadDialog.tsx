import { useState, useCallback, useEffect } from 'react';
import { Upload, Loader2, Globe, Lock, Link2 } from 'lucide-react';
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
import { useAuthStore } from '@/stores/authStore';
import { SkinApi, type SkinVisibility, type SkinCategory } from '@/lib/io/SkinApi';
import { toast } from '@/lib/toast';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const visibilityOptions: { value: SkinVisibility; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'public', label: 'Public', icon: <Globe className="h-4 w-4" />, description: 'Visible in gallery' },
  { value: 'unlisted', label: 'Unlisted', icon: <Link2 className="h-4 w-4" />, description: 'Only via link' },
  { value: 'private', label: 'Private', icon: <Lock className="h-4 w-4" />, description: 'Only you' },
];

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const { document, compositeImageData } = useEditorStore();
  const { isAuthenticated, login } = useAuthStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<SkinVisibility>('public');
  const [tagsInput, setTagsInput] = useState('');
  const [categories, setCategories] = useState<SkinCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load categories on mount
  useEffect(() => {
    if (open) {
      SkinApi.getCategories()
        .then(setCategories)
        .catch(() => setCategories([]));

      // Set default name from document
      if (document?.name) {
        setName(document.name);
      }
    }
  }, [open, document?.name]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setError(null);
      setSuccess(null);
    }
  }, [open]);

  const handleUpload = useCallback(async () => {
    if (!compositeImageData) {
      setError('No skin to upload');
      return;
    }

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .slice(0, 10); // Max 10 tags

      const skin = await SkinApi.uploadFromImageData(compositeImageData, {
        name: name.trim(),
        description: description.trim() || undefined,
        visibility,
        tags: tags.length > 0 ? tags : undefined,
        category_ids: selectedCategories.length > 0 ? selectedCategories : undefined,
      });

      setSuccess(`Skin "${skin.name}" uploaded successfully!`);
      toast.success('Skin uploaded', `"${skin.name}" uploaded successfully`);

      // Close after a short delay
      setTimeout(() => {
        onOpenChange(false);
        // Reset form
        setName('');
        setDescription('');
        setVisibility('public');
        setTagsInput('');
        setSelectedCategories([]);
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      toast.error('Upload failed', message);
    } finally {
      setIsUploading(false);
    }
  }, [compositeImageData, name, description, visibility, tagsInput, selectedCategories, onOpenChange]);

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  // Not authenticated view
  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload to Kaizen</DialogTitle>
            <DialogDescription>
              Share your skin with the community.
            </DialogDescription>
          </DialogHeader>

          <div className="py-8 text-center space-y-4">
            <p className="text-muted-foreground">
              You need to be logged in to upload skins.
            </p>
            <Button onClick={login}>
              Login with Kaizen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload to Kaizen</DialogTitle>
          <DialogDescription>
            Share your skin with the community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Error/Success messages */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 text-sm text-green-500 bg-green-500/10 rounded-md">
              {success}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="skin-name">Name *</Label>
            <Input
              id="skin-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My awesome skin"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="skin-description">Description</Label>
            <Input
              id="skin-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A cool skin I made..."
              maxLength={1000}
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Visibility</Label>
            <div className="flex gap-2">
              {visibilityOptions.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={visibility === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => setVisibility(opt.value)}
                >
                  {opt.icon}
                  <span className="hidden sm:inline">{opt.label}</span>
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {visibilityOptions.find((o) => o.value === visibility)?.description}
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="skin-tags">Tags</Label>
            <Input
              id="skin-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="fantasy, knight, armor"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated, max 10 tags
            </p>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    type="button"
                    variant={selectedCategories.includes(cat.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleCategory(cat.id)}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Skin Info */}
          <div className="pt-2 border-t space-y-1">
            <p className="text-xs text-muted-foreground">
              Format: {document?.format === 'modern' ? '64x64' : '64x32'} |
              Model: {document?.model === 'slim' ? 'Slim' : 'Classic'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || !name.trim() || !!success}
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
