/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect } from "react";

/**
 * GameThemeContext
 * ─────────────────
 * Provides per-game color theming by writing CSS custom properties
 * directly to document.documentElement so all game post sections
 * can consume them via var(--gp-*) without prop drilling.
 *
 * The theme object shape:
 * {
 *   primary:      hex string   (main accent, e.g. "#e53935")
 *   primaryDark:  hex string   (darker shade e.g. "#c62828")
 *   primaryLight: hex string   (lighter shade e.g. "#ef5350")
 *   bgPage:       hex string   (page background e.g. "#fff5f5")
 *   bgSection:    hex string   (section bg e.g. "#ffebee")
 *   border:       hex string   (border color e.g. "#ffcdd2")
 *   textHeading:  hex string   (heading text e.g. "#c62828")
 * }
 *
 * When backend is wired up, these values come from the admin hero
 * image color picker stored in the game_posts table.
 */

const GameThemeContext = createContext(null);

export function GameThemeProvider({ theme, children }) {
    useEffect(() => {
        if (!theme) return;

        const root = document.documentElement;

        // Map theme object keys to CSS variable names
        const vars = {
            "--gp-primary": theme.primary,
            "--gp-primary-dark": theme.primaryDark || shadeColor(theme.primary, -20),
            "--gp-primary-light": theme.primaryLight || shadeColor(theme.primary, 20),
            "--gp-primary-alpha": hexToAlpha(theme.primary, 0.12),
            "--gp-primary-alpha-low": hexToAlpha(theme.primary, 0.05),
            "--gp-primary-alpha-medium": hexToAlpha(theme.primary, 0.15),
            "--gp-primary-alpha-high": hexToAlpha(theme.primary, 0.40),
            "--gp-bg-page": theme.bgPage || lighten(theme.primary, 0.95),
            "--gp-bg-section": theme.bgSection || lighten(theme.primary, 0.90),
            "--gp-bg-card": "var(--theme-card)",
            "--gp-bg-card-alt": "var(--theme-bg-alt)",
            "--gp-border": theme.border || "rgba(255,255,255,0.05)",
            "--gp-border-strong": "rgba(255,255,255,0.1)",
            "--gp-text-heading": theme.textHeading || "#ffffff",
            "--gp-text-body": "var(--theme-text)",
            "--gp-text-muted": "var(--theme-text-muted)",
            "--gp-text-on-accent": "#ffffff",
            "--gp-tag-bg": hexToAlpha(theme.primary, 0.10),
            "--gp-tag-border": theme.primary,
            "--gp-tag-text": theme.primary,
            "--gp-table-header": theme.primary,
            "--gp-table-text": "#ffffff",
            "--gp-btn-bg": theme.primary,
            "--gp-btn-hover": shadeColor(theme.primary, -20),
            "--gp-btn-outline-border": theme.primary,
            "--gp-btn-outline-text": theme.primary,
            "--gp-btn-outline-hover-bg": theme.primary,
            "--gp-quote-bg": theme.primary,
            "--gp-icon-circle-bg": lighten(theme.primary, 0.90),
            "--gp-icon-circle-fg": theme.primary,
            "--gp-cta-gradient": `linear-gradient(135deg, ${theme.primary} 0%, ${shadeColor(theme.primary, -20)} 100%)`,
"--gp-accent-bar": `3px solid ${theme.primary}`,
            "--gp-bg-glow": hexToAlpha(theme.primary, 0.06),
        };

        Object.entries(vars).forEach(([k, v]) => {
            if (v) root.style.setProperty(k, v);
        });

        // Cleanup: restore defaults when component unmounts (navigating away)
        return () => {
            Object.keys(vars).forEach(k => root.style.removeProperty(k));
        };
    }, [theme]);

    return (
        <GameThemeContext.Provider value={theme}>
            {children}
        </GameThemeContext.Provider>
    );
}

export function useGameTheme() {
    return useContext(GameThemeContext);
}

// ── Utilities ──────────────────────────────────────────────────

/** Lighten a hex color by mixing with white; amount 0–1 = 0%–100% white */
function lighten(hex, amount) {
    const { r, g, b } = hexToRgb(hex);
    const mix = v => Math.round(v + (255 - v) * amount);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/** Darken/lighten by percentage: positive = lighter, negative = darker */
function shadeColor(hex, pct) {
    const { r, g, b } = hexToRgb(hex);
    const clamp = v => Math.max(0, Math.min(255, Math.round(v + (v * pct) / 100)));
    return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`;
}

function hexToAlpha(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgb(hex) {
    if (!hex || typeof hex !== 'string') return { r: 0, g: 0, b: 0 };
    const clean = hex.replace("#", "");
    const full = clean.length === 3
        ? clean.split("").map(c => c + c).join("")
        : clean.length === 6 ? clean : "000000";
    const num = parseInt(full, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}





