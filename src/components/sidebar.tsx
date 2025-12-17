'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Gamepad2, LayoutGrid, Users, Calendar,
    ShoppingBag, FileText, LogOut, Settings, Package, Sun, Moon
} from 'lucide-react';
import { useAuth } from './auth-provider';


export function Sidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();


    const menuItems = [
        { label: 'Dashboard', icon: LayoutGrid, path: '/dashboard' },
        { label: 'Meja & Billing', icon: Gamepad2, path: '/tables' },
        { label: 'Membership', icon: Users, path: '/members' },
        { label: 'POS & Menu', icon: ShoppingBag, path: '/pos' },
        { label: 'Inventory', icon: Package, path: '/inventory' },
        { label: 'Reservasi', icon: Calendar, path: '/reservations' },
        { label: 'Laporan', icon: FileText, path: '/reports' },
        { label: 'Settings', icon: Settings, path: '/settings' },
    ];

    return (
        <aside className="w-64 flex flex-col shrink-0 z-20 h-screen hide-mobile" style={{
            backgroundColor: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-default)'
        }}>
            {/* Brand */}
            <div className="p-6 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
                <div className="size-10 rounded-lg flex items-center justify-center transform rotate-3" style={{
                    backgroundColor: 'var(--accent-primary)',
                    boxShadow: '0 0 15px rgba(240, 112, 0, 0.4)'
                }}>
                    <Gamepad2 size={24} style={{ color: 'var(--text-inverse)' }} />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        Billiard<span style={{ color: 'var(--accent-primary)' }}>OS</span>
                    </h1>
                    <p className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                        Management System
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group"
                            style={{
                                backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                                color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
                                boxShadow: isActive ? '0 4px 12px rgba(240, 112, 0, 0.2)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }
                            }}
                        >
                            <item.icon size={20} style={{ color: isActive ? 'var(--text-inverse)' : undefined }} className={!isActive ? 'group-hover:text-[var(--accent-primary)]' : ''} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4" style={{ borderTop: '1px solid var(--border-default)' }}>


                <div className="rounded-xl p-4 mb-4" style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)'
                }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="size-8 rounded-full" style={{ backgroundColor: 'var(--border-default)' }}></div>
                        <div className="overflow-hidden">
                            <div className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>Staff</div>
                            <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Cashier</div>
                        </div>
                    </div>
                    <button
                        onClick={() => window.location.href = '/logout'}
                        className="w-full flex items-center justify-center gap-2 text-xs font-bold py-2 rounded transition-colors"
                        style={{
                            backgroundColor: 'var(--danger-light)',
                            color: 'var(--danger)'
                        }}
                    >
                        <LogOut size={14} /> Keluar
                    </button>
                </div>
                <div className="text-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    v1.0.0 • BilliardOS
                </div>
            </div>
        </aside>
    );
}
