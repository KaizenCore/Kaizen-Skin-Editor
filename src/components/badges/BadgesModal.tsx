import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/authStore';
import { KaizenApi, type KaizenBadgeWithStatus } from '@/lib/io/KaizenApi';
import { Badge } from './BadgeDisplay';
import { Loader2, Lock } from 'lucide-react';

interface BadgesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BadgesModal({ open, onOpenChange }: BadgesModalProps) {
  const { isAuthenticated, badges: earnedBadges } = useAuthStore();
  const [allBadges, setAllBadges] = useState<KaizenBadgeWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && isAuthenticated) {
      setIsLoading(true);
      KaizenApi.fetchMyBadgesWithStatus()
        .then(setAllBadges)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [open, isAuthenticated]);

  const earnedCount = allBadges.filter(b => b.is_earned).length;
  const totalCount = allBadges.length;

  const grouped = allBadges.reduce((acc, badge) => {
    if (!acc[badge.type]) {
      acc[badge.type] = [];
    }
    acc[badge.type]!.push(badge);
    return acc;
  }, {} as Record<string, KaizenBadgeWithStatus[]>);

  const typeLabels = {
    achievement: 'Achievements',
    milestone: 'Milestones',
    special: 'Special',
  };

  const typeOrder = ['achievement', 'milestone', 'special'] as const;

  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Badges</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Log in to view and earn badges!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Badges</span>
            {!isLoading && totalCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {earnedCount}/{totalCount} earned
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="achievement">Achievements</TabsTrigger>
              <TabsTrigger value="milestone">Milestones</TabsTrigger>
              <TabsTrigger value="special">Special</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                {typeOrder.map((type) => {
                  const typeBadges = grouped[type];
                  if (!typeBadges || typeBadges.length === 0) return null;

                  return (
                    <div key={type}>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase">
                        {typeLabels[type]}
                      </h4>
                      <div className="grid grid-cols-5 gap-3">
                        {typeBadges.map((badge) => (
                          <Badge key={badge.id} badge={badge} size="lg" />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {typeOrder.map((type) => (
              <TabsContent key={type} value={type} className="mt-4">
                <div className="max-h-[400px] overflow-y-auto pr-2">
                  {grouped[type] && grouped[type]!.length > 0 ? (
                    <div className="grid grid-cols-5 gap-3">
                      {grouped[type]!.map((badge) => (
                        <Badge key={badge.id} badge={badge} size="lg" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No {typeLabels[type].toLowerCase()} yet
                    </p>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {!isLoading && earnedBadges.length === 0 && allBadges.length > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-2">
            Start creating and sharing skins to earn badges!
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
