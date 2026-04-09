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
    title: "🎷 Diccionario de Etiquetas",
    desc: "Define los instrumentos y etiquetas para clasificar partituras.",
    steps: [
      "Añade instrumentos asignándoles una 'Familia' (Cuerda, Viento Madera, etc.).",
      "Estas etiquetas son las que ven los músicos para filtrar sus partituras.",
      "Importante: La etiqueta (ej: 'Fagot') es distinta de la sección (ej: 'Fagot I')."
    ]
  },
  sections: {
    title: "🏛️ Estructura Artística",
    desc: "Configura las secciones disponibles para los perfiles de los músicos.",
    steps: [
      "Define las posiciones específicas (ej: 'Violín I', 'Soprano II').",
      "Estas secciones se usan en el alta de personal, invitaciones y CSV.",
      "No afectan directamente a qué partituras ven los músicos, para eso usa las Etiquetas."
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
    desc: "Control absoluto de quién entra y quién colabora.",
    steps: [
      "Selección de Modo: Al crear un usuario manualmente, elige entre 'Estándar' (con acceso y email) o 'Externo' (solo registro en base de datos, sin contraseña/email obligatorio).",
      "Perfiles Artísticos: Puedes asignar múltiples combinaciones de Agrupación, Sección y Papel (Músico, Director, etc.) a un solo usuario.",
      "Identificación Especial: Los usuarios externos aparecen con un badge naranja 'EXTERNO' para diferenciarlos fácilmente de los registrados vía Clerk.",
      "Registro de Matrícula de Coche: Campo disponible para control de acceso o parking (ej: 1234 ABC).",
      "Roles en el Sistema: Activa 'Master' (total) o 'Archivero' (gestión de partituras). Estos roles se bloquean automáticamente para usuarios externos.",
      "Importación Masiva CSV: Soporta las nuevas columnas 'es_externo', 'agrupacion', 'seccion' y 'papel' para crear plantillas completas con perfiles artísticos en segundos.",
      "Bloqueo y Filtros: Usa el botón de baneo para pausar accesos y utiliza los filtros superiores para ver solo administradores, músicos o externos."
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
  },
  requests: {
    title: "📩 Bandeja de Solicitudes",
    desc: "Gestión de músicos interesados en unirse a la OCGC.",
    steps: [
      "Recibe todas las peticiones enviadas desde la sección pública '/unete'.",
      "Evaluando: Usa este estado para peticiones que necesiten una revisión técnica adicional, como consultar con un jefe de sección o planificar una audición.",
      "Aceptar: Marca la solicitud como aceptada y te lleva automáticamente a generar su invitación nominativa (precarga nombre e email).",
      "Rechazar: Descarte de perfiles que no se ajustan a las necesidades actuales.",
      "Filtros: Usa el selector superior para organizar tu flujo de trabajo (Pendientes, En Evaluación, etc.)."
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
