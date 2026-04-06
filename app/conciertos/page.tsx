"use client";

import Link from 'next/link';
import '../../css/conciertos.css';

// SVG icon components (no FontAwesome)
const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconPin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconMusic = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
);

export default function ConciertosPage() {
  const upcomingConcerts = [
    {
      id: 'proximo',
      title: 'Próximo Gran Concierto',
      date: 'Próximamente',
      venue: 'Auditorio Alfredo Kraus',
      description: 'Próximamente anunciaremos los detalles de nuestro siguiente gran evento. ¡Mantente atento!',
      ticketUrl: 'https://auditorioalfredokraus.janto.es/janto/main.php?Nivel=Evento&idEvento=OCGC0326',
      gradient: 'linear-gradient(135deg, var(--clr-navy), var(--clr-navy-mid))',
    },
  ];

  const pastConcerts = [
    {
      id: 'cuerdas',
      title: 'Cuerdas que unen',
      date: '2024',
      description: 'Un concierto muy especial con nuestros músicos de cuerda. Una tarde inolvidable de emoción y virtuosismo.',
      gradient: 'linear-gradient(135deg, var(--clr-primary), var(--clr-navy-mid))',
    },
    {
      id: 'rach',
      title: 'Rachmaninov · Misisipi · Héroes',
      date: '2023',
      description: 'Homenaje a los grandes clásicos junto a piezas épicas que dejaron huella entre nuestro público.',
      gradient: 'linear-gradient(135deg, #1a2a4b, #2d3561)',
    },
    {
      id: 'clasicos',
      title: 'Clásicos de Cuento',
      date: '2023',
      description: 'Las historias de siempre contadas a través de la música. Un viaje mágico para toda la familia.',
      gradient: 'linear-gradient(135deg, #5b2d8e, #8e44ad)',
    },
    {
      id: 'navidad',
      title: 'Concierto de Navidad',
      date: '2022',
      description: 'La magia de la Navidad puesta en música sinfónica. Tradición y emoción en un solo acto.',
      gradient: 'linear-gradient(135deg, #c0392b, #a93226)',
    },
    {
      id: 'primavera',
      title: 'Primavera Musical',
      date: '2022',
      description: 'Un recorrido por las grandes obras del clasicismo y el romanticismo en el Auditorio Alfredo Kraus.',
      gradient: 'linear-gradient(135deg, #27ae60, #1e8449)',
    },
  ];

  return (
    <>
      {/* Hero */}
      <section
        className="concert-header"
        style={{ backgroundImage: "url('/assets/images/concert.jpg')" }}
        aria-label="Encabezado de Conciertos"
      >
        <div>
          <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--clr-gold)', marginBottom: 'var(--sp-3)' }}>
            OCGC · Programación
          </span>
          <h1>Temporada 2025–2026</h1>
          <p>Descubre nuestros próximos eventos y acompáñanos en la música</p>
        </div>
      </section>

      {/* Próximos conciertos */}
      <section className="section bg-white" aria-labelledby="upcoming-heading">
        <span className="section-eyebrow">Agenda</span>
        <h2 id="upcoming-heading" className="section-title">Próximos Conciertos</h2>
        <div className="concert-grid">
          {upcomingConcerts.map((c) => (
            <article className="concert-card" key={c.id} aria-label={`Concierto: ${c.title}`}>
              <div className="concert-img-placeholder" style={{ background: c.gradient, color: 'rgba(255,255,255,0.5)' }}>
                <IconMusic />
              </div>
              <div className="concert-info">
                <span className="concert-date">
                  <IconCalendar /> {c.date}
                </span>
                <h3>{c.title}</h3>
                <p style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', color: 'var(--clr-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-3)' }}>
                  <IconPin /> {c.venue}
                </p>
                <p>{c.description}</p>
                <a
                  href={c.ticketUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', marginTop: 'var(--sp-4)' }}
                >
                  Comprar Entradas
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Historial */}
      <section className="section-full bg-light" style={{ paddingBlock: 'var(--sp-20)' }} aria-labelledby="past-heading">
        <div style={{ maxWidth: 'var(--max-w)', marginInline: 'auto', paddingInline: 'var(--sp-8)' }}>
          <span className="section-eyebrow">Archivo</span>
          <h2 id="past-heading" className="section-title">Histórico de Conciertos</h2>
          <p className="section-subtitle" style={{ marginBottom: 'var(--sp-10)' }}>
            Todos los momentos que hemos vivido juntos sobre el escenario.
          </p>
          <div className="concert-grid">
            {pastConcerts.map((c) => (
              <article className="concert-card" key={c.id} aria-label={`Concierto pasado: ${c.title}`}>
                <div
                  className="concert-img-placeholder"
                  style={{ background: c.gradient, fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 600, letterSpacing: '-0.01em', padding: 'var(--sp-6)', textAlign: 'center', color: 'rgba(255,255,255,0.9)' }}
                >
                  {c.title}
                </div>
                <div className="concert-info">
                  <span className="concert-date">{c.date}</span>
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--clr-navy)', padding: 'var(--sp-16) var(--sp-8)', textAlign: 'center' }} aria-labelledby="cta-heading">
        <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clr-gold)', marginBottom: 'var(--sp-4)' }}>
          ¿Eres músico?
        </span>
        <h2 id="cta-heading" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)', color: '#fff', marginBottom: 'var(--sp-4)' }}>
          Sube al escenario con nosotros
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'var(--text-lg)', maxWidth: 520, marginInline: 'auto', marginBottom: 'var(--sp-8)' }}>
          La OCGC siempre tiene las puertas abiertas para músicos de todos los niveles y estilos.
        </p>
        <Link href="/unete" className="btn btn-gold">Únete a la familia</Link>
      </section>
    </>
  );
}
