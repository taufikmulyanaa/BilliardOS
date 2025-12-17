'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Users, ClipboardCheck, BarChart3,
    Tag, Package, UserCheck, Settings, ChevronLeft,
    TrendingUp, Clock, DollarSign, LogOut
} from 'lucide-react';
import { AuthProvider, useAuth } from '@/components/auth-provider';
import { ToastProvider } from '@/components/toast-provider';
import { ThemeProvider } from '@/components/theme-provider';

const navItems = [
    { href: '/manager', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { href: '/manager/staff', icon: Users, label: 'Staff Management' },
    { href: '/manager/shifts', icon: ClipboardCheck, label: 'Shift Reports' },
    {
        href: '/manager/analytics', icon: BarChart3, label: 'Analytics', children: [
            { href: '/manager/analytics/revenue', icon: TrendingUp, label: 'Revenue' },
            { href: '/manager/analytics/tables', icon: LayoutDashboard, label: 'Table Performance' },
            { href: '/manager/analytics/peak-hours', icon: Clock, label: 'Peak Hours' },
        ]
    },
    { href: '/manager/pricing', icon: Tag, label: 'Pricing' },
    { href: '/manager/inventory', icon: Package, label: 'Inventory Control' },
    { href: '/manager/members', icon: UserCheck, label: 'Member Analytics' },
    { href: '/manager/settings', icon: Settings, label: 'Settings' },
];

function ManagerSidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [expandedMenu, setExpandedMenu] = React.useState<string | null>('Analytics');

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    };

    return (
        <aside className="w-64 flex flex-col min-h-screen" style={{
            background: 'linear-gradient(to bottom, var(--bg-surface), var(--bg-base))',
            color: 'var(--text-primary)'
        }}>
            {/* Header */}
            <div className="p-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{
                        background: 'linear-gradient(to bottom-right, var(--accent-primary), var(--accent-secondary))',
                        color: 'var(--text-inverse)'
                    }}>
                        M
                    </div>
                    <div>
                        <h1 className="font-bold text-lg" style={{ color: 'var(--accent-primary)' }}>BilliardOS</h1>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Manager Portal</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <div key={item.href}>
                        {item.children ? (
                            <>
                                <button
                                    onClick={() => setExpandedMenu(expandedMenu === item.label ? null : item.label)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                                    style={{
                                        backgroundColor: isActive(item.href) ? 'rgba(180, 229, 13, 0.15)' : 'transparent',
                                        color: isActive(item.href) ? 'var(--accent-primary)' : 'var(--text-secondary)'
                                    }}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="flex-1 text-left">{item.label}</span>
                                    <ChevronLeft className={`w-4 h-4 transition-transform ${expandedMenu === item.label ? '-rotate-90' : ''}`} />
                                </button>
                                {expandedMenu === item.label && (
                                    <div className="ml-4 mt-1 space-y-1 pl-3" style={{ borderLeft: '1px solid var(--border-default)' }}>
                                        {item.children.map((child) => (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                                                style={{
                                                    backgroundColor: isActive(child.href, true) ? 'rgba(180, 229, 13, 0.15)' : 'transparent',
                                                    color: isActive(child.href, true) ? 'var(--accent-primary)' : 'var(--text-muted)'
                                                }}
                                            >
                                                <child.icon className="w-4 h-4" />
                                                <span>{child.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <Link
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-[var(--bg-elevated)]"
                                style={{
                                    backgroundColor: isActive(item.href, item.exact) ? 'rgba(180, 229, 13, 0.15)' : 'transparent',
                                    color: isActive(item.href, item.exact) ? 'var(--accent-primary)' : 'var(--text-secondary)'
                                }}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        )}
                    </div>
                ))}
            </nav>

            {/* User Section Removed from Sidebar */}
        </aside>
    );
}

function ManagerHeader() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const getPageTitle = () => {
        if (pathname === '/manager') return 'Executive Dashboard';
        if (pathname.includes('/staff')) return 'Staff Management';
        if (pathname.includes('/shifts')) return 'Shift Reports';
        if (pathname.includes('/analytics/revenue')) return 'Revenue Analytics';
        if (pathname.includes('/analytics/tables')) return 'Table Performance';
        if (pathname.includes('/analytics/peak-hours')) return 'Peak Hours Analysis';
        if (pathname.includes('/pricing')) return 'Pricing Management';
        if (pathname.includes('/inventory')) return 'Inventory Control';
        if (pathname.includes('/members')) return 'Member Analytics';
        if (pathname.includes('/settings')) return 'System Settings';
        return 'Manager Portal';
    };

    return (
        <header className="h-16 px-6 flex items-center justify-between" style={{
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-default)'
        }}>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{getPageTitle()}</h1>
            <div className="flex items-center gap-4">
                <div className="text-sm mr-4" style={{ color: 'var(--text-muted)' }}>
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>

                {/* User Profile in Header */}
                <div className="flex items-center gap-3 pl-4" style={{ borderLeft: '1px solid var(--border-default)' }}>
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.fullName || 'Manager'}</p>
                        <p className="text-xs" style={{ color: 'var(--accent-primary)' }}>{user?.role || 'MANAGER'}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm" style={{
                        background: 'linear-gradient(to bottom-right, var(--accent-primary), var(--accent-secondary))',
                        color: 'var(--text-inverse)'
                    }}>
                        {user?.fullName?.charAt(0) || 'M'}
                    </div>

                    {/* Dropdown or Actions */}
                    <Link
                        href="/dashboard"
                        title="Kasir Dashboard"
                        className="p-2 rounded-lg transition-all hover:bg-[var(--bg-elevated)]"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={logout}
                        title="Logout"
                        className="p-2 rounded-lg transition-all hover:bg-[var(--danger-light)]"
                        style={{ color: 'var(--danger)' }}
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}

function ManagerLayoutContent({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
            <ManagerSidebar />
            <div className="flex-1 flex flex-col">
                <ManagerHeader />
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <ToastProvider>
                    <ManagerLayoutContent>{children}</ManagerLayoutContent>
                </ToastProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
