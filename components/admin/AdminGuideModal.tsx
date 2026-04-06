"use client";

import { useState } from 'react';

const HELPS = {
  dashboard: {
    title: "📊 Dashboard Estadístico",
    desc: "Métricas en tiempo real de la orquesta y el archivo.",
    steps: [
      "Visualiza el total de músicos registrados y obras disponibles.",
      "Observa la distribución por familias (Cuerda, Viento, etc.) en el gráfico circular.",
      "Consulta el desglose por secciones para saber cuántos músicos hay en cada instrumento.",
      "Usa estos datos para planificar necesidades de refuerzos o ver el alcance del archivo."
    ]
  },
  scores: {
    title: "🎼 Gestión de Partituras",
    desc: "Central para subir y organizar todo el material musical.",
    steps: [
      "Subida Individual: Indica título, selecciona programa, sube el PDF y marca los instrumentos que deben verlo.",
      "Documentos Generales: Marca 'Marcar como Documento' para archivos que deben ver TODOS (estatutos, normas).",
      "Renombrado Automático: El sistema renombrará tu archivo como 'Obra_Secciones.pdf' para mantener el orden.",
      "Importación Masiva: Usa el bloque azul inferior. Carga el CSV y luego selecciona todos los archivos PDF físicamente."
    ]
  },
  categories: {
    title: "📅 Programas y Conciertos",
    desc: "Agrupadores lógicos de partituras por eventos.",
    steps: [
      "Crea un programa (ej: 'Concierto Año Nuevo 2024') para agrupar todas sus partituras.",
      "Añade una fecha para que el sistema ordene los programas cronológicamente.",
      "Puedes editar o eliminar programas; las partituras asociadas no se borran."
    ]
  },
  roles: {
    title: "🎷 Diccionario de Instrumentos",
    desc: "Define qué instrumentos existen en la orquesta.",
    steps: [
      "Añade instrumentos asignándoles una 'Familia' (Cuerda, Viento Madera, etc.).",
      "Las familias son vitales para los filtros del Dashboard y el buscador del músico.",
      "Si borras un instrumento, los músicos dejarán de ver sus partituras específicas."
    ]
  },
  calendar: {
    title: "🗓️ Calendario de Actividades",
    desc: "Controlador de los próximos hitos de la OCGC.",
    steps: [
      "Añade Ensayos (Color Azul) o Conciertos (Color Rojo/Urgente).",
      "Indica fecha, hora, lugar y una breve descripción.",
      "Los músicos verán estos eventos en su tablón de anuncios principal."
    ]
  },
  personal: {
    title: "👥 Gestión de Personal e Invitaciones",
    desc: "Control absoluto de quién entra a la plataforma.",
    steps: [
      "Invitaciones Nominativas: Crea un código de un solo uso para un músico nuevo.",
      "Roles Administrativos: Activa 'Master' (total) o 'Archivero' (archivos).",
      "Baneo: El botón de bloqueo impide el acceso inmediato sin borrar sus datos.",
      "Importación de Usuarios: Usa el CSV para dar de alta a toda una plantilla a la vez."
    ]
  },
  logs: {
    title: "📝 Auditoría de logs",
    desc: "Trazabilidad de cada cambio en el sistema.",
    steps: [
      "Revisa quién subió qué archivo y cuándo.",
      "Los logs son inmutables y sirven para resolver conflictos de gestión.",
      "Exporta el historial a CSV para informes de actividad mensuales."
    ]
  }
};

export default function AdminGuideModal({ activeTab, onClose }: { activeTab: string, onClose: () => void }) {
  const help = HELPS[activeTab as keyof typeof HELPS];
  if (!help) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }} onClick={onClose}>
      <div 
        style={{ 
          background: 'white', 
          maxWidth: '500px', 
          width: '100%', 
          borderRadius: '20px', 
          padding: '2.5rem', 
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', 
          position: 'relative',
          fontFamily: "'Montserrat Alternates', sans-serif"
        }} 
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: '#f8f9fa', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1rem', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        
        <header style={{ marginBottom: '2rem', borderBottom: '2px solid #478AC920', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem' }}>{help.title.split(' ')[0]}</span>
            <h2 style={{ margin: 0, color: '#1a2a4b', fontSize: '1.3rem', fontWeight: 800 }}>{help.title.substring(help.title.indexOf(' ') + 1)}</h2>
          </div>
          <p style={{ color: '#478AC9', margin: 0, fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05rem' }}>GUÍA DE GESTIÓN OCGC</p>
        </header>

        <section style={{ paddingBottom: '1rem' }}>
          <ul style={{ padding: 0, listStyle: 'none', margin: 0, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {help.steps.map((step, idx) => (
              <li key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ minWidth: '24px', height: '24px', background: '#478AC9', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', marginTop: '2px' }}>{idx + 1}</span>
                <span style={{ color: '#444', lineHeight: '1.5', fontSize: '0.9rem' }}>{step}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
