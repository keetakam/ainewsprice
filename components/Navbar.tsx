"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme, themes, type ThemeName } from "./ThemeProvider";

export default function Navbar() {
  const path = usePathname();
  const { theme, setTheme } = useTheme();

  const nav: { href: string; label: string }[] = [
    { href: "/", label: "Pricing" },
    { href: "/news", label: "News" },
  ];

  return (
    <header style={{
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 16px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 18, color: "var(--accent)" }}>
          AI Pricing
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Theme picker */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {(Object.entries(themes) as [ThemeName, { accent: string }][]).map(([name, { accent }]) => (
              <button
                key={name}
                title={name}
                onClick={() => setTheme(name)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: accent,
                  border: theme === name ? "2px solid #fff" : "2px solid transparent",
                  outline: theme === name ? `2px solid ${accent}` : "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "transform 0.15s",
                  transform: theme === name ? "scale(1.2)" : "scale(1)",
                }}
              />
            ))}
          </div>

          {/* Nav links */}
          <nav style={{ display: "flex", gap: 8 }}>
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontWeight: 500,
                  color: path === href ? "#fff" : "var(--muted)",
                  background: path === href ? "var(--accent)" : "transparent",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
