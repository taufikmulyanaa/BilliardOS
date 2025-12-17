'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Gamepad2, Search, LogOut, Settings, User
} from 'lucide-react';
import { BookingAlerts } from './booking-alerts';
import { useAuth } from './auth-provider';


export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);

    const searchableFeatures = [
        { label: 'Dashboard / Meja', path: '/dashboard' },
        { label: 'POS / Kasir F&B', path: '/pos' },
        { label: 'Reservasi', path: '/reservations' },
        { label: 'Membership', path: '/members' },
        { label: 'Laporan Transaksi', path: '/reports' },
        { label: 'Inventory / Stok', path: '/inventory' },
        { label: 'Settings', path: '/settings' },
        { label: 'Profile', path: '/profile' },
    ];


    const isActive = (path: string) => {
        return pathname === path || pathname.startsWith(path + '/');
    };

    const getNavStyle = (path: string) => {
        const active = isActive(path);
        return {
            backgroundColor: active ? 'var(--bg-surface)' : 'transparent',
            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: active ? '1px solid var(--border-default)' : '1px solid transparent'
        };
    };

    const handleLogout = async () => {
        await logout();
        // Router push is handled in auth-provider, but we can ensure menu closes
        setShowProfileMenu(false);
    };

    return (
        <header className="flex items-center justify-between whitespace-nowrap px-6 py-3 shrink-0 z-50 relative" style={{
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-default)'
        }}>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded" style={{
                        backgroundColor: 'rgba(240, 112, 0, 0.1)',
                        border: '1px solid rgba(240, 112, 0, 0.2)',
                        color: 'var(--accent-primary)'
                    }}>
                        <Gamepad2 size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold leading-tight tracking-tight" style={{ color: 'var(--accent-primary)' }}>
                            Billiard POS
                        </h2>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                            Membership System
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6 relative">
                    <div className="h-8 w-px mx-2" style={{ backgroundColor: 'var(--border-default)' }}></div>

                    <div className="relative z-50">
                        <label className="flex flex-col min-w-64 h-9">
                            <div className="flex w-full flex-1 items-stretch rounded transition-colors group" style={{
                                backgroundColor: 'var(--bg-base)',
                                border: '1px solid var(--border-default)'
                            }}>
                                <div className="flex items-center justify-center pl-3" style={{ color: 'var(--text-muted)' }}>
                                    <Search size={18} />
                                </div>
                                <input
                                    className="flex w-full min-w-0 flex-1 bg-transparent border-none focus:ring-0 px-3 text-sm outline-none"
                                    placeholder="Cari fitur..."
                                    style={{ color: 'var(--text-primary)' }}
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowSearchResults(true);
                                    }}
                                    onFocus={() => setShowSearchResults(true)}
                                    onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                                />
                            </div>
                        </label>

                        {/* Search Results Dropdown */}
                        {showSearchResults && searchQuery && (
                            <div className="absolute top-full left-0 w-full mt-2 rounded-lg shadow-xl overflow-hidden z-50" style={{
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border-default)'
                            }}>
                                <div className="py-1">
                                    {searchableFeatures.filter(f => f.label.toLowerCase().includes(searchQuery.toLowerCase())).map((feature) => (
                                        <button
                                            key={feature.path}
                                            onClick={() => {
                                                router.push(feature.path);
                                                setSearchQuery('');
                                                setShowSearchResults(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-elevated)] transition-colors flex items-center justify-between group"
                                        >
                                            <span style={{ color: 'var(--text-primary)' }}>{feature.label}</span>
                                            <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }}>Jump to</span>
                                        </button>
                                    ))}
                                    {searchableFeatures.filter(f => f.label.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                        <div className="px-4 py-3 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                                            Tidak ditemukan "{searchQuery}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <nav className="hidden md:flex items-center gap-1 p-1 rounded" style={{
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-default)'
                }}>
                    {[
                        { path: '/dashboard', label: 'Meja' },
                        { path: '/pos', label: 'F&B' },
                        { path: '/reservations', label: 'Reservasi' },
                        { path: '/members', label: 'Membership' },
                        { path: '/reports', label: 'Laporan' }
                    ].map(item => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className="px-4 py-1.5 text-sm font-medium rounded transition-all"
                            style={getNavStyle(item.path)}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-3 pl-4" style={{ borderLeft: '1px solid var(--border-default)' }}>


                    <BookingAlerts />

                    <div className="relative">
                        <div
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-3 cursor-pointer p-2 rounded transition-colors"
                            style={{ backgroundColor: showProfileMenu ? 'var(--bg-elevated)' : 'transparent' }}
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.fullName || 'User'}</p>
                                <p className="text-xs" style={{ color: 'var(--accent-primary)' }}>{user?.role || 'Staff'}</p>
                            </div>
                            <div
                                className="rounded w-10 h-10"
                                style={{
                                    backgroundColor: 'var(--border-default)',
                                    backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDSXEwEBAG2NAPXBI83UjWeu9u1BDtuzfF4yVgsN5WQpTMsVVZE24sxesTJzVeY3buzorogyyDq6FCbFmjtOXwj-e8alujnNmVnTNFSHLYgum6OMhZUcVUxZIs86OC3NInm0W4cv-3gGo22Esm1gT9UNbUqbr2J05G8T86iSw7_G4brvFWfxtTBJU5RLMDKXqZWQSZgajGUqpuuxsrx5HbSEMMx0nKtmBHUb32ZSe3bEHZyX1Pdbyv7m22TEnCokFBjVHwjSNHoEas")',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    border: '1px solid var(--border-default)'
                                }}
                            ></div>
                        </div>

                        {/* Dropdown Menu */}
                        {showProfileMenu && (
                            <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl overflow-hidden z-50" style={{
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border-default)'
                            }}>
                                <div className="p-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
                                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{user?.fullName || 'User'}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user?.username || 'user'}</p>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            router.push('/profile');
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        <User size={16} />
                                        Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            router.push('/settings');
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        <Settings size={16} />
                                        Settings
                                    </button>
                                </div>
                                <div className="py-1" style={{ borderTop: '1px solid var(--border-default)' }}>
                                    <button
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            handleLogout();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                                        style={{ color: 'var(--danger)' }}
                                    >
                                        <LogOut size={16} />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
