"use client";

import { useState } from 'react';

const HELPS = {
  dashboard: {
    title: "📊 Dashboard Estadístico",
    desc: "Métricas en tiempo real de la orquesta y el archivo.",
    steps: [
      "Visualiza el total de músicos registrados y obras disponibles.",
      "Observa la distribución por familias (Cuerda, Viento, etc.) en el gráfico circular.",
      "Control de Participación: Monitoriza cuántos músicos están 'Activos' frente a colaboradores de refuerzo.",
      "Archivística: Consulta los programas con más material cargado para prever la carga de trabajo."
    ]
  },
  scores: {
    title: "🎼 Gestión de Partituras",
    desc: "Central para subir y organizar todo el material musical.",
    steps: [
      "Agrupación y Etiqueta: Para que un músico vea una partitura, el archivo debe coincidir con su Agrupación (ej: Orquesta) Y su Etiqueta (ej: Oboe).",
      "Documentos Generales: Usa 'Marcar como Documento' para reglamentos o partituras que TODOS los músicos deban ver, independientemente de su instrumento.",
      "Fuente de Datos: El sistema cruza automáticamente los metadatos del PDF con la tabla Estructura de la base de datos para garantizar la seguridad.",
      "Importación Masiva: Carga un CSV con los metadatos y luego selecciona los PDFs. El sistema los emparejará por el nombre del archivo."
    ]
  },
  categories: {
    title: "📅 Programas y Conciertos",
    desc: "Agrupadores lógicos de partituras y eventos.",
    steps: [
      "Crea un programa para agrupar partituras y sincronizarlas con el Calendario.",
      "Cronología: Las fechas asignadas aquí determinan el orden en que los músicos ven los programas en su área privada.",
      "Edición Segura: Al editar un programa, las partituras asociadas se actualizan en cascada para mantener la integridad."
    ]
  },
  roles: {
    title: "🎷 Diccionario de Etiquetas",
    desc: "Define los instrumentos y etiquetas para filtrar partituras.",
    steps: [
      "Etiqueta vs Sección: Un músico puede estar en la sección 'Violín II' pero ver partituras bajo la etiqueta 'Violín'.",
      "Clasificación: Asigna familias (Cuerda, Viento...) para organizar los filtros del Dashboard y las carpetas de archivo.",
      "Sincronización: Cualquier cambio aquí se propaga a los metadatos de Clerk de los músicos afectados al instante."
    ]
  },
  sections: {
    title: "🏛️ Fuente de Verdad (Estructura)",
    desc: "Configura la base jerárquica de la plataforma.",
    steps: [
      "Secciones, Agrupaciones y Papeles: Estas tablas definen qué combinaciones son válidas para los músicos.",
      "Control de Acceso: El sistema usa estas entradas para generar automáticamente las etiquetas de acceso en tiempo real.",
      "Visibilidad Pública: Puedes marcar qué secciones o papeles aparecen en la web pública (ej: Ocultar perfiles de gestión interna)."
    ]
  },
  calendar: {
    title: "🗓️ Calendario de Actividades",
    desc: "Controlador de los próximos hitos de la OCGC.",
    steps: [
      "Importación Dual: Sube calendarios desde archivos .CSV o exportaciones .ICS (Google Calendar, Outlook).",
      "Mapeo de Programas: Al importar, el sistema busca coincidencias en los nombres para vincular los ensayos a sus programas de partituras.",
      "Notificación Visual: Los eventos se diferencian por colores: Ensayos (Azul), Conciertos (Rojo/Urgente) y Reuniones (Verde)."
    ]
  },
  personal: {
    title: "👥 Gestión de Permisos y Perfiles",
    desc: "Control total sincronizado con Clerk.",
    steps: [
      "Lógica de Acceso: Si un usuario no tiene perfiles artísticos activos en la base de datos, el sistema lo 'Banea' automáticamente en Clerk.",
      "Gestión de Perfiles: Puedes añadir múltiples combinaciones (ej: Orquesta / Violín I / Músico y Coro / Tenor / Jefe de Sección).",
      "Sincronización Automática: Al guardar un cambio en un perfil, el sistema reconstruye los metadatos de Clerk sin que tengas que intervenir.",
      "Edición Rápida: Usa los selectores integrados en la tabla del modal para cambiar agrupaciones o secciones sin cerrar la ventana.",
      "Acceso a Plataforma: Para músicos sin cuenta (externos), usa 'Activar Acceso' para crearles su cuenta de Clerk y vincular sus datos históricos."
    ]
  },
  logs: {
    title: "📝 Auditoría y Seguridad",
    desc: "Trazabilidad de cada cambio en el sistema.",
    steps: [
      "Sincronización de Clerk: Revisa los logs para confirmar que los cambios de permisos se han propagado correctamente a la nube.",
      "Historial de Archivo: Seguimiento de quién ha subido, editado o borrado material musical sensible.",
      "Reportes: Los logs se pueden filtrar por fecha para auditorías internas de gestión administrativa."
    ]
  },
  requests: {
    title: "📩 Selección de Talento",
    desc: "Gestión de músicos interesados en unirse a la OCGC.",
    steps: [
      "Alta Inteligente: Al 'Aceptar' una solicitud, el sistema precarga todos los datos del músico en el formulario de Invitación.",
      "Estados de Filtro: Clasifica a los aspirantes entre 'Pendientes', 'En Evaluación' o 'Aceptados' para un flujo de trabajo ordenado.",
      "Seguridad: Las solicitudes borradas se eliminan físicamente; asegúrate de haber procesado los datos antes de borrar."
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
