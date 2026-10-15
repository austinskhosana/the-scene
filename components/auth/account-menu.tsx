'use client';

import {useClerk, useUser} from '@clerk/react';
import {useRouter} from 'next/navigation';
import {Avatar} from '@/components/lime/ui/avatar';
import {buttonVariants} from '@/components/lime/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/lime/ui/dropdown-menu';
import {ArrowRight, Icon, Logout, Settings} from '@/components/lime/icon';

export function AccountMenu() {
  const {user} = useUser();
  const {openUserProfile, signOut} = useClerk();
  const router = useRouter();

  if (!user) return null;

  const name = user.fullName ?? user.username ?? user.primaryEmailAddress?.emailAddress ?? 'Account';
  const detail = user.username ? `@${user.username}` : user.primaryEmailAddress?.emailAddress;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Open account menu" className={buttonVariants({variant: 'ghost', size: 'icon-sm'})}>
        <Avatar size="sm" src={user.imageUrl} name={name}/>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-(--popover)">
        <div className="flex min-w-0 items-center gap-3 px-3 py-2">
          <Avatar size="md" src={user.imageUrl} name={name}/>
          <div className="min-w-0 text-start">
            <p className="truncate text-sm font-medium">{name}</p>
            {detail && <p className="truncate text-xs text-fg-3">{detail}</p>}
          </div>
        </div>
        <DropdownMenuSeparator/>
        <DropdownMenuItem onClick={() => router.push('/dashboard')}>
          <Icon icon={ArrowRight} size={16}/>
          <span>Go to dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openUserProfile()}>
          <Icon icon={Settings} size={16}/>
          <span>Manage account</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator/>
        <DropdownMenuItem onClick={() => void signOut({redirectUrl: '/sign-in'})}>
          <Icon icon={Logout} size={16}/>
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
