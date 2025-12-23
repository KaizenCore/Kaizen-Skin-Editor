import { useEffect } from 'react';
import { SkinEditor } from '@/components/editor/SkinEditor';
import { useEditorStore } from '@/stores/editorStore';
import { useAuthStore } from '@/stores/authStore';
import { OAuthCallback } from '@/components/auth/OAuthCallback';
import { OnboardingDialog } from '@/components/dialogs/OnboardingDialog';

function App() {
  const { document, newDocument } = useEditorStore();
  const { initialize } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Initialize document on mount
  useEffect(() => {
    if (!document) {
      newDocument({ name: 'New Skin', format: 'modern', model: 'classic' });
    }
  }, [document, newDocument]);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <OAuthCallback />
      <OnboardingDialog />
      <SkinEditor />
    </div>
  );
}

export default App;
