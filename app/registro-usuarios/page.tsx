"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import '@/css/onboarding.css';

const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconLock = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--clr-primary)" strokeWidth="1.5" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export default function PaginaRegistroSecreta() {
  const [step, setStep] = useState(0);
  const [inviteToken, setInviteToken] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formData, setFormData] = useState({
    firstName: '', surname: '', dni: '', dob: '',
    phone: '', email: '', isla: '', municipio: '', empadronamiento: '',
    hasCertificate: false,
    agrupacion: '', instrument: '',
    agrupacion2: '', instrument2: '',
    agrupacion3: '', instrument3: '',
    trabajo: '', estudios: '',
    username: '', password: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const [dbAgrupaciones, setDbAgrupaciones] = useState<string[]>([]);
  const [dbSecciones, setDbSecciones] = useState<string[]>([]);

  useEffect(() => {
    // Cargar Catálogos (Agrupaciones y Roles/Secciones)
    fetch('/api/agrupaciones?public=true')
      .then(r => r.json())
      .then(data => setDbAgrupaciones(Array.isArray(data) ? data.map((d: any) => d.agrupacion) : []))
      .catch(console.error);

    fetch('/api/roles')
      .then(r => r.json())
      .then(data => {
        const flatSecciones = Object.values(data).flat()
          .filter((s: any) => s.isVisible !== false)
          .map((s: any) => s.name);
        setDbSecciones(flatSecciones);
      })
      .catch(console.error);
  }, []);

  // Capturar código de la URL y VALIDAR AUTOMÁTICAMENTE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setInviteToken(code);
      // Ejecutamos la validación inmediatamente
      const autoValidate = async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/auth/validate-invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code })
          });
          const data = await res.json();
          if (res.ok) {
            setStep(1);
            setFormData(prev => ({
              ...prev,
              firstName: data.name ?? prev.firstName,
              surname: data.surname ?? prev.surname,
              email: data.email ?? prev.email,
              phone: data.phone ?? prev.phone,
              dob: data.birthDate ?? prev.dob,
              isla: data.isla ?? prev.isla,
              hasCertificate: !!data.hasCertificate,
              agrupacion: data.agrupacion ?? '',
              instrument: data.seccion ?? '',
              agrupacion2: data.agrupacion2 ?? '',
              instrument2: data.seccion2 ?? '',
              agrupacion3: data.agrupacion3 ?? '',
              instrument3: data.seccion3 ?? '',
            }));
            if (data.email) setConfirmEmail(data.email);
          } else {
            setStatus({ success: false, msg: data.error || "Código de invitación no válido." });
          }
        } catch (e) {
          setStatus({ success: false, msg: "Error de conexión al validar código." });
        } finally {
          setLoading(false);
        }
      };
      autoValidate();
    }
  }, []);

  const validateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/validate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteToken })
      });
      const data = await res.json();
      if (res.ok) {
        setStep(1);
        setFormData(prev => ({
          ...prev,
          firstName: data.name ?? prev.firstName,
          surname: data.surname ?? prev.surname,
          email: data.email ?? prev.email,
          phone: data.phone ?? prev.phone,
          dob: data.birthDate ?? prev.dob,
          isla: data.isla ?? prev.isla,
          hasCertificate: !!data.hasCertificate,
          agrupacion: data.agrupacion ?? '',
          instrument: data.seccion ?? '',
          agrupacion2: data.agrupacion2 ?? '',
          instrument2: data.seccion2 ?? '',
          agrupacion3: data.agrupacion3 ?? '',
          instrument3: data.seccion3 ?? '',
        }));
        if (data.email) setConfirmEmail(data.email);
      }
      else setStatus({ success: false, msg: data.error || "Código de invitación no válido o expirado." });
    } catch (error) {
      setStatus({ success: false, msg: "Error al validar el código." });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 5) {
      nextStep();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/auth/register-musician", {
        method: "POST",
        body: JSON.stringify({ ...formData, inviteCode: inviteToken }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      
      if (res.ok) {
        setStatus({ success: true, msg: "¡Bienvenido a la familia de la OCGC! Ya puedes acceder al área privada." });
        setStep(6);
      } else {
        setStatus({ success: false, msg: data.error || "Error en el registro." });
      }
    } catch (err) {
      setStatus({ success: false, msg: "Error inesperado del servidor." });
    } finally {
      setLoading(false);
    }
  };

  const isPasswordValid = 
    formData.password.length >= 8 && 
    /[A-Za-z]/.test(formData.password) && 
    /[0-9]/.test(formData.password);

  const isEmailValid = formData.email !== '' && formData.email === confirmEmail;
  const isFormStep5Valid = isEmailValid && isPasswordValid && formData.password === confirmPassword && formData.username !== '';

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <center>
          <img src="/assets/images/logo_ocgc.png" width="80" alt="OCGC Logo" style={{ marginBottom: 'var(--sp-4)' }} />
        </center>
        
        <h1>Formulario de Alta</h1>
        
        {step > 0 && step < 6 && <p className="step-indicator">Paso {step} de 5</p>}
        {step === 0 && <p className="step-indicator">Validación de seguridad</p>}

        {status && step < 6 && (
          <div className={`alert ${status.success ? 'alert-success' : 'alert-error'}`} role="alert">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)' }}>
              {status.success ? <IconCheck /> : <IconAlert />}
              {status.msg}
            </div>
          </div>
        )}

        {step === 6 ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp-6) 0' }}>
            <div style={{ 
              width: 64, height: 64, background: 'var(--clr-success)', color: '#fff', 
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              margin: '0 auto var(--sp-6)' 
            }}>
              <IconCheck />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-navy)', marginBottom: 'var(--sp-3)' }}>
              ¡Músico Registrado!
            </h2>
            <p className="help-text" style={{ marginBottom: 'var(--sp-8)' }}>{status?.msg}</p>
            <Link href="/sign-in" className="btn btn-primary" style={{ display: 'inline-flex', padding: 'var(--sp-4) var(--sp-8)' }}>
              Iniciar Sesión
            </Link>
          </div>
        ) : (
          <div className="onboarding-form">
            {step === 0 && (
              <form onSubmit={validateInvitation} style={{ textAlign: 'center' }}>
                <div style={{ margin: 'var(--sp-8) 0', display: 'flex', justifyContent: 'center' }}>
                  <IconLock />
                </div>
                <h3>Acceso Restringido</h3>
                <p className="help-text" style={{ marginBottom: 'var(--sp-8)' }}>
                  Por favor, introduce el código de invitación nominativo facilitado por los coordinadores.
                </p>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <input 
                    type="text" 
                    value={inviteToken} 
                    onChange={(e) => setInviteToken(e.target.value)} 
                    placeholder="Escribir código..." 
                    required 
                    style={{ textAlign: 'center', letterSpacing: '2px', fontSize: '1.1rem', fontWeight: 'bold' }}
                    autoComplete="off"
                  />
                </div>
                <button type="submit" className="btn-onboarding-primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? "Validando..." : "Verificar Código"}
                </button>
              </form>
            )}

            {step > 0 && (
              <form onSubmit={handleSubmit}>
                {step === 1 && (
                  <div className="step-content">
                    <h3>Información Personal</h3>
                    <div className="form-group">
                      <label htmlFor="firstName">Nombre</label>
                      <input id="firstName" type="text" name="firstName" value={formData.firstName} onChange={handleChange} required autoComplete="given-name" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="surname">Apellidos</label>
                      <input id="surname" type="text" name="surname" value={formData.surname} onChange={handleChange} required autoComplete="family-name" />
                    </div>
                    <div className="form-group-row">
                      <div className="form-group">
                        <label htmlFor="dni">DNI / NIE</label>
                        <input id="dni" type="text" name="dni" value={formData.dni} onChange={handleChange} required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="dob">Fecha de Nacimiento</label>
                        <input id="dob" type="date" name="dob" value={formData.dob} onChange={handleChange} required />
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="step-content">
                    <h3>Contacto y Residencia</h3>
                    <div className="form-group">
                      <label htmlFor="phone">Teléfono Móvil</label>
                      <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} required autoComplete="tel" />
                    </div>
                    <div className="form-group-row">
                      <div className="form-group">
                        <label htmlFor="isla">Isla de Residencia</label>
                        <select id="isla" name="isla" value={formData.isla} onChange={handleChange} required>
                          <option value="">-- Isla --</option>
                          {["Gran Canaria", "Tenerife", "Lanzarote", "Fuerteventura", "La Palma", "La Gomera", "El Hierro", "La Graciosa", "Fuera de Islas"].map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="municipio">Municipio</label>
                        <input id="municipio" type="text" name="municipio" value={formData.municipio} onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="hasCertificate" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', margin: '0.5rem 0' }}>
                        <input 
                          id="hasCertificate" 
                          type="checkbox" 
                          name="hasCertificate" 
                          checked={formData.hasCertificate} 
                          onChange={(e) => setFormData(prev => ({ ...prev, hasCertificate: e.target.checked }))} 
                        />
                        <span>¿Posees el Certificado de Residencia Canaria para viajes?</span>
                      </label>
                    </div>
                    <div className="form-group">
                      <label htmlFor="empadronamiento">Lugar de Empadronamiento</label>
                      <input id="empadronamiento" type="text" name="empadronamiento" value={formData.empadronamiento} onChange={handleChange} required />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="step-content">
                    <h3>Perfil Artístico</h3>
                    <p className="help-text" style={{ marginBottom: '1.5rem' }}>Específica en qué agrupaciones participas y tu instrumento.</p>
                    
                    <div className="artistic-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="form-group-row">
                        <div className="form-group">
                          <label>Agrupación Principal</label>
                          <select name="agrupacion" value={formData.agrupacion} onChange={handleChange} required>
                            <option value="">-- Agrupación 1 --</option>
                            {dbAgrupaciones.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Instrumento / Voz</label>
                          <select name="instrument" value={formData.instrument} onChange={handleChange} required>
                            <option value="">-- Elige --</option>
                            {dbSecciones.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #eee', padding: '1rem' }}></div>

                      <div className="form-group-row">
                        <div className="form-group">
                          <label>Segunda Agrupación</label>
                          <select name="agrupacion2" value={formData.agrupacion2} onChange={handleChange}>
                            <option value="">-- Agrupación 2 --</option>
                            {dbAgrupaciones.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Segundo Instrumento</label>
                          <select name="instrument2" value={formData.instrument2} onChange={handleChange}>
                            <option value="">-- Elige --</option>
                            {dbSecciones.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #eee', padding: '1rem' }}></div>

                      <div className="form-group-row">
                        <div className="form-group">
                          <label>Tercera Agrupación</label>
                          <select name="agrupacion3" value={formData.agrupacion3} onChange={handleChange}>
                            <option value="">-- Agrupación 3 --</option>
                            {dbAgrupaciones.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Tercer Instrumento</label>
                          <select name="instrument3" value={formData.instrument3} onChange={handleChange}>
                            <option value="">-- Elige --</option>
                            {dbSecciones.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="step-content">
                    <h3>Estudios y Ocupación</h3>
                    <div className="form-group">
                      <label htmlFor="trabajo">Ocupación Actual</label>
                      <input id="trabajo" type="text" name="trabajo" placeholder="Ej: Estudiante, Administrativo..." value={formData.trabajo} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="estudios">Estudios Realizados</label>
                      <textarea id="estudios" name="estudios" rows={4} value={formData.estudios} onChange={handleChange} placeholder="Ej: Grado en..., Bachillerato..." required />
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="step-content">
                    <h3>Credenciales de Acceso</h3>
                    <p className="help-text" style={{ marginBottom: 'var(--sp-6)' }}>Utiliza un correo activo; lo necesitarás para confirmar tu cuenta digital.</p>
                    
                    <div className="form-group-row">
                      <div className="form-group">
                        <label htmlFor="email">Correo Electrónico</label>
                        <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required autoComplete="email" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="confirmEmail">Confirmar Correo</label>
                        <input 
                          id="confirmEmail" 
                          type="email" 
                          value={confirmEmail} 
                          onChange={(e) => setConfirmEmail(e.target.value)} 
                          required 
                          autoComplete="off"
                          onPaste={(e) => e.preventDefault()}
                        />
                      </div>
                    </div>
                    {formData.email && confirmEmail && formData.email !== confirmEmail && (
                      <p style={{ color: 'var(--clr-danger)', fontSize: 'var(--text-xs)', marginTop: '-var(--sp-4)', marginBottom: 'var(--sp-4)' }}>Los correos no coinciden.</p>
                    )}

                    <div className="form-group">
                      <label htmlFor="username">Nombre de Usuario (Nickname)</label>
                      <input id="username" type="text" name="username" value={formData.username} onChange={handleChange} required autoComplete="username" />
                    </div>
                    
                    <div className="form-group-row">
                      <div className="form-group">
                        <label htmlFor="password">Nueva Contraseña</label>
                        <input id="password" type="password" name="password" value={formData.password} onChange={handleChange} required autoComplete="new-password" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                        <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
                      </div>
                    </div>

                    <div className="password-requirements" style={{ padding: 'var(--sp-4)', background: 'var(--clr-light)', borderRadius: 'var(--radius-md)' }}>
                      <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--clr-navy)', marginBottom: 'var(--sp-2)' }}>Criterios de seguridad (Clerk):</p>
                      <div className="password-requirement-item" style={{ color: formData.password.length >= 8 ? 'var(--clr-success)' : 'var(--clr-danger)' }}>
                        <IconCheck /> Mínimo 8 caracteres
                      </div>
                      <div className="password-requirement-item" style={{ color: (/[A-Za-z]/.test(formData.password) && /[0-9]/.test(formData.password)) ? 'var(--clr-success)' : 'var(--clr-danger)' }}>
                        <IconCheck /> Al menos una letra y un número
                      </div>
                      <div className="password-requirement-item" style={{ color: (formData.password !== '' && formData.password === confirmPassword) ? 'var(--clr-success)' : 'var(--clr-danger)' }}>
                        <IconCheck /> Las contraseñas coinciden
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  {step > 1 && (
                    <button type="button" onClick={prevStep} className="btn-onboarding-secondary" disabled={loading}>
                      Atrás
                    </button>
                  )}
                  <button 
                    type="submit" 
                    className="btn-onboarding-primary" 
                    disabled={loading || (step === 5 && !isFormStep5Valid)}
                  >
                    {step === 5 ? (loading ? "Creando ficha..." : "Finalizar Alta") : "Siguiente"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
