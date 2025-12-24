import { useState, useEffect } from 'react';
import { Smartphone, Monitor, ExternalLink, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Fun random messages for mobile users
const MESSAGES = [
  {
    title: "Oops! Your screen is too smol",
    subtitle: "Our pixels need more space to breathe!",
  },
  {
    title: "Mobile? Nice try!",
    subtitle: "But editing skins on a tiny screen is like painting the Mona Lisa with a toothpick.",
  },
  {
    title: "Error 418: Screen Too Small",
    subtitle: "We'd need a magnifying glass to edit pixels on this screen!",
  },
  {
    title: "Houston, we have a problem",
    subtitle: "Your screen is smaller than a Minecraft block!",
  },
  {
    title: "Plot twist: You're on mobile",
    subtitle: "Steve would need glasses to see your edits on this screen.",
  },
  {
    title: "Nice phone! But...",
    subtitle: "Editing 64x64 pixels on mobile is a crime against creativity.",
  },
  {
    title: "Your thumbs are too big for this",
    subtitle: "Seriously, pixel art needs a real screen!",
  },
  {
    title: "Mobile detected!",
    subtitle: "Did you really think you could pixel art with your thumbs?",
  },
  {
    title: "Screen size: Potato",
    subtitle: "Our editor needs at least a baked potato's worth of screen.",
  },
  {
    title: "Achievement Unlocked: Wrong Device",
    subtitle: "Come back on a computer to unlock the skin editor!",
  },
];

const MOBILE_BREAKPOINT = 768;

interface MobileBlockerProps {
  children: React.ReactNode;
}

export function MobileBlocker({ children }: MobileBlockerProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [message] = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)]!);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      setIsChecking(false);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show nothing while checking to avoid flash
  if (isChecking) {
    return null;
  }

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center p-6 text-center">
      {/* Fun icon animation */}
      <div className="relative mb-8">
        <Smartphone className="w-16 h-16 text-muted-foreground animate-pulse" />
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center">
          <span className="text-destructive-foreground text-xs font-bold">X</span>
        </div>
      </div>

      {/* Main message */}
      <h1 className="text-2xl font-bold mb-2">{message.title}</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">{message.subtitle}</p>

      {/* What you can do instead */}
      <div className="bg-card border rounded-lg p-6 max-w-sm w-full mb-6">
        <h2 className="font-semibold mb-4 flex items-center justify-center gap-2">
          <Monitor className="w-4 h-4" />
          In the meantime...
        </h2>

        <div className="space-y-3">
          <Button
            variant="default"
            className="w-full"
            onClick={() => window.location.href = 'https://kaizencore.tech/en/skins/browse'}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Browse Skins Gallery
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open('https://discord.gg/kaizencore', '_blank')}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Join our Discord
          </Button>
        </div>
      </div>

      {/* Footer tip */}
      <p className="text-xs text-muted-foreground max-w-xs">
        Pro tip: Come back on a computer or tablet in landscape mode for the full skin editing experience!
      </p>

      {/* Little Minecraft-style decoration */}
      <div className="mt-8 flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 bg-primary/20 rounded-sm"
            style={{
              animationDelay: `${i * 0.1}s`,
              animation: 'pulse 2s infinite',
            }}
          />
        ))}
      </div>
    </div>
  );
}
