import { useState, useEffect } from 'react';
import { Save, Upload, X, Globe, Lock, Link2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEditorStore } from '@/stores/editorStore';
import { SkinApi, type SkinVisibility } from '@/lib/io/SkinApi';

const visibilityOptions: { value: SkinVisibility; label: string; icon: React.ReactNode }[] = [
  { value: 'public', label: 'Public', icon: <Globe className="h-3 w-3" /> },
  { value: 'unlisted', label: 'Unlisted', icon: <Link2 className="h-3 w-3" /> },
  { value: 'private', label: 'Private', icon: <Lock className="h-3 w-3" /> },
];

export function SkinInfoPanel() {
  const { sourceSkin, clearSourceSkin, compositeImageData, setSourceSkin } = useEditorStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<SkinVisibility>('private');
  const [tagsInput, setTagsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Populate form when sourceSkin changes
  useEffect(() => {
    if (sourceSkin) {
      setName(sourceSkin.name || '');
      setDescription(sourceSkin.description || '');
      setVisibility(sourceSkin.visibility || 'private');
      setTagsInput(sourceSkin.tags?.join(', ') || '');
      setError(null);
      setSuccess(null);
    }
  }, [sourceSkin]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (!sourceSkin) return null;

  const handleUpdate = async () => {
    if (!compositeImageData) return;

    if (!name?.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const tags = (tagsInput || '')
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .slice(0, 10);

      const skin_data = await SkinApi.imageDataToBase64(compositeImageData);

      const updatedSkin = await SkinApi.updateSkin(sourceSkin.id, {
        name: (name || '').trim(),
        description: (description || '').trim() || undefined,
        visibility,
        tags: tags.length > 0 ? tags : undefined,
        skin_data,
      });

      setSourceSkin(updatedSkin);
      setSuccess('Skin updated!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsNew = async () => {
    if (!compositeImageData) return;

    if (!name?.trim()) {
      setError('Name is required');
      return;
    }

    setIsCreatingNew(true);
    setError(null);
    setSuccess(null);

    try {
      const tags = (tagsInput || '')
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .slice(0, 10);

      const newSkin = await SkinApi.uploadFromImageData(compositeImageData, {
        name: (name || '').trim(),
        description: (description || '').trim() || undefined,
        visibility,
        tags: tags.length > 0 ? tags : undefined,
      });

      setSourceSkin(newSkin);
      setSuccess('Saved as new skin!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setIsCreatingNew(false);
    }
  };

  return (
    <div className="p-3 border-b space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground">SKIN INFO</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={clearSourceSkin}
          title="Disconnect from gallery skin"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-2 text-xs text-destructive bg-destructive/10 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="p-2 text-xs text-green-500 bg-green-500/10 rounded">
          {success}
        </div>
      )}

      {/* Name */}
      <div className="space-y-1">
        <Label className="text-xs">Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Skin name"
          className="h-7 text-xs"
          maxLength={100}
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label className="text-xs">Description</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          className="h-7 text-xs"
          maxLength={1000}
        />
      </div>

      {/* Visibility */}
      <div className="space-y-1">
        <Label className="text-xs">Visibility</Label>
        <div className="flex gap-1">
          {visibilityOptions.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              variant={visibility === opt.value ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-7 text-xs gap-1 px-2"
              onClick={() => setVisibility(opt.value)}
            >
              {opt.icon}
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-1">
        <Label className="text-xs">Tags</Label>
        <Input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="tag1, tag2, ..."
          className="h-7 text-xs"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={handleUpdate}
          disabled={isSaving || isCreatingNew || !name?.trim()}
        >
          {isSaving ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Save className="h-3 w-3 mr-1" />
          )}
          Update
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-7 text-xs"
          onClick={handleSaveAsNew}
          disabled={isSaving || isCreatingNew || !name?.trim()}
        >
          {isCreatingNew ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Upload className="h-3 w-3 mr-1" />
          )}
          Save New
        </Button>
      </div>
    </div>
  );
}
