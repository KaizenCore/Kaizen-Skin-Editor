import { useState, useEffect } from 'react';
import { Save, Loader2, Trash2, Globe, Lock, Link2 } from 'lucide-react';
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
import { SkinApi, type Skin, type SkinVisibility } from '@/lib/io/SkinApi';

interface EditSkinDialogProps {
  skin: Skin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  onDeleted?: () => void;
}

const visibilityOptions: { value: SkinVisibility; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'public', label: 'Public', icon: <Globe className="h-4 w-4" />, description: 'Visible in gallery' },
  { value: 'unlisted', label: 'Unlisted', icon: <Link2 className="h-4 w-4" />, description: 'Only via link' },
  { value: 'private', label: 'Private', icon: <Lock className="h-4 w-4" />, description: 'Only you' },
];

export function EditSkinDialog({ skin, open, onOpenChange, onSaved, onDeleted }: EditSkinDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<SkinVisibility>('private');
  const [tagsInput, setTagsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Populate form when skin changes
  useEffect(() => {
    if (skin) {
      setName(skin.name);
      setDescription(skin.description || '');
      setVisibility(skin.visibility);
      setTagsInput(skin.tags?.join(', ') || '');
      setError(null);
      setShowDeleteConfirm(false);
    }
  }, [skin]);

  const handleSave = async () => {
    if (!skin) return;

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .slice(0, 10);

      await SkinApi.updateSkin(skin.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        visibility,
        tags: tags.length > 0 ? tags : undefined,
      });

      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!skin) return;

    setIsDeleting(true);
    setError(null);

    try {
      await SkinApi.deleteSkin(skin.id);
      onDeleted?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!skin) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Skin</DialogTitle>
          <DialogDescription>
            Modify your skin's details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-skin-name">Name *</Label>
            <Input
              id="edit-skin-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My awesome skin"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-skin-description">Description</Label>
            <Input
              id="edit-skin-description"
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
            <Label htmlFor="edit-skin-tags">Tags</Label>
            <Input
              id="edit-skin-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="fantasy, knight, armor"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated, max 10 tags
            </p>
          </div>

          {/* Delete Section */}
          <div className="pt-4 border-t">
            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Skin
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-destructive">
                  Are you sure? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Yes, Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
