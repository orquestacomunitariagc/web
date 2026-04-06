"use client";

import Link from 'next/link';

const groups = [
  {
    id: 'orquesta',
    name: 'Orquesta Sinfónica',
    short: 'Orquesta',
    desc: 'Nuestro corazón artístico. Repertorio sinfónico de todas las épocas para músicos de cuerda, viento y percusión.',
    color: 'linear-gradient(135deg, var(--clr-navy), var(--clr-navy-mid))',
    accent: '#478AC9',
  },
  {
    id: 'coro',
    name: 'Coro (COCGC)',
    short: 'Coro',
    desc: 'Voces que elevan el espíritu. Música coral clásica, contemporánea y popular con todo el corazón.',
    color: 'linear-gradient(135deg, #5b2d8e, #8e44ad)',
    accent: '#9b59b6',
  },
  {
    id: 'bigband',
    name: 'Big Band',
    short: 'Big Band',
    desc: 'Jazz, swing y blues en estado puro. Saxofones, metales y base rítmica para aportar energía vital.',
    color: 'linear-gradient(135deg, #1a2a4b, #2c3561)',
    accent: '#C9A84C',
  },
  {
    id: 'flautas',
    name: 'Ensemble de Flautas',
    short: 'Flautas',
    desc: 'La delicadeza del viento madera. Desde el piccolo hasta la flauta bajo, en pequeño formato de cámara.',
    color: 'linear-gradient(135deg, #16a085, #1abc9c)',
    accent: '#1abc9c',
  },
  {
    id: 'metales',
    name: 'Ensemble de Metales',
    short: 'Metales',
    desc: 'Potencia y brillo. Trompetas, trompas, trombones y tubas en perfecta armonía sinfónica.',
    color: 'linear-gradient(135deg, #c0392b, #e74c3c)',
    accent: '#e74c3c',
  },
  {
    id: 'chelos',
    name: 'Ensemble de Violonchelos',
    short: 'Violonchelos',
    desc: 'Un espacio exclusivo dedicado al hermoso y cálido timbre del violonchelo. Una formación única en Canarias.',
    color: 'linear-gradient(135deg, #27ae60, #2ecc71)',
    accent: '#2ecc71',
  },
];

const values = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Comunidad',
    desc: 'Un espacio inclusivo donde la música une a personas de todos los orígenes y niveles.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    title: 'Excelencia',
    desc: 'Buscamos la calidad artística sin perder de vista que la música es ante todo disfrute.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
      </svg>
    ),
    title: 'Pasión',
    desc: 'Cada ensayo, cada nota, cada concierto nace de una profunda pasión compartida por la música.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    title: 'Apertura',
    desc: 'Abiertos a toda la sociedad, sin distinción. La música como puente entre personas y culturas.',
  },
];

