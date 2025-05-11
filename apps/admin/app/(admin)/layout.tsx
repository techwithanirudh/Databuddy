"use client"; // Required for usePathname and client-side interactions in sidebar

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Globe, 
  BarChart3, 
  Settings, 
  PanelLeftIcon,
  HomeIcon // For the main dashboard link
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from "./sidebar";

const navItems = [
  { href: '/users', label: 'Users', icon: Users },
  { href: '/websites', label: 'Websites', icon: LayoutDashboard }, // Changed icon for Websites for variety
  { href: '/domains', label: 'Domains', icon: Globe },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 }, // Shortened label
];

// Main dashboard page link
const homeNavItem = { href: '/', label: 'Overview', icon: HomeIcon };

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-muted">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 md:p-10">{children}</main>
    </div>
  );
} 