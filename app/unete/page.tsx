"use client";

import { useState } from 'react';
import '../../css/unete.css';

type GroupId = 'orquesta' | 'coro' | 'flautas' | 'metales' | 'chelos' | 'bigband';

interface Group {
  id: GroupId;
  name: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  formExtra?: React.ReactNode;
}

const IconViolin = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
);

const IconMic = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
  </svg>
);

const IconWind = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
  </svg>
);

const IconDrum = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <ellipse cx="12" cy="7" rx="10" ry="4"/><path d="M2 7v10c0 2.2 4.5 4 10 4s10-1.8 10-4V7"/>
    <path d="M12 11v8"/><path d="M8 9.5v9"/><path d="M16 9.5v9"/>
  </svg>
);

const IconSax = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M4 4h4l2 4-4 2-2-6z"/><path d="M20 20c-4 0-8-4-8-8 0-3 2-5 4-5s4 2 4 4-2 4-4 4"/><circle cx="8" cy="16" r="2"/>
  </svg>
);

const IconCello = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M12 2C8 2 6 5 6 8c0 2 1 4 3 5.5L8 21h8l-1-7.5C17 12 18 10 18 8c0-3-2-6-6-6z"/>
    <line x1="9" y1="21" x2="15" y2="21"/>
  </svg>
);

