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

      {/* Desktop Nav */}
      <nav aria-label="Navegación principal">
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
          aria-label="Comprar entradas"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
          </svg>
          Entradas
        </a>
      </nav>

      {/* Mobile hamburger */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={mobileOpen}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          {mobileOpen
            ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
            : <><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/></>
          }
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            top: 'var(--header-h)',
            background: 'rgba(13,27,42,0.96)',
            backdropFilter: 'blur(10px)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem',
          }}
          onClick={() => {
            setMobileOpen(false);
            // Wait for DOM
            setTimeout(() => {
                if (typeof window !== 'undefined') window.scrollTo({top: 0, behavior: 'smooth'});
            }, 50);
          }}
        >
          {[
            { href: '/', label: 'Inicio' },
            { href: '/nosotros', label: 'Nosotros' },
            { href: '/conciertos', label: 'Conciertos' },
            { href: '/unete', label: 'Únete' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.5rem',
                color: '#fff',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                transition: 'color 0.2s',
              }}
            >
              {label}
            </Link>
          ))}
          <a
            href="https://www.paypal.com/donate/?hosted_button_id=WQGTER7DPGGB6"
            target="_blank"
            rel="noreferrer"
            className="btn-donate"
            style={{ marginTop: '1rem' }}
          >
            Donar
          </a>
        </div>
      )}
    </header>
  );
}
