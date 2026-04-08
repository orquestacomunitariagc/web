"use client";

import Link from 'next/link';
import { useState } from 'react';
import { UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from 'next/navigation';
import '@/css/miembros.css';

export default function HeaderMiembros() {
  const { user } = useUser();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = !!user?.publicMetadata?.isMaster || !!user?.publicMetadata?.isArchiver;

  const navItems = [
    { href: '/miembros/tablon', label: 'Tablón' },
    { href: '/miembros/repositorio', label: 'Repositorio' },
    { href: '/miembros/agenda', label: 'Agenda' },
  ];

  return (
    <header className="header-miembros-v2" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
      {/* Logo */}
      <div className="logo">
        <Link href="/" aria-label="Ir al sitio público">
          <img src="/assets/images/logo_ocgc.png" alt="OCGC" />
        </Link>
      </div>

      {/* Navigation (Desktop) */}
      <nav className="miembros-nav-bar hide-mobile" aria-label="Navegación de miembros">
        <ul className="miembros-menu">
          {navItems.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`miembros-link ${pathname === href ? 'active' : ''}`}
                aria-current={pathname === href ? 'page' : undefined}
              >
                {label}
              </Link>
            </li>
          ))}

          {isAdmin && (
            <li>
              <Link
                href="/miembros/gestion"
                className={`miembros-link highlight-admin ${pathname.startsWith('/miembros/gestion') ? 'active' : ''}`}
              >
                Gestión
              </Link>
            </li>
          )}

          {/* User area */}
          <li className="miembros-user-area">
            {user?.firstName && (
              <span className="miembros-hola">Hola, {user.firstName}</span>
            )}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: { width: 36, height: 36 },
                  userButtonPopoverCard: { borderRadius: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.15)' },
                }
              }}
            />
          </li>
        </ul>
      </nav>

      {/* Mobile hamburger */}
      <button
        className="mobile-menu-btn show-mobile-only"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menú"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {mobileOpen
            ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
            : <><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></>
          }
        </svg>
      </button>

      {/* Drawer Lateral Miembros */}
      <div className={`mobile-drawer-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)}>
        <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
          <nav className="mobile-drawer-nav">
            {navItems.map(({ href, label }) => (
              <Link key={href} href={href} className="mobile-drawer-link" onClick={() => setMobileOpen(false)}>
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/miembros/gestion" className="mobile-drawer-link" style={{ color: 'var(--clr-gold)' }} onClick={() => setMobileOpen(false)}>
                Panel de Gestión
              </Link>
            )}
            
            <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <UserButton />
              <span style={{ color: '#fff', fontWeight: 600 }}>{user?.firstName}</span>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