export default function UnetePage() {
  const [activeForm, setActiveForm] = useState<GroupId | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [showOther, setShowOther] = useState(false);

  const handleSubmit = async (e: React.FormEvent, group: string) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    let selectedInstrument = formData.get("instrument")?.toString() || group;
    const otherVal = formData.get("instrument_other")?.toString();

    // Si seleccionó "Otro" y escribió algo, usamos el valor del input de texto
    if ((selectedInstrument.includes("Otro") || selectedInstrument === "otro") && otherVal) {
      selectedInstrument = otherVal;
    }

    const data = {
      name: `${formData.get("first_name")} ${formData.get("last_name")}`,
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      email: formData.get("email"),
      phone: `${formData.get("phone_prefix")} ${formData.get("phone")}`,
      experience: formData.get("experience"),
      group: group,
      instrument: selectedInstrument,
      fax_number: formData.get("fax_number"),
    };

    try {
      const res = await fetch("/api/unete", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });
      
      let resData;
      try {
        resData = await res.json();
      } catch (e) {
        resData = { error: "El servidor devolvió una respuesta inesperada." };
      }

      if (res.ok) {
        setStatus({ success: true, msg: `¡Solicitud para ${group} enviada con éxito!`, id: resData.id });
      } else {
        setStatus({ success: false, msg: resData.error || "Error al enviar la solicitud (Código: " + res.status + ")" });
      }
    } catch (err) {
      console.error("Error fatal en envío:", err);
      setStatus({ success: false, msg: "Error de conexión o fallo del servidor." });
    } finally {
      setLoading(false);
    }
  };

  const groups: Group[] = [
    {
      id: 'orquesta',
      name: 'Orquesta Sinfónica',
      description: 'Nuestra formación principal. Abiertos a músicos de todas las cuerdas, viento y percusión clásica.',
      color: 'var(--clr-primary)',
      icon: <IconViolin />,
      formExtra: (
        <select name="instrument" required className="form-control" style={{ background: '#fff' }} defaultValue="">
          <option value="" disabled>Instrumento *</option>
          <optgroup label="Cuerdas">
            <option>Violín</option>
            <option>Viola</option>
            <option>Violonchelo</option>
            <option>Contrabajo</option>
            <option>Arpa</option>
          </optgroup>
          <optgroup label="Viento Madera">
            <option>Flauta / Flautín</option>
            <option>Oboe / Corno Inglés</option>
            <option>Clarinete</option>
            <option>Fagot / Contrafagot</option>
          </optgroup>
          <optgroup label="Viento Metal">
            <option>Trompa</option>
            <option>Trompeta</option>
            <option>Trombón / Trombón Bajo</option>
            <option>Tuba</option>
          </optgroup>
          <optgroup label="Percusión / Otros">
            <option>Percusión / Timbales</option>
            <option>Piano / Celesta</option>
            <option>Otro Instrumento</option>
          </optgroup>
        </select>
      ),
    },
    {
      id: 'coro',
      name: 'Coro (COCGC)',
      description: 'La voz de la comunidad. Buscamos sopranos, altos, tenores y bajos con pasión por cantar en grupo.',
      color: '#8e44ad',
      icon: <IconMic />,
      formExtra: (
        <select name="instrument" required className="form-control" style={{ background: '#fff' }} defaultValue="">
          <option value="" disabled>Tipo de voz *</option>
          <option>Soprano</option>
          <option>Alto / Contralto</option>
          <option>Tenor</option>
          <option>Bajo / Barítono</option>
          <option>Aún no lo sé</option>
        </select>
      ),
    },
    {
      id: 'flautas',
      name: 'Ensemble de Flautas',
      description: 'Agrupación centrada en la familia de las flautas traversas, desde el piccolo hasta la flauta bajo.',
      color: '#16a085',
      icon: <IconWind />,
      formExtra: (
        <select name="instrument" required className="form-control" style={{ background: '#fff' }} defaultValue="">
          <option value="" disabled>Instrumento *</option>
          <option>Flauta Travesera</option>
          <option>Flautín (Piccolo)</option>
          <option>Flauta en Sol (Alto)</option>
          <option>Flauta Bajo</option>
        </select>
      ),
    },
    {
      id: 'metales',
      name: 'Ensemble de Metales',
      description: 'Para músicos que toquen trompeta, trompa, trombón o tuba. Potencia y brillo en perfecta armonía.',
      color: '#d35400',
      icon: <IconDrum />,
      formExtra: (
        <select name="instrument" required className="form-control" style={{ background: '#fff' }} defaultValue="">
          <option value="" disabled>Instrumento *</option>
          <option>Trompeta</option>
          <option>Trompa</option>
          <option>Trombón</option>
          <option>Tuba</option>
          <option>Otro Metal</option>
        </select>
      ),
    },
    {
      id: 'chelos',
      name: 'Ensemble de Violonchelos',
      description: 'Un espacio exclusivo dedicado al hermoso timbre del violonchelo. Una formación única en la isla.',
      color: '#c0392b',
      icon: <IconCello />,
      formExtra: (
        <input name="instrument" type="text" value="Violonchelo" readOnly className="form-control" style={{ background: '#f8f9fa' }} />
      ),
    },
    {
      id: 'bigband',
      name: 'Big Band',
      description: 'Si el Jazz, el Swing o el Blues son lo tuyo. Metales, saxofones y base rítmica para aportar ritmo vital.',
      color: '#1a2a4b',
      icon: <IconSax />,
      formExtra: (
        <select name="instrument" required className="form-control" style={{ background: '#fff' }} defaultValue="">
          <option value="" disabled>Instrumento *</option>
          <option>Saxofón Alto</option><option>Saxofón Tenor</option>
          <option>Saxofón Barítono</option><option>Trompeta</option>
          <option>Trombón</option><option>Batería</option>
          <option>Guitarra</option><option>Bajo / Contrabajo</option>
          <option>Piano</option>
        </select>
      ),
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="unete-header" aria-labelledby="unete-main-title">
        <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--clr-gold)', marginBottom: 'var(--sp-4)' }}>
          Forma parte de algo grande
        </span>
        <h1 id="unete-main-title">Haz música con nosotros</h1>
        <p>Elige la agrupación que más te guste e inscríbete para formar parte de la OCGC.</p>
      </section>

      {/* Groups section */}
      <section className="section bg-white" aria-labelledby="groups-heading">
        <div className="text-center" style={{ marginBottom: 'var(--sp-12)' }}>
          <span className="section-eyebrow">Nuestras agrupaciones</span>
          <h2 id="groups-heading" className="section-title">¿Con qué grupo vibras más?</h2>
          <p className="section-subtitle">
            Cada agrupación tiene su propia personalidad. Encuentra la que más conecta contigo.
          </p>
        </div>

        <div className="unete-grid">
          {groups.map((g) => (
            <article key={g.id} className="join-card" aria-labelledby={`${g.id}-title`}>
              <div className="card-content">
                <div className="join-icon" style={{ background: `${g.color}18`, color: g.color }}>
                  {g.icon}
                </div>
                <h3 id={`${g.id}-title`} style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', color: 'var(--clr-navy)' }}>{g.name}</h3>
                <p>{g.description}</p>
              </div>
              <div className="join-btn-container">
                <button
                  onClick={() => setActiveForm(g.id)}
                  className="btn btn-outline"
                  style={{ width: '100%', cursor: 'pointer' }}
                  aria-haspopup="dialog"
                  aria-label={`Inscribirse en ${g.name}`}
                >
                  Quiero unirme
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="section-full bg-light" style={{ paddingBlock: 'var(--sp-20)' }} aria-labelledby="process-heading">
        <div style={{ maxWidth: 'var(--max-w)', marginInline: 'auto', paddingInline: 'var(--sp-8)' }}>
          <div className="text-center" style={{ marginBottom: 'var(--sp-12)' }}>
            <span className="section-eyebrow">El proceso</span>
            <h2 id="process-heading" className="section-title">¿Cómo funciona?</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--sp-6)' }}>
            {[
              { num: '01', title: 'Solicita tu plaza', desc: 'Rellena el formulario de la agrupación que te interese.' },
              { num: '02', title: 'Te contactamos', desc: 'Nuestro equipo se pondrá en contacto contigo en menos de 48h.' },
              { num: '03', title: 'Prueba de nivel', desc: 'Realizarás una pequeña audición informal para conocerte.' },
              { num: '04', title: '¡Bienvenido a la familia!', desc: 'Te incorporas a los ensayos regulares de tu agrupación.' },
            ].map(({ num, title, desc }) => (
              <div key={num} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-5xl)', color: 'var(--clr-primary)', opacity: 0.3, lineHeight: 1, fontWeight: 700 }}>{num}</span>
                <h3 style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--clr-navy)' }}>{title}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-text-muted)', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      {activeForm && (() => {
        const g = groups.find(x => x.id === activeForm)!;
        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.8)', backdropFilter: 'blur(6px)', zIndex: 2000, alignItems: 'center', justifyContent: 'center', padding: 'var(--sp-4)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setActiveForm(null); }}
          >
            <div className="form-modal-content">
              <button className="close-modal" onClick={() => { setActiveForm(null); setStatus(null); }} aria-label="Cerrar modal">✕</button>
              
              {status?.success ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div style={{ width: '80px', height: '80px', background: 'var(--clr-success-lt)', color: 'var(--clr-success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2.5rem' }}>
                    ✓
                  </div>
                  <h3 style={{ color: 'var(--clr-navy)', marginBottom: '1rem' }}>{status.msg}</h3>
                  <p style={{ color: 'var(--clr-text-muted)', marginBottom: '2rem' }}>Hemos recibido tu interés para entrar en {g.name}. Nuestro equipo revisará tu perfil y te contactaremos por email o teléfono lo antes posible.</p>
                  <button 
                    onClick={() => { setActiveForm(null); setStatus(null); }}
                    className="btn btn-primary"
                    style={{ width: '100%', maxWidth: '200px' }}
                  >
                    Entendido
                  </button>
                </div>
              ) : (
                <>
                  <h3 id="modal-title">Inscripción: {g.name}</h3>

                  {status && (
                    <div className={`alert alert-error`} style={{ marginBottom: 'var(--sp-4)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
                      {status.msg}
                    </div>
                  )}

                  <form onSubmit={(e) => handleSubmit(e, g.name)} onChange={(e) => {
                    const target = e.target as any;
                    if (target.name === 'instrument') {
                      setShowOther(target.value.includes("Otro"));
                    }
                  }}>
                    {/* Honeypot field for anti-spam */}
                    <div style={{ opacity: 0, position: 'absolute', top: 0, left: 0, height: 0, width: 0, overflow: 'hidden' }} aria-hidden="true">
                      <input type="text" name="fax_number" tabIndex={-1} autoComplete="off" />
                    </div>
                    
                    <div className="form-grid-2">
                      <div>
                        <label htmlFor="fi-fname" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--sp-2)', color: 'var(--clr-navy-mid)' }}>Nombre *</label>
                        <input id="fi-fname" name="first_name" type="text" placeholder="Ej: Juan" required className="form-control" autoComplete="given-name" />
                      </div>
                      <div>
                        <label htmlFor="fi-lname" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--sp-2)', color: 'var(--clr-navy-mid)' }}>Apellidos *</label>
                        <input id="fi-lname" name="last_name" type="text" placeholder="Apellido(s)" required className="form-control" autoComplete="family-name" />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div>
                        <label htmlFor="fi-email" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--sp-2)', color: 'var(--clr-navy-mid)' }}>Email *</label>
                        <input id="fi-email" name="email" type="email" placeholder="tu@email.com" required className="form-control" />
                      </div>
                      <div>
                        <label htmlFor="fi-tel" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--sp-2)', color: 'var(--clr-navy-mid)' }}>Teléfono *</label>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <select name="phone_prefix" className="form-control" style={{ width: '90px', paddingInline: '0.4rem', borderRadius: '8px 0 0 8px', borderRight: 'none', background: '#f8f9fa', fontSize: '13px' }}>
                            <option value="+34">🇪🇸 +34</option>
                            <option value="+44">🇬🇧 +44</option>
                            <option value="+49">🇩🇪 +49</option>
                            <option value="+33">🇫🇷 +33</option>
                            <option value="+39">🇮🇹 +39</option>
                            <option value="+351">🇵🇹 +351</option>
                            <option value="+1">🇺🇸 +1</option>
                          </select>
                          <input id="fi-tel" name="phone" type="tel" placeholder="600 000 000" required className="form-control" style={{ borderRadius: '0 8px 8px 0', flex: 1 }} />
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 'var(--sp-4)' }}>
                      <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--sp-2)', color: 'var(--clr-navy-mid)' }}>Instrumento / Voz *</label>
                      {g.formExtra}
                      
                      {showOther && (
                        <div style={{ marginTop: 'var(--sp-3)', animation: 'fadeIn 0.3s ease' }}>
                          <input 
                            name="instrument_other" 
                            type="text" 
                            placeholder="Especifique su instrumento..." 
                            required 
                            className="form-control" 
                            style={{ borderColor: 'var(--clr-gold)', borderStyle: 'dashed' }}
                            autoFocus
                          />
                        </div>
                      )}
                    </div>

                    <label htmlFor="fi-exp" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--sp-2)', color: 'var(--clr-navy-mid)' }}>Experiencia musical (Opcional)</label>
                    <textarea id="fi-exp" name="experience" placeholder="Cuéntanos un poco sobre tu trayectoria musical..." rows={3} className="form-control" />

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--sp-2)' }} disabled={loading}>
                      {loading ? "Enviando solicitud..." : "Enviar Solicitud"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
}
