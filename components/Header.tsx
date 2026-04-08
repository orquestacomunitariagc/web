"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={scrolled ? 'scrolled' : ''}>
      {/* Logo */}
      <div className="logo">
        <Link href="/" aria-label="OCGC — Inicio">
          <img src="/assets/images/logo_ocgc.png" alt="OCGC Logo" />
        </Link>
      </div>

      {/* Desktop Nav - SIEMPRE VISIBLE EN PC, OCULTO EN MÓVIL */}
      <nav aria-label="Navegación principal" className="hide-mobile">
        <ul className="nav-links">
          <li><Link href="/">Inicio</Link></li>
          <li><Link href="/nosotros">Nosotros</Link></li>
          <li><Link href="/conciertos">Conciertos</Link></li>
          <li><Link href="/unete">Únete</Link></li>
          <li>
            <a
              href="https://www.paypal.com/donate/?hosted_button_id=WQGTER7DPGGB6"
              target="_blank"
              rel="noreferrer"
              className="btn-donate"
            >
              Donar
            </a>
          </li>
        </ul>

        <a
          href="https://auditorioalfredokraus.janto.es/janto/main.php?Nivel=Evento&idEvento=OCGC0326"
          target="_blank"
          rel="noreferrer"
          className="btn-tickets"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
          </svg>
          Entradas
        </a>
      </nav>

      {/* Botón hamburguesa - SOLO VISIBLE EN MÓVIL */}
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

      {/* Drawer Lateral Móvil */}
      <div className={`mobile-drawer-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)}>
        <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
          <nav className="mobile-drawer-nav">
            <Link href="/" className="mobile-drawer-link" onClick={() => setMobileOpen(false)}>Inicio</Link>
            <Link href="/nosotros" className="mobile-drawer-link" onClick={() => setMobileOpen(false)}>Nosotros</Link>
            <Link href="/conciertos" className="mobile-drawer-link" onClick={() => setMobileOpen(false)}>Conciertos</Link>
            <Link href="/unete" className="mobile-drawer-link" onClick={() => setMobileOpen(false)}>Únete</Link>
            
            <div className="mobile-drawer-actions">
              <a href="https://www.paypal.com/donate/?hosted_button_id=WQGTER7DPGGB6" target="_blank" rel="noreferrer" className="btn-donar-mobile">
                Donar
              </a>
              <a href="https://auditorioalfredokraus.janto.es/janto/main.php?Nivel=Evento&idEvento=OCGC0326" target="_blank" rel="noreferrer" className="btn-tickets-mobile">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                </svg>
                Comprar Entradas
              </a>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
