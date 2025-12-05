"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, GitPullRequest, Settings, Zap } from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'PR View', href: '/pr-view', icon: GitPullRequest },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function MainNav() {
  const pathname = usePathname();
  
  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <Link href="/" className="flex items-center space-x-2">
        <Zap className="h-6 w-6 text-primary-500" />
        <span className="font-bold text-xl">Revive</span>
      </Link>
      
      <div className="hidden md:flex items-center space-x-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
