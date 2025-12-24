import { useState, useEffect, useCallback } from 'react';
import { Download, Loader2, Heart, Globe, User, Search, RefreshCw, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEditorStore } from '@/stores/editorStore';
import { useAuthStore } from '@/stores/authStore';
import { SkinApi, type Skin } from '@/lib/io/SkinApi';
import { EditSkinDialog } from './EditSkinDialog';
import { toast } from '@/lib/toast';

interface GalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Tab = 'gallery' | 'my-skins';

export function GalleryDialog({ open, onOpenChange }: GalleryDialogProps) {
  const { loadSkin } = useEditorStore();
  const { isAuthenticated } = useAuthStore();

  const [tab, setTab] = useState<Tab>('gallery');
  const [skins, setSkins] = useState<Skin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSkinId, setLoadingSkinId] = useState<string | null>(null);
  const [editingSkin, setEditingSkin] = useState<Skin | null>(null);

  // Fetch skins based on current tab
  const fetchSkins = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let result: Skin[];

      if (tab === 'gallery') {
        if (searchQuery.length >= 2) {
          result = await SkinApi.searchSkins(searchQuery);
        } else {
          // getGallery returns paginated response, extract data
          const response = await SkinApi.getGallery();
          result = Array.isArray(response) ? response : (response as { data?: Skin[] }).data || [];
        }
      } else {
        result = await SkinApi.getMySkins();
      }

      setSkins(result);
    } catch (err) {
      console.error('Failed to fetch skins:', err);
      setError(err instanceof Error ? err.message : 'Failed to load skins');
      setSkins([]);
    } finally {
      setIsLoading(false);
    }
  }, [tab, searchQuery]);

  // Fetch on open and tab change
  useEffect(() => {
    if (open) {
      fetchSkins();
    }
  }, [open, tab, fetchSkins]);

  // Debounced search
  useEffect(() => {
    if (!open || tab !== 'gallery') return;

    const timer = setTimeout(() => {
      if (searchQuery.length === 0 || searchQuery.length >= 2) {
        fetchSkins();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, open, tab, fetchSkins]);

  // Load skin into editor
  const handleLoadSkin = async (skin: Skin) => {
    setLoadingSkinId(skin.id);

    try {
      // Use SkinApi with internal flag to prevent download count increment
      const blob = await SkinApi.downloadSkin(skin.id, true);
      const bitmap = await createImageBitmap(blob);

      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

      // Determine format based on dimensions
      const format = bitmap.height === 64 ? 'modern' : 'legacy';

      loadSkin(imageData, format, 'classic', skin.name, skin);
      toast.success('Skin loaded', `Loaded "${skin.name}" from gallery`);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load skin';
      setError(message);
      toast.error('Failed to load skin', message);
    } finally {
      setLoadingSkinId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Skin Gallery</DialogTitle>
          <DialogDescription>
            Browse and load skins from the community
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={tab === 'gallery' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTab('gallery')}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            Public Gallery
          </Button>
          {isAuthenticated && (
            <Button
              variant={tab === 'my-skins' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTab('my-skins')}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              My Skins
            </Button>
          )}
        </div>

        {/* Search (only for gallery) */}
        {tab === 'gallery' && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search skins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchSkins}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {/* Skins Grid */}
        <ScrollArea className="flex-1 min-h-0">
          {isLoading && skins.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : skins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p>No skins found</p>
              {tab === 'my-skins' && (
                <p className="text-sm">Upload your first skin to see it here!</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
              {skins.map((skin) => (
                <SkinCard
                  key={skin.id}
                  skin={skin}
                  onLoad={() => handleLoadSkin(skin)}
                  onEdit={skin.is_owner ? () => setEditingSkin(skin) : undefined}
                  isLoading={loadingSkinId === skin.id}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>

      {/* Edit Skin Dialog */}
      <EditSkinDialog
        skin={editingSkin}
        open={editingSkin !== null}
        onOpenChange={(open) => {
          if (!open) setEditingSkin(null);
        }}
        onSaved={() => {
          setEditingSkin(null);
          fetchSkins();
        }}
        onDeleted={() => {
          setEditingSkin(null);
          fetchSkins();
        }}
      />
    </Dialog>
  );
}

// Skin Card Component
interface SkinCardProps {
  skin: Skin;
  onLoad: () => void;
  onEdit?: () => void;
  isLoading: boolean;
}

function SkinCard({ skin, onLoad, onEdit, isLoading }: SkinCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Load image with auth for private skins
  useEffect(() => {
    let objectUrl: string | null = null;

    const loadImage = async () => {
      // For public skins, use download_url directly
      if (skin.visibility === 'public' && skin.download_url) {
        setImageUrl(skin.download_url);
        return;
      }

      // For private/unlisted skins, fetch with auth
      try {
        const url = `${import.meta.env.VITE_SKIN_API_URL}/skins/${skin.id}/download`;
        const token = (await import('@/lib/io/KaizenApi')).KaizenApi.getAccessToken();

        const response = await fetch(url, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });

        if (response.ok) {
          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);
          setImageUrl(objectUrl);
        } else {
          setImageError(true);
        }
      } catch {
        setImageError(true);
      }
    };

    loadImage();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [skin.id, skin.visibility, skin.download_url]);

  return (
    <div className="group relative bg-card border rounded-lg overflow-hidden hover:border-primary transition-colors">
      {/* Skin Preview */}
      <div className="aspect-square bg-muted flex items-center justify-center p-2">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={skin.name}
            className="w-full h-full object-contain pixelated"
            style={{ imageRendering: 'pixelated' }}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            {imageError ? '?' : <Loader2 className="h-6 w-6 animate-spin" />}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2 space-y-1">
        <p className="text-sm font-medium truncate" title={skin.name}>
          {skin.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {skin.likes_count}
          </span>
          <span className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            {skin.downloads_count}
          </span>
        </div>
      </div>

      {/* Buttons Overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button size="sm" onClick={onLoad} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Download className="h-4 w-4 mr-1" />
              Load
            </>
          )}
        </Button>
        {skin.is_owner && onEdit && (
          <Button size="sm" variant="secondary" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}
