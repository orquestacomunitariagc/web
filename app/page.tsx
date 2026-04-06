"use client";

import Link from 'next/link';

export default function Home() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="main-header" aria-label="Sección principal">
        <div
          className="hero-bg"
          style={{ backgroundImage: "url('/assets/images/concert.jpg')" }}
          role="img"
          aria-label="Fotografía de concierto de la OCGC"
        />
        <div className="main-header-content">
          <span className="hero-eyebrow">Gran Canaria · Desde 2018</span>
          <h1>La orquesta de todos<br />y para todos</h1>
          <p>Música sinfónica, coro y ensamble con pasión<br />desde el corazón de Gran Canaria.</p>
          <div className="main-header-actions">
            <Link href="/nosotros" className="btn btn-gold">Conócenos</Link>
            <Link href="/unete" className="btn btn-outline-white">Únete</Link>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="hero-scroll" aria-hidden="true">
          <span>Descubre</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="stats-bar" role="region" aria-label="Cifras destacadas">
        <div className="stats-grid">
          {[
            { num: '+150', label: 'Músicos Activos' },
            { num: '+50', label: 'Conciertos Ofrecidos' },
            { num: '6', label: 'Agrupaciones' },
            { num: '2018', label: 'Año de Fundación' },
          ].map(({ num, label }) => (
            <div className="stat-item" key={label}>
              <span className="stat-num">{num}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ABOUT ── */}
      <section className="section bg-white" aria-labelledby="about-heading">
        <div className="about-grid">
          <div className="about-content">
            <span className="section-eyebrow">Quiénes somos</span>
            <h2 id="about-heading">Una orquesta nacida<br />de la pasión compartida</h2>
            <p>
              La Orquesta Comunitaria de Gran Canaria (OCGC) nace como respuesta a la necesidad de los músicos
              de la comunidad grancanaria de tener un espacio donde compartir su pasión por la música sinfónica.
            </p>
            <p>
              Nuestro principal motor es la unión social a través del lenguaje universal de la música, ofreciendo
              oportunidades de aprendizaje, crecimiento y disfrute a todos sus componentes y al público.
            </p>
            <div className="nosotros-actions">
              <Link href="/nosotros" className="btn btn-primary">Saber más sobre nosotros</Link>
              <Link href="/conciertos" className="btn btn-outline">Ver próximos conciertos</Link>
            </div>
          </div>
          <div className="video-container">
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0"
              title="Orquesta Comunitaria de Gran Canaria — Actuación"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ── AGRUPACIONES ── */}
      <section className="section-full bg-light" aria-labelledby="groups-heading" style={{ paddingBlock: 'var(--sp-20)' }}>
        <div style={{ maxWidth: 'var(--max-w)', marginInline: 'auto', paddingInline: 'var(--sp-8)' }}>
          <div className="text-center" style={{ marginBottom: 'var(--sp-12)' }}>
            <span className="section-eyebrow">Nuestras Agrupaciones</span>
            <h2 id="groups-heading" className="section-title">Seis voces, un mismo corazón</h2>
            <p className="section-subtitle">Descubre todos los grupos que forman la gran familia de la OCGC</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--sp-5)' }}>
            {[
              { name: 'Orquesta Sinfónica', href: '/nosotros/orquesta', emoji: '🎻', desc: 'El corazón de la OCGC. Repertorio sinfónico de todas las épocas.' },
              { name: 'Coro', href: '/nosotros/coro', emoji: '🎤', desc: 'Voces que elevan el espíritu. Música coral clásica y contemporánea.' },
              { name: 'Ensemble de Flautas', href: '/nosotros/ensemble-de-flautas', emoji: '🎶', desc: 'La delicadeza del viento madera en pequeño formato.' },
              { name: 'Ensemble de Metales', href: '/nosotros/ensemble-de-metales', emoji: '🎺', desc: 'Potencia y brillo de los metales en perfecta armonía.' },
              { name: 'Ensemble de Violonchelos', href: '/nosotros/ensemble-de-violonchelos', emoji: '🎵', desc: 'La calidez profunda de la cuerda grave.' },
              { name: 'Big Band', href: '/nosotros/big-band', emoji: '🎷', desc: 'Jazz, swing y big band en estado puro.' },
            ].map(({ name, href, desc }) => (
              <Link
                key={name}
                href={href}
                className="card"
                style={{ padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', textDecoration: 'none' }}
              >
                <div style={{
                  width: 56, height: 56,
                  background: 'linear-gradient(135deg, var(--clr-primary-lt), #d0ebff)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 'var(--sp-2)',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--clr-primary)" strokeWidth="1.75" aria-hidden="true">
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                  </svg>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', color: 'var(--clr-navy)', margin: 0 }}>{name}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-muted)', margin: 0, lineHeight: 1.6 }}>{desc}</p>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-primary)', fontWeight: 600, marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Conocer más
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="newsletter-section" aria-labelledby="newsletter-heading">
        <div style={{ maxWidth: 'var(--max-w)', marginInline: 'auto', paddingInline: 'var(--sp-8)' }}>
          <span className="hero-eyebrow" style={{ color: 'var(--clr-gold)' }}>Mantente al día</span>
          <h2 id="newsletter-heading">Newsletter</h2>
          <p className="lead">
            ¿Quieres estar al tanto de las novedades y actividades de la OCGC?<br />
            ¡Apúntate y recibe todas nuestras noticias directamente en tu correo!
          </p>
          <form
            action="#"
            method="POST"
            className="newsletter-form"
            onSubmit={(e) => { e.preventDefault(); alert('¡Gracias por suscribirte!'); }}
            aria-label="Formulario de suscripción al newsletter"
          >
            <input
              type="text"
              placeholder="Nombre completo"
              required
              className="form-control"
              autoComplete="name"
            />
            <input
              type="email"
              placeholder="Correo electrónico"
              required
              className="form-control newsletter-email"
              autoComplete="email"
            />
            <div className="checkbox-group privacy-group">
              <input type="checkbox" id="privacy" required />
              <label htmlFor="privacy">
                Acepto la <a href="#">Política de privacidad</a>
              </label>
            </div>
            <button type="submit" className="btn btn-gold btn-full-width">
              Suscribirme
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
