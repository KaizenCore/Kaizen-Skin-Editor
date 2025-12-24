import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { KaizenUserBadge } from '@/lib/io/KaizenApi';

interface NewBadgeModalProps {
  badge: KaizenUserBadge | null;
  onClose: () => void;
}

const celebrationMessages = [
  "You're on fire!",
  "Look at you go!",
  "Achievement unlocked!",
  "You're crushing it!",
  "Way to go, champ!",
  "Skin game strong!",
  "Legendary status!",
  "You earned it!",
  "Keep up the amazing work!",
  "New badge alert!",
];

export function NewBadgeModal({ badge, onClose }: NewBadgeModalProps) {
  const [message] = useState(() =>
    celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]
  );
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (badge) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [badge]);

  if (!badge) return null;

  return (
    <Dialog open={!!badge} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md text-center overflow-hidden">
        <DialogTitle className="sr-only">New Badge Earned</DialogTitle>

        {/* Confetti effect */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', badge.color][
                      Math.floor(Math.random() * 6)
                    ],
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <div className="py-6 space-y-4">
          {/* Badge icon with glow */}
          <div className="relative mx-auto w-24 h-24">
            <div
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                backgroundColor: badge.color,
                opacity: 0.3,
                transform: 'scale(1.2)',
                filter: 'blur(20px)',
              }}
            />
            <div
              className="relative w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-xl animate-bounce-in"
              style={{
                backgroundColor: badge.color,
                boxShadow: `0 0 30px ${badge.color}60`,
              }}
            >
              {badge.icon}
            </div>
          </div>

          {/* Celebration message */}
          <p className="text-sm text-muted-foreground font-medium">{message}</p>

          {/* Badge name */}
          <h2 className="text-2xl font-bold">{badge.name}</h2>

          {/* Badge description */}
          <p className="text-muted-foreground">{badge.description}</p>

          {/* Type badge */}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs">
            {badge.type === 'achievement' && 'Achievement'}
            {badge.type === 'milestone' && 'Milestone'}
            {badge.type === 'special' && 'Special Badge'}
          </div>
        </div>

        <Button onClick={onClose} className="w-full">
          Awesome!
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// CSS animation for confetti (add to global styles or use CSS-in-JS)
// You can add this to your global CSS:
/*
@keyframes confetti {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(400px) rotate(720deg);
    opacity: 0;
  }
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-confetti {
  animation: confetti 2s ease-out forwards;
}

.animate-bounce-in {
  animation: bounce-in 0.5s ease-out forwards;
}
*/
