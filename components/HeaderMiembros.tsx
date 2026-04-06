"use client";

import Link from 'next/link';
import { UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from 'next/navigation';
import '@/css/miembros.css';

export default function HeaderMiembros() {
  const { user } = useUser();
  const pathname = usePathname();
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

      {/* Navigation */}
      <nav className="miembros-nav-bar" aria-label="Navegación de miembros">
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
    </header>
  );
}
