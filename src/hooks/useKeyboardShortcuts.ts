'use client';

import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], enabled: boolean = true) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        // Skip if user is typing in input/textarea
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            // Allow ESC to work even in inputs
            if (event.key !== 'Escape') return;
        }

        for (const shortcut of shortcuts) {
            const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
                event.code.toLowerCase() === shortcut.key.toLowerCase();

            const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
            const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
            const altMatch = shortcut.alt ? event.altKey : !event.altKey;

            if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                event.preventDefault();
                shortcut.action();
                return;
            }
        }
    }, [shortcuts, enabled]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

// Pre-defined shortcuts for common actions
export const dashboardShortcuts = {
    F2: 'Start Table',
    F3: 'Stop/Checkout',
    F4: 'Add F&B Order',
    F5: 'Refresh',
    ESC: 'Close Modal',
    'Ctrl+S': 'Quick Save',
    'Ctrl+P': 'Print',
};
