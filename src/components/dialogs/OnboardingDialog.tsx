import { useState, useEffect } from 'react';
import {
  Palette,
  Check,
  Rocket,
  Gamepad2,
  Wrench,
  Cloud,
  Users,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useThemeStore, themes } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';

const ONBOARDING_COMPLETE_KEY = 'onboarding-complete';

export function OnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const { currentThemeId, setTheme, isDarkMode, toggleDarkMode } = useThemeStore();
  const { login, isAuthenticated } = useAuthStore();

  // Check if onboarding is needed
  useEffect(() => {
    const isComplete = localStorage.getItem(ONBOARDING_COMPLETE_KEY);
    if (!isComplete) {
      setOpen(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    setOpen(false);
  };

  const handleNext = () => {
    if (step < 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleLoginAndComplete = () => {
    login();
    handleComplete();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleComplete();
      setOpen(isOpen);
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        {step === 0 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-6 w-6 text-primary" />
                Bienvenue dans Kaizen Skin Editor
              </DialogTitle>
              <DialogDescription>
                Choisis ton thème préféré pour personnaliser ton expérience
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Dark/Light Mode Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="font-medium">Mode d'affichage</span>
                <div className="flex gap-2">
                  <Button
                    variant={!isDarkMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => isDarkMode && toggleDarkMode()}
                  >
                    Clair
                  </Button>
                  <Button
                    variant={isDarkMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => !isDarkMode && toggleDarkMode()}
                  >
                    Sombre
                  </Button>
                </div>
              </div>

              {/* Theme Grid */}
              <div className="grid grid-cols-2 gap-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setTheme(theme.id)}
                    className={`relative p-4 rounded-lg border-2 transition-all text-left hover:border-primary/50 ${
                      currentThemeId === theme.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card'
                    }`}
                  >
                    {currentThemeId === theme.id && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{theme.name}</span>
                    </div>
                    {/* Color preview */}
                    <div className="flex gap-1">
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: `hsl(${isDarkMode ? theme.dark.primary : theme.light.primary})` }}
                        title="Primary"
                      />
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: `hsl(${isDarkMode ? theme.dark.accent : theme.light.accent})` }}
                        title="Accent"
                      />
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: `hsl(${isDarkMode ? theme.dark.background : theme.light.background})` }}
                        title="Background"
                      />
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: isDarkMode ? theme.dark.viewer3dBackground : theme.light.viewer3dBackground }}
                        title="Viewer"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleNext} className="gap-2">
                Continuer
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Rocket className="h-6 w-6 text-primary" />
                Pourquoi créer un compte Kaizen ?
              </DialogTitle>
              <DialogDescription>
                Un compte Kaizen te donne accès à tout l'écosystème Kaizen Core
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Benefits List */}
              <div className="space-y-3">
                <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Cloud className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold">Sauvegarde Cloud</h4>
                    <p className="text-sm text-muted-foreground">
                      Sauvegarde tes skins dans le cloud et accède-y depuis n'importe où.
                      Partage-les facilement avec la communauté.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Gamepad2 className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold">Kaizen Launcher</h4>
                    <p className="text-sm text-muted-foreground">
                      Accède au launcher Minecraft officiel de Kaizen avec tes mods préférés,
                      configurations optimisées et mises à jour automatiques.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Wrench className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold">Tools Minecraft</h4>
                    <p className="text-sm text-muted-foreground">
                      Accède à une suite complète d'outils : calculateurs de crafts,
                      planificateurs de builds, générateurs de commandes, et plus encore.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold">Communauté Kaizen</h4>
                    <p className="text-sm text-muted-foreground">
                      Rejoins une communauté de passionnés Minecraft. Partage tes créations,
                      découvre des skins, et participe aux événements.
                    </p>
                  </div>
                </div>
              </div>

              {/* Account status */}
              {isAuthenticated ? (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                  <Check className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="font-medium text-green-600 dark:text-green-400">
                    Tu es déjà connecté à ton compte Kaizen !
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Connecte-toi ou crée un compte pour débloquer toutes les fonctionnalités
                  </p>
                  <Button onClick={handleLoginAndComplete} className="gap-2">
                    <Rocket className="h-4 w-4" />
                    Se connecter avec Kaizen
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <Button onClick={handleComplete} className="gap-2">
                {isAuthenticated ? 'Commencer' : 'Continuer sans compte'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step indicators */}
        <div className="flex justify-center gap-2 pt-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
