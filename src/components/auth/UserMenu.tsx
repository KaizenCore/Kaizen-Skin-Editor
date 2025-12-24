import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Loader2, Gamepad2, Shield, Award } from 'lucide-react';
import { BadgeList } from '@/components/badges/BadgeDisplay';

export function UserMenu() {
  const { user, minecraftProfile, badges, isAuthenticated, isLoading, login, logout } = useAuthStore();

  // Loading state
  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  // Not authenticated - show login button
  if (!isAuthenticated || !user) {
    return (
      <Button variant="ghost" size="sm" onClick={login} className="gap-2">
        <User className="h-4 w-4" />
        <span>Login</span>
      </Button>
    );
  }

  // Get avatar (prefer Minecraft, fallback to Kaizen avatar)
  const avatarUrl = minecraftProfile?.avatarUrl || user.avatar_url;

  // Authenticated - show user menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user.name}
              className="h-5 w-5 rounded"
            />
          ) : (
            <User className="h-4 w-4" />
          )}
          <span className="max-w-[100px] truncate">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            {user.email && (
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {user.role && (
          <DropdownMenuItem disabled className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="capitalize">{user.role}</span>
          </DropdownMenuItem>
        )}

        {minecraftProfile && (
          <DropdownMenuItem disabled className="gap-2">
            <Gamepad2 className="h-4 w-4" />
            <span>MC: {minecraftProfile.username}</span>
          </DropdownMenuItem>
        )}

        {user.tags && user.tags.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 flex flex-wrap gap-1">
              {user.tags.map((tag) => (
                <span
                  key={tag.slug}
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}20` : 'hsl(var(--muted))',
                    color: tag.color || 'hsl(var(--muted-foreground))',
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </>
        )}

        {badges.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <Award className="h-3 w-3" />
                <span>Badges</span>
              </div>
              <BadgeList badges={badges} size="sm" maxDisplay={6} />
            </div>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={logout} className="gap-2 text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
