import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { SkinEditor } from '@/components/editor/SkinEditor';
import { useEditorStore } from '@/stores/editorStore';
import { useAuthStore } from '@/stores/authStore';
import { OAuthCallback } from '@/components/auth/OAuthCallback';
import { OnboardingDialog } from '@/components/dialogs/OnboardingDialog';
import { TermsOfService } from '@/pages/TermsOfService';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { MojangApi } from '@/lib/io/MojangApi';
import type { SkinFormat } from '@/lib/core/types';

function EditorPage() {
  const { document, newDocument, loadSkin } = useEditorStore();
  const { initialize } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoadingUserSkin, setIsLoadingUserSkin] = useState(false);
  const [userSkinError, setUserSkinError] = useState<string | null>(null);

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Load skin from URL parameter
  const loadSkinFromUsername = useCallback(async (username: string) => {
    setIsLoadingUserSkin(true);
    setUserSkinError(null);

    try {
      const result = await MojangApi.fetchSkinByUsername(username);
      const format: SkinFormat = result.imageData.height === 64 ? 'modern' : 'legacy';
      loadSkin(result.imageData, format, result.model, `${username}'s Skin`);

      // Clear the user param from URL after successful load
      searchParams.delete('user');
      setSearchParams(searchParams, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load skin';
      setUserSkinError(message);
      // Create default document on error
      newDocument({ name: 'New Skin', format: 'modern', model: 'classic' });
    } finally {
      setIsLoadingUserSkin(false);
    }
  }, [loadSkin, newDocument, searchParams, setSearchParams]);

  // Initialize document on mount or load from URL parameter
  useEffect(() => {
    const userParam = searchParams.get('user');

    if (userParam && !document) {
      loadSkinFromUsername(userParam);
    } else if (!document) {
      newDocument({ name: 'New Skin', format: 'modern', model: 'classic' });
    }
  }, [document, newDocument, searchParams, loadSkinFromUsername]);

  // Show loading state
  if (isLoadingUserSkin) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading skin for {searchParams.get('user')}...</p>
        </div>
      </div>
    );
  }

  // Show error state with dismiss option
  if (userSkinError) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center p-6 max-w-md">
          <div className="text-destructive text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Failed to load skin</h2>
          <p className="text-muted-foreground mb-4">{userSkinError}</p>
          <button
            onClick={() => setUserSkinError(null)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Continue to Editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <OAuthCallback />
      <OnboardingDialog />
      <SkinEditor />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
