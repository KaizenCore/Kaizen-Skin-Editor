import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import type { KaizenBadge, KaizenUserBadge, KaizenBadgeWithStatus } from '@/lib/io/KaizenApi';

interface BadgeProps {
  badge: KaizenBadge | KaizenUserBadge | KaizenBadgeWithStatus;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  earned?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-sm',
  md: 'w-8 h-8 text-lg',
  lg: 'w-12 h-12 text-2xl',
};

export function Badge({ badge, size = 'md', showTooltip = true, earned }: BadgeProps) {
  // Determine if badge is earned
  const isEarned = earned ?? ('is_earned' in badge ? badge.is_earned : 'earned_at' in badge);
  const earnedAt = 'earned_at' in badge ? badge.earned_at : null;

  const badgeElement = (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full flex items-center justify-center
        transition-all duration-200
        ${isEarned
          ? 'opacity-100 shadow-md hover:scale-110'
          : 'opacity-40 grayscale'
        }
      `}
      style={{
        backgroundColor: isEarned ? badge.color : '#374151',
        boxShadow: isEarned ? `0 0 12px ${badge.color}40` : 'none',
      }}
    >
      <span className="select-none">{badge.icon}</span>
    </div>
  );

  if (!showTooltip) {
    return badgeElement;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeElement}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="flex items-start gap-2">
            <span className="text-xl">{badge.icon}</span>
            <div>
              <p className="font-semibold">{badge.name}</p>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
              {earnedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Earned {new Date(earnedAt).toLocaleDateString()}
                </p>
              )}
              {!isEarned && badge.requirement_count && (
                <p className="text-xs text-muted-foreground mt-1">
                  Requires {badge.requirement_count} skins
                </p>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface BadgeListProps {
  badges: (KaizenBadge | KaizenUserBadge | KaizenBadgeWithStatus)[];
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;
}

export function BadgeList({ badges, size = 'md', maxDisplay }: BadgeListProps) {
  const displayBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges;
  const remaining = maxDisplay ? Math.max(0, badges.length - maxDisplay) : 0;

  if (badges.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">No badges yet</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {displayBadges.map((badge) => (
        <Badge key={badge.id} badge={badge} size={size} />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground ml-1">
          +{remaining} more
        </span>
      )}
    </div>
  );
}

interface BadgeGridProps {
  badges: KaizenBadgeWithStatus[];
  size?: 'sm' | 'md' | 'lg';
}

export function BadgeGrid({ badges, size = 'md' }: BadgeGridProps) {
  // Group badges by type
  const grouped = badges.reduce((acc, badge) => {
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

  const typeOrder = ['achievement', 'milestone', 'special'];

  return (
    <div className="space-y-4">
      {typeOrder.map((type) => {
        const typeBadges = grouped[type];
        if (!typeBadges || typeBadges.length === 0) return null;

        return (
          <div key={type}>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
              {typeLabels[type as keyof typeof typeLabels]}
            </h4>
            <div className="flex flex-wrap gap-2">
              {typeBadges.map((badge) => (
                <Badge key={badge.id} badge={badge} size={size} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
