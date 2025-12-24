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
                Welcome to Kaizen Skin Editor
              </DialogTitle>
              <DialogDescription>
                Choose your favorite theme to customize your experience
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Dark/Light Mode Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="font-medium">Display Mode</span>
                <div className="flex gap-2">
                  <Button
                    variant={!isDarkMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => isDarkMode && toggleDarkMode()}
                  >
                    Light
                  </Button>
                  <Button
                    variant={isDarkMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => !isDarkMode && toggleDarkMode()}
                  >
                    Dark
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
                Continue
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
                Why create a Kaizen account?
              </DialogTitle>
              <DialogDescription>
                A Kaizen account gives you access to the entire Kaizen Core ecosystem
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
                    <h4 className="font-semibold">Cloud Backup</h4>
                    <p className="text-sm text-muted-foreground">
                      Save your skins in the cloud and access them from anywhere.
                      Share them easily with the community.
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
                      Access the official Kaizen Minecraft launcher with your favorite mods,
                      optimized configurations, and automatic updates.
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
                    <h4 className="font-semibold">Minecraft Tools</h4>
                    <p className="text-sm text-muted-foreground">
                      Access a complete suite of tools: crafting calculators,
                      build planners, command generators, and much more.
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
                    <h4 className="font-semibold">Kaizen Community</h4>
                    <p className="text-sm text-muted-foreground">
                      Join a community of passionate Minecraft players. Share your creations,
                      discover skins, and participate in events.
                    </p>
                  </div>
                </div>
              </div>

              {/* Account status */}
              {isAuthenticated ? (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                  <Check className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="font-medium text-green-600 dark:text-green-400">
                    You're already connected to your Kaizen account!
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Sign in or create an account to unlock all features
                  </p>
                  <Button onClick={handleLoginAndComplete} className="gap-2">
                    <Rocket className="h-4 w-4" />
                    Sign in with Kaizen
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleComplete} className="gap-2">
                {isAuthenticated ? 'Get Started' : 'Continue without account'}
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