export default function NosotrosPage() {
  return (
    <>
      {/* ── HERO ── */}
      <section
        className="main-header"
        style={{ height: '70vh', minHeight: 480 }}
        aria-labelledby="nosotros-heading"
      >
        <div
          className="hero-bg"
          style={{ backgroundImage: "url('/assets/images/concert.jpg')" }}
          role="img"
          aria-label="Fotografía de la OCGC en concierto"
        />
        <div className="main-header-content">
          <span className="hero-eyebrow">Gran Canaria · Desde 2018</span>
          <h1 id="nosotros-heading">Quiénes Somos</h1>
          <p>Una orquesta nacida de la pasión compartida<br />por la música y la comunidad.</p>
        </div>
      </section>

      {/* ── HISTORIA ── */}
      <section className="section bg-white" aria-labelledby="historia-heading">
        <div className="about-grid">
          <div className="about-content">
            <span className="section-eyebrow">Nuestra Historia</span>
            <h2 id="historia-heading">Un proyecto que nació<br />de la ilusión colectiva</h2>
            <p>
              La Orquesta Comunitaria de Gran Canaria (OCGC) nace en 2018 como respuesta a la necesidad
              de los músicos de la comunidad grancanaria de tener un espacio donde compartir su pasión
              por la música sinfónica.
            </p>
            <p>
              Lo que comenzó como reunión de amigos con un instrumento, se ha convertido hoy en un
              proyecto cultural de referencia en las Islas Canarias, con más de 150 músicos activos
              distribuidos en seis agrupaciones.
            </p>
            <p>
              Nuestro principal motor es la unión social a través del lenguaje universal de la música,
              ofreciendo oportunidades de aprendizaje, crecimiento y disfrute a todos sus componentes
              y al público asistente.
            </p>
            <div className="nosotros-actions">
              <Link href="/unete" className="btn btn-primary">Únete a la familia</Link>
              <Link href="/conciertos" className="btn btn-outline">Ver conciertos</Link>
            </div>
          </div>
          <div className="video-container">
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0"
              title="OCGC — Presentación de la Orquesta"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="stats-bar" role="region" aria-label="Cifras de la OCGC">
        <div className="stats-grid">
          {[
            { num: '+150', label: 'Músicos Activos' },
            { num: '+50',  label: 'Conciertos Ofrecidos' },
            { num: '6',    label: 'Agrupaciones' },
            { num: '2018', label: 'Año de Fundación' },
          ].map(({ num, label }) => (
            <div className="stat-item" key={label}>
              <span className="stat-num">{num}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── VALORES ── */}
      <section className="section-full bg-light" style={{ paddingBlock: 'var(--sp-20)' }} aria-labelledby="valores-heading">
        <div style={{ maxWidth: 'var(--max-w)', marginInline: 'auto', paddingInline: 'var(--sp-8)' }}>
          <div className="text-center" style={{ marginBottom: 'var(--sp-12)' }}>
            <span className="section-eyebrow">Lo que nos mueve</span>
            <h2 id="valores-heading" className="section-title">Nuestros Valores</h2>
            <p className="section-subtitle">Los principios que guían cada ensayo, cada concierto y cada decisión de la OCGC.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--sp-6)' }}>
            {values.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="card"
                style={{ padding: 'var(--sp-8)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', cursor: 'default' }}
              >
                <div style={{
                  width: 56, height: 56,
                  background: 'var(--clr-primary-lt)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--clr-primary)',
                  flexShrink: 0,
                }}>
                  {icon}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', color: 'var(--clr-navy)', margin: 0 }}>{title}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-muted)', margin: 0, lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AGRUPACIONES ── */}
      <section className="section bg-white" aria-labelledby="agrupaciones-heading">
        <div className="text-center" style={{ marginBottom: 'var(--sp-12)' }}>
          <span className="section-eyebrow">La familia OCGC</span>
          <h2 id="agrupaciones-heading" className="section-title">Nuestras Agrupaciones</h2>
          <p className="section-subtitle">Seis voces, un mismo corazón. Cada agrupación tiene su identidad y personalidad únicas.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--sp-5)' }}>
          {groups.map(({ id, name, short, desc, color }) => (
            <article
              key={id}
              aria-labelledby={`group-${id}`}
              style={{
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                border: '1px solid var(--clr-border)',
                boxShadow: 'var(--shadow-xs)',
                transition: 'transform var(--ease-mid), box-shadow var(--ease-mid)',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-xs)';
              }}
            >
              {/* Card banner */}
              <div style={{
                background: color,
                height: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.9)',
                  letterSpacing: '0.05em',
                }}>
                  {short}
                </span>
              </div>
              {/* Card body */}
              <div style={{ padding: 'var(--sp-6)', background: 'var(--clr-surface)' }}>
                <h3 id={`group-${id}`} style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', color: 'var(--clr-navy)', marginBottom: 'var(--sp-3)' }}>
                  {name}
                </h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-muted)', lineHeight: 1.7, marginBottom: 'var(--sp-5)' }}>
                  {desc}
                </p>
                <Link
                  href="/unete"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--sp-2)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 700,
                    color: 'var(--clr-primary)',
                    textDecoration: 'none',
                    transition: 'gap var(--ease-fast)',
                  }}
                >
                  Apuntarse
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="newsletter-section"
        style={{ textAlign: 'center' }}
        aria-labelledby="cta-nosotros-heading"
      >
        <div style={{ maxWidth: 'var(--max-w)', marginInline: 'auto', paddingInline: 'var(--sp-8)' }}>
          <span className="hero-eyebrow" style={{ color: 'var(--clr-gold)' }}>¿Quieres ser parte?</span>
          <h2 id="cta-nosotros-heading" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)', color: '#fff', marginBottom: 'var(--sp-4)' }}>
            Tu instrumento tiene un sitio aquí
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--text-lg)', maxWidth: 540, marginInline: 'auto', marginBottom: 'var(--sp-8)' }}>
            La OCGC siempre tiene las puertas abiertas para músicos de todos los niveles, edades y estilos.
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/unete" className="btn btn-gold">Únete ahora</Link>
            <Link href="/conciertos" className="btn btn-outline-white">Ver conciertos</Link>
          </div>
        </div>
      </section>
    </>
  );
}
