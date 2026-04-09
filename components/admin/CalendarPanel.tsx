"use client";

import { useEffect, useState, useRef } from 'react';

interface Category { id: number; name: string; }
interface Event { id: number; title: string; date: string; location?: string; description?: string; type: string; category?: Category | null; }

export default function CalendarPanel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEvents();
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const fetchEvents = () => {
    fetch('/api/admin/events')
      .then(r => r.json())
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  const createEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      });
      if (res.ok) { fetchEvents(); (e.target as HTMLFormElement).reset(); }
    } catch(err) { console.error(err); }
    finally { setLoading(false); }
  };

  const deleteEvent = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar este evento?")) return;
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
      if (res.ok) fetchEvents();
    } catch (err) { console.error(err); }
  };

  const updateEvent = async () => {
    if (!editingEvent?.title) return; setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${editingEvent.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingEvent)
      });
      if (res.ok) { fetchEvents(); setEditingEvent(null); }
    } catch(err) { console.error(err); }
    finally { setLoading(false); }
  };

  // ── Importación CSV ───────────────────────────────────────────────────────────
  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    return lines.slice(1).map(line => {
      const vals = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = (vals[i] || '').replace(/^"|"$/g, '').trim(); });
      return obj;
    });
  };

  // ── Importación iCal (.ics) ───────────────────────────────────────────────────
  const parseICS = (text: string): any[] => {
    const events: any[] = [];
    const blocks = text.split('BEGIN:VEVENT');
    blocks.slice(1).forEach(block => {
      const get = (key: string) => {
        const m = block.match(new RegExp(`${key}[^:]*:(.+)`));
        return m ? m[1].trim().replace(/\\n/g, '\n').replace(/\\,/g, ',') : undefined;
      };
      const dtStart = get('DTSTART');
      if (!dtStart) return;
      const parseDate = (dt: string) => {
        // Formato: 20241201T180000Z o 20241201
        const s = dt.replace(/[TZ]/g, '').replace(/(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/, '$1-$2-$3T$4:$5:$6');
        return new Date(s.replace(/T:/, 'T00:').replace(/::/, ':00:').replace(/:$/, ':00'));
      };
      events.push({
        title: get('SUMMARY') || 'Sin título',
        date: parseDate(dtStart).toISOString(),
        location: get('LOCATION') || undefined,
        description: get('DESCRIPTION') || undefined,
        type: 'Ensayo',
      });
    });
    return events;
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImportStatus('Procesando...');
    const text = await file.text();
    let rows: any[] = [];
    if (file.name.endsWith('.ics')) {
      rows = parseICS(text);
    } else {
      rows = parseCSV(text).map(r => {
        const catName = r.programa || r.programa || r.categoría || r.category || "";
        const matchedCat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
        
        return {
          title: r.title || r.título || r.nombre || 'Sin título',
          date: r.fecha || r.date || r.inicio,
          location: r.lugar || r.location || r.ubicación || undefined,
          description: r.descripción || r.description || undefined,
          type: r.tipo || r.type || 'Ensayo',
          categoryId: matchedCat ? matchedCat.id : undefined,
        };
      }).filter(r => r.date);
    }
    if (rows.length === 0) { setImportStatus('⚠️ No se encontraron eventos válidos en el archivo.'); return; }
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rows)
      });
      if (res.ok) {
        const data = await res.json();
        setImportStatus(`✅ ${data.imported} eventos importados correctamente.`);
        fetchEvents();
      } else { setImportStatus('❌ Error al importar. Revisa el formato del archivo.'); }
    } catch { setImportStatus('❌ Error de conexión.'); }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="calendar-panel" style={{ padding: '2rem', background: '#fff', borderRadius: '12px' }}>
      <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 'bold' }}>📅 Calendario de Eventos</h2>
      
      <div className="admin-content-grid-local">
        {/* ── Formulario creación ── */}
        <div className="panel-section-card creation-section">
          <form onSubmit={createEvent} className="premium-event-form">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: '#2c3e50', borderBottom: '2px solid #f0f0f0', paddingBottom: '0.8rem' }}>
              🗓️ Programar Nuevo Evento
            </h3>
            <div className="form-grid-layout">
              <div className="form-row main-row">
                <div className="input-group flex-2">
                  <label>Título del Evento</label>
                  <input name="title" type="text" placeholder="Ej: Ensayo General — Dvořák 9" required />
                </div>
                <div className="input-group flex-1">
                  <label>Tipo</label>
                  <select name="type" required>
                    <option value="Ensayo">Ensayo</option>
                    <option value="Concierto">Concierto</option>
                    <option value="Reunión">Reunión</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="input-group flex-1">
                  <label>Fecha y Hora</label>
                  <input name="date" type="datetime-local" required />
                </div>
                <div className="input-group flex-1">
                  <label>Programa / Concierto</label>
                  <select name="categoryId">
                    <option value="">— Sin programa —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label>Ubicación</label>
                <input name="location" type="text" placeholder="Ej: Teatro Pérez Galdós" />
              </div>
              <div className="input-group full-width">
                <label>Descripción / Observaciones</label>
                <textarea name="description" rows={3} placeholder="Instrucciones para los músicos..." />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-main-premium">
              {loading ? "Procesando..." : "✅ Confirmar y Publicar Evento"}
            </button>
          </form>

          {/* ── Importación ── */}
          <div style={{ marginTop: '2rem', padding: '1.5rem', border: '2px dashed #dfe4ea', borderRadius: '12px', background: '#fafbfc' }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#2c3e50', fontSize: '0.95rem' }}>📥 Importar Calendario</h4>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#888' }}>
              Acepta archivos <strong>.ics</strong> (iCal / Google Calendar) o <strong>.csv</strong> con columnas: <code>title, date, type, location, description, programa</code>
            </p>
            <input
              ref={fileRef}
              type="file" accept=".ics,.csv"
              onChange={handleFileImport}
              style={{ fontSize: '0.85rem', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', width: '100%', cursor: 'pointer', boxSizing: 'border-box' }}
              aria-label="Importar archivo de calendario"
            />
            {importStatus && (
              <p style={{ margin: '0.7rem 0 0', fontSize: '0.85rem', fontWeight: 600, color: importStatus.startsWith('✅') ? '#27ae60' : importStatus.startsWith('❌') ? '#e74c3c' : '#888' }}>
                {importStatus}
              </p>
            )}
          </div>
        </div>

        {/* ── Lista de eventos ── */}
        <div className="panel-section-card list-section">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: '#2c3e50' }}>Próximas Citas ({events.length})</h3>
          <div className="events-scroll-container">
            {events.length === 0 ? (
              <div className="empty-state"><p>No hay eventos programados.</p></div>
            ) : events.map(ev => (
              <div key={ev.id} className="event-card-premium" style={{ borderLeft: `6px solid ${ev.type === 'Concierto' ? '#ff4757' : (ev.type === 'Ensayo' ? '#2e86de' : '#27ae60')}` }}>
                <div className="event-info">
                  <div className="event-top-line">
                    <span className={`badge-type ${ev.type.toLowerCase()}`}>{ev.type}</span>
                    <h4 className="event-title-text">{ev.title}</h4>
                  </div>
                  <div className="event-details-line">
                    <span className="ev-detail">🕒 {new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="ev-detail">📅 {new Date(ev.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {ev.location && <span className="ev-detail">📍 {ev.location}</span>}
                    {ev.category && <span className="ev-detail" style={{ color: '#478AC9' }}>📂 {ev.category.name}</span>}
                  </div>
                </div>
                <div className="event-actions-stack">
                  <button onClick={() => setEditingEvent(ev)} className="action-btn-p edit">✎</button>
                  <button onClick={() => deleteEvent(ev.id)} className="action-btn-p delete">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modal edición ── */}
      {editingEvent && (
        <div className="local-modal-overlay">
          <div className="local-modal-card">
            <div className="modal-header-premium">
              <div><h3 style={{ margin: 0 }}>Editar Evento</h3><p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#666' }}>ID: #{editingEvent.id}</p></div>
              <button onClick={() => setEditingEvent(null)} className="btn-close-modal-p">✕</button>
            </div>
            <div className="modal-body-p">
              <div className="form-grid-layout">
                <div className="input-group">
                  <label>Título</label>
                  <input type="text" value={editingEvent.title} onChange={e => setEditingEvent({...editingEvent, title: e.target.value})} />
                </div>
                <div className="form-row">
                  <div className="input-group flex-1">
                    <label>Fecha y Hora</label>
                    <input type="datetime-local"
                      value={editingEvent.date ? new Date(new Date(editingEvent.date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} />
                  </div>
                  <div className="input-group flex-1">
                    <label>Tipo</label>
                    <select value={editingEvent.type} onChange={e => setEditingEvent({...editingEvent, type: e.target.value})}>
                      <option value="Ensayo">Ensayo</option><option value="Concierto">Concierto</option><option value="Reunión">Reunión</option>
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label>Programa</label>
                  <select
                    value={editingEvent.category?.id ?? ''}
                    onChange={e => setEditingEvent({...editingEvent, categoryId: e.target.value || null} as any)}
                  >
                    <option value="">— Sin programa —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Ubicación</label>
                  <input type="text" value={editingEvent.location || ''} onChange={e => setEditingEvent({...editingEvent, location: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Descripción</label>
                  <textarea rows={3} value={editingEvent.description || ''} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="modal-footer-p">
              <button onClick={() => setEditingEvent(null)} className="btn-cancel-p">Cancelar</button>
              <button onClick={updateEvent} className="btn-save-p" disabled={loading}>{loading ? "Guardando..." : "Guardar Cambios"}</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-content-grid-local { display: flex; flex-direction: column; gap: 2rem; margin-top: 1rem; }
        .panel-section-card { background: #fff; padding: 2rem; border: 1px solid #eef2f5; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
        .form-grid-layout { display: flex; flex-direction: column; gap: 1rem; }
        .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        .flex-1 { flex: 1; min-width: 150px; }
        .flex-2 { flex: 2; min-width: 200px; }
        .input-group { display: flex; flex-direction: column; gap: 0.5rem; width: 100%; }
        .input-group label { font-size: 0.75rem; font-weight: 800; color: #478AC9; text-transform: uppercase; letter-spacing: 0.5px; }
        .input-group input, .input-group select, .input-group textarea { padding: 0.9rem; border: 1px solid #dfe4ea; border-radius: 10px; font-size: 0.95rem; background: #fbfcfe; transition: 0.2s; width: 100%; box-sizing: border-box; }
        .input-group input:focus, .input-group select:focus { border-color: #478AC9; outline: none; background: #fff; box-shadow: 0 0 0 3px rgba(71,138,201,0.1); }
        .btn-main-premium { margin-top: 1rem; padding: 1.2rem; background: #478AC9; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; width: 100%; transition: 0.3s; font-size: 1rem; }
        .btn-main-premium:hover { background: #357abd; transform: translateY(-2px); box-shadow: 0 8px 25px rgba(71,138,201,0.3); }
        .events-scroll-container { display: flex; flex-direction: column; gap: 1rem; max-height: 600px; overflow-y: auto; padding-right: 0.5rem; }
        .event-card-premium { background: #fbfcfe; padding: 1.2rem; border-radius: 12px; border: 1px solid #eef2f5; display: flex; justify-content: space-between; align-items: center; transition: 0.3s; flex-wrap: wrap; gap: 1rem; }
        .event-card-premium:hover { transform: translateX(5px); background: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .event-top-line { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
        .event-title-text { margin: 0; font-size: 1.1rem; color: #2c3e50; }
        .badge-type { padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.65rem; font-weight: bold; text-transform: uppercase; white-space: nowrap; }
        .badge-type.ensayo { background: #e3f2fd; color: #2e86de; }
        .badge-type.concierto { background: #fff5f5; color: #ff4757; }
        .badge-type.reunión { background: #e8f5e9; color: #27ae60; }
        .event-details-line { display: flex; gap: 1rem; flex-wrap: wrap; }
        .ev-detail { font-size: 0.85rem; color: #666; font-weight: 500; display: flex; align-items: center; gap: 0.2rem; }
        .event-actions-stack { display: flex; gap: 0.5rem; flex-shrink: 0; }
        .action-btn-p { width: 36px; height: 36px; border-radius: 8px; border: none; cursor: pointer; transition: 0.2s; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; }
        .action-btn-p.edit { background: #eef6fd; color: #478AC9; }
        .action-btn-p.delete { background: #fff1f1; color: #ff4757; }
        .action-btn-p:hover { transform: scale(1.1); }
        .empty-state { text-align: center; padding: 3rem; color: #999; font-style: italic; }
        .local-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 999999; padding: 1rem; }
        .local-modal-card { background: #fff; width: 100%; max-width: 550px; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.3); animation: popScale 0.3s ease; display: flex; flex-direction: column; max-height: 90vh; }
        @keyframes popScale { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .modal-header-premium { padding: 1.5rem 2rem; background: #f9fafb; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .btn-close-modal-p { background: #eee; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; }
        .modal-body-p { padding: 2rem; overflow-y: auto; }
        .modal-footer-p { padding: 1.5rem 2rem; background: #f9fafb; display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid #eee; flex-wrap: wrap; }
        .btn-cancel-p { padding: 0.8rem 1.5rem; border-radius: 10px; border: 1px solid #ddd; background: #fff; cursor: pointer; font-weight: bold; }
        .btn-save-p { padding: 0.8rem 1.5rem; border-radius: 10px; border: none; background: #478AC9; color: white; cursor: pointer; font-weight: bold; }
      `}</style>
    </div>
  );
}
