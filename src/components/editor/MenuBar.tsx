import { useState } from 'react';
import {
  FilePlus,
  FolderOpen,
  Download,
  Upload,
  Undo2,
  Redo2,
  Grid3X3,
  Layers,
  ImageIcon,
  User,
  Loader2,
  Palette,
  Sun,
  Moon,
  Check,
  BookOpen,
  FileCode,
  ScrollText,
  Shield,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { useEditorStore } from '@/stores/editorStore';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore, themes } from '@/stores/themeStore';
import { ImportDialog } from '@/components/dialogs/ImportDialog';
import { ExportDialog } from '@/components/dialogs/ExportDialog';
import { UploadDialog } from '@/components/dialogs/UploadDialog';
import { GalleryDialog } from '@/components/dialogs/GalleryDialog';
import { UserMenu } from '@/components/auth/UserMenu';

export function MenuBar() {
  const { newDocument, document, loadSkin, undo, redo, historyState, showGrid, setShowGrid, showOverlay, setShowOverlay } = useEditorStore();
  const { minecraftProfile } = useAuthStore();
  const { currentThemeId, isDarkMode, setTheme, toggleDarkMode } = useThemeStore();
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [isLoadingMcSkin, setIsLoadingMcSkin] = useState(false);

  // Load user's Minecraft skin from external API
  const handleLoadMinecraftSkin = async () => {
    if (!minecraftProfile?.username) return;

    setIsLoadingMcSkin(true);
    try {
      // Load image with crossOrigin to avoid tainted canvas
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load skin image'));
        img.src = `https://mc-heads.net/skin/${minecraftProfile.username}`;
      });

      // Use regular canvas (not OffscreenCanvas) for better CORS compatibility
      const canvas = window.document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);

      // Determine format based on dimensions
      const format = img.height === 64 ? 'modern' : 'legacy';

      loadSkin(imageData, format, 'classic', `${minecraftProfile.username}'s Skin`);
    } catch (err) {
      console.error('Failed to load Minecraft skin:', err);
    } finally {
      setIsLoadingMcSkin(false);
    }
  };

  return (
    <>
      <div className="flex items-center h-8 px-1 border-b bg-background select-none z-50">
        {/* Kaizen Logo */}
        <img
          src="/kaizen-logo.svg"
          alt="Kaizen"
          className="h-5 w-5 mx-2"
        />

        <div className="flex items-center">
          {/* File Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="px-3 py-1 text-sm hover:bg-accent rounded-sm focus:outline-none">
              File
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px]">
              <DropdownMenuItem onClick={() => newDocument()}>
                <FilePlus className="mr-2 h-4 w-4" />
                New
                <DropdownMenuShortcut>Ctrl+N</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setImportOpen(true)}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Import...
                <DropdownMenuShortcut>Ctrl+O</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGalleryOpen(true)}>
                <ImageIcon className="mr-2 h-4 w-4" />
                Browse Gallery...
              </DropdownMenuItem>
              {minecraftProfile && (
                <DropdownMenuItem onClick={handleLoadMinecraftSkin} disabled={isLoadingMcSkin}>
                  {isLoadingMcSkin ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <User className="mr-2 h-4 w-4" />
                  )}
                  Load My Minecraft Skin
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setExportOpen(true)}>
                <Download className="mr-2 h-4 w-4" />
                Export...
                <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setUploadOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload to Kaizen...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Edit Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="px-3 py-1 text-sm hover:bg-accent rounded-sm focus:outline-none">
              Edit
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px]">
              <DropdownMenuItem onClick={undo} disabled={!historyState.canUndo}>
                <Undo2 className="mr-2 h-4 w-4" />
                Undo
                <DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={redo} disabled={!historyState.canRedo}>
                <Redo2 className="mr-2 h-4 w-4" />
                Redo
                <DropdownMenuShortcut>Ctrl+Y</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="px-3 py-1 text-sm hover:bg-accent rounded-sm focus:outline-none">
              View
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px]">
              <DropdownMenuItem onClick={() => setShowGrid(!showGrid)}>
                <Grid3X3 className="mr-2 h-4 w-4" />
                {showGrid ? 'Hide' : 'Show'} Grid
                <DropdownMenuShortcut>G</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowOverlay(!showOverlay)}>
                <Layers className="mr-2 h-4 w-4" />
                {showOverlay ? 'Hide' : 'Show'} Template
                <DropdownMenuShortcut>T</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="px-3 py-1 text-sm hover:bg-accent rounded-sm focus:outline-none">
              Theme
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px]">
              <DropdownMenuItem onClick={toggleDarkMode}>
                {isDarkMode ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {themes.map((theme) => (
                <DropdownMenuItem
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                >
                  {currentThemeId === theme.id ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Palette className="mr-2 h-4 w-4 opacity-0" />
                  )}
                  {theme.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Help Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="px-3 py-1 text-sm hover:bg-accent rounded-sm focus:outline-none">
              Help
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px]">
              <DropdownMenuItem onClick={() => window.open('https://skin-api.kaizencore.tech/docs', '_blank')}>
                <BookOpen className="mr-2 h-4 w-4" />
                API Documentation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open('https://skin-api.kaizencore.tech/api/documentation#/', '_blank')}>
                <FileCode className="mr-2 h-4 w-4" />
                Swagger Documentation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.open('/terms', '_blank')}>
                <ScrollText className="mr-2 h-4 w-4" />
                Terms of Service
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open('/privacy', '_blank')}>
                <Shield className="mr-2 h-4 w-4" />
                Privacy Policy
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1" />

        {/* Document info */}
        <div className="text-xs text-muted-foreground px-2">
          {document && (
            <>
              {document.name} | {document.format === 'modern' ? '64x64' : '64x32'} |{' '}
              {document.model === 'slim' ? 'Slim' : 'Classic'}
            </>
          )}
        </div>

        {/* User Menu */}
        <UserMenu />
      </div>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <GalleryDialog open={galleryOpen} onOpenChange={setGalleryOpen} />
    </>
  );
}
