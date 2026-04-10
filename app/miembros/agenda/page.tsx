"use client";

import { useEffect, useState, useMemo } from 'react';

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const TYPE_COLORS: Record<string, { bg: string; accent: string; dot: string }> = {
  Ensayo:   { bg: '#e3f2fd', accent: '#2e86de', dot: '#2e86de' },
  Concierto:{ bg: '#fff5f5', accent: '#ff4757', dot: '#ff4757' },
  Reunión:  { bg: '#f0f9f4', accent: '#27ae60', dot: '#27ae60' },
};

function MiniCalendar({ events, year, month, onMonthChange }: { events: any[], year: number, month: number, onMonthChange: (y: number, m: number) => void }) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  
  // Ajuste para que la semana empiece en Lunes
  // getDay(): 0=Dom, 1=Lun, ..., 6=Sáb.
  // Queremos: 0=Lun, 1=Mar, ..., 5=Sáb, 6=Dom.
  const firstDayRaw = new Date(year, month, 1).getDay();
  const firstDay = (firstDayRaw + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventsByDay = useMemo(() => {
    const map: Record<number, any[]> = {};
    events.forEach(ev => {
      const d = new Date(ev.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(ev);
      }
    });
    return map;
  }, [events, year, month]);

  const prev = () => { const d = new Date(year, month - 1); onMonthChange(d.getFullYear(), d.getMonth()); };
  const next = () => { const d = new Date(year, month + 1); onMonthChange(d.getFullYear(), d.getMonth()); };

  const today = new Date();

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #eef2f5', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', position: 'relative' }}>
      {/* Header mes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.5rem', background: '#1a2a4b', color: '#fff' }}>
        <button onClick={prev} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
        <strong style={{ fontSize: '1rem', letterSpacing: '0.03em' }}>{MONTHS_ES[month]} {year}</strong>
        <button onClick={next} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
      </div>

      {/* Grid días de la semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0.8rem 0.5rem 0.5rem' }}>
        {DAYS_ES.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', paddingBottom: '0.5rem' }}>{d}</div>
        ))}
        {/* Espacios vacíos al inicio */}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvents = eventsByDay[day] || [];
          const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
          const hasEvent = dayEvents.length > 0;
          const dots = dayEvents.slice(0, 3).map(ev => TYPE_COLORS[ev.type]?.dot || '#999');

          return (
            <div 
              key={day} 
              className="calendar-day-cell"
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              style={{ textAlign: 'center', padding: '0.3rem 0.1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', position: 'relative' }}
            >
              <span style={{
                width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: hasEvent ? 700 : 400,
                background: isToday ? '#1a2a4b' : hasEvent ? '#e8f4ff' : 'transparent',
                color: isToday ? '#fff' : hasEvent ? '#1a2a4b' : '#555',
                cursor: 'pointer',
                transition: '0.2s'
              }}>
                {day}
              </span>
              {dots.length > 0 && (
                <div style={{ display: 'flex', gap: '2px' }}>
                  {dots.map((color, di) => <div key={di} style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />)}
                </div>
              )}

              {/* Tooltip flotante */}
              {hoveredDay === day && hasEvent && (
                <div className="calendar-tooltip">
                  {dayEvents.map((ev, ei) => (
                    <div key={ei} className="tooltip-event-item">
                      <span className="tooltip-dot" style={{ background: TYPE_COLORS[ev.type]?.dot }} />
                      <div className="tooltip-info">
                        <strong>{ev.title}</strong>
                        <span>{new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {ev.location || 'Sede'}</span>
                      </div>
                    </div>
                  ))}
                  <div className="tooltip-arrow" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Leyenda */}
      <div style={{ display: 'flex', gap: '1rem', padding: '0.8rem 1.2rem', borderTop: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
        {Object.entries(TYPE_COLORS).map(([type, c]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#666' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot }} />
            {type}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AgendaPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.ok ? r.json() : [])
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = selectedCategory !== 'all' ? `/api/events?categoryId=${selectedCategory}` : '/api/events';
    fetch(url)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedCategory]);

  const filteredEvents = useMemo(() => {
    return events.filter(ev => typeFilter === 'all' || ev.type === typeFilter);
  }, [events, typeFilter]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents.filter(ev => new Date(ev.date) >= now);
  }, [filteredEvents]);

  const pastEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents.filter(ev => new Date(ev.date) < now).reverse();
  }, [filteredEvents]);

  const selectedCatName = categories.find(c => String(c.id) === selectedCategory)?.name || 'Todos los programas';

  return (
    <main className="dashboard-content">
      <style>{`
        .agenda-wrapper { padding: 2rem; max-width: 1400px; margin: 0 auto; }
        .agenda-hero { margin-bottom: 2rem; }
        .agenda-hero h1 { font-size: 1.8rem; font-weight: 800; color: #1a2a4b; margin: 0 0 0.4rem; }
        .agenda-hero p { color: #666; font-size: 0.95rem; margin: 0; }
        
        .agenda-controls { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem; align-items: center; }
        .agenda-select { padding: 0.7rem 1.2rem; border: 2px solid #e8ecf0; border-radius: 10px; font-size: 0.9rem; background: #fff; cursor: pointer; min-width: 220px; font-weight: 600; color: #1a2a4b; transition: 0.2s; }
        .agenda-select:focus { border-color: #478AC9; outline: none; }
        
        .type-filter-group { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .type-btn { padding: 0.5rem 1rem; border-radius: 20px; border: 2px solid transparent; cursor: pointer; font-size: 0.82rem; font-weight: 700; transition: 0.2s; background: #f0f4f8; color: #666; }
        .type-btn:hover { transform: translateY(-1px); }
        .type-btn.active-all { background: #1a2a4b; color: #fff; }
        .type-btn.active-Ensayo { background: #2e86de; color: #fff; }
        .type-btn.active-Concierto { background: #ff4757; color: #fff; }
        .type-btn.active-Reunión { background: #27ae60; color: #fff; }

        .agenda-grid { display: grid; grid-template-columns: 1fr 380px; gap: 2rem; align-items: start; }
        @media (max-width: 1024px) { .agenda-grid { grid-template-columns: 1fr; } }

        .events-section h2 { font-size: 1.1rem; font-weight: 700; color: #1a2a4b; margin: 0 0 1rem; display: flex; align-items: center; gap: 0.5rem; }
        .events-empty { text-align: center; padding: 3rem; color: #999; font-style: italic; background: #f9fafb; border-radius: 12px; }

        .event-card { display: flex; gap: 1rem; background: #fff; border: 1px solid #eef2f5; border-radius: 14px; padding: 1.2rem 1.5rem; margin-bottom: 0.8rem; transition: 0.25s; box-shadow: 0 2px 8px rgba(0,0,0,0.03); align-items: center; }
        .event-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }

        .event-date-box { flex-shrink: 0; width: 54px; height: 60px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0; }
        .event-date-day { font-size: 1.6rem; font-weight: 900; line-height: 1; }
        .event-date-mon { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.75; }

        .event-body { flex: 1; min-width: 0; }
        .event-meta { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.3rem; flex-wrap: wrap; }
        .event-badge { padding: 0.15rem 0.6rem; border-radius: 6px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
        .event-program-tag { font-size: 0.72rem; color: #888; font-weight: 500; }
        .event-title { font-size: 1rem; font-weight: 700; color: #1a2a4b; margin: 0 0 0.3rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .event-detail-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        .event-detail { font-size: 0.8rem; color: #777; display: flex; align-items: center; gap: 0.25rem; }

        .section-divider { font-size: 0.7rem; font-weight: 800; color: #999; text-transform: uppercase; letter-spacing: 0.1em; margin: 2rem 0 0.8rem; padding-bottom: 0.5rem; border-bottom: 1px solid #eef2f5; }

        .sidebar-sticky { position: sticky; top: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .stat-card { background: #fff; border-radius: 14px; border: 1px solid #eef2f5; padding: 1.2rem 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .stat-card h3 { font-size: 0.75rem; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 1rem; }
        .stat-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #f5f5f5; }
        .stat-row:last-child { border-bottom: none; }
        .stat-label { font-size: 0.85rem; color: #555; display: flex; align-items: center; gap: 0.4rem; }
        .stat-value { font-size: 1.1rem; font-weight: 800; color: #1a2a4b; }

        .calendar-day-cell:hover span { transform: scale(1.1); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .calendar-tooltip {
          position: absolute; bottom: 110%; left: 50%; transform: translateX(-50%);
          width: 180px; background: #fff; border: 1px solid #eef2f5; border-radius: 10px;
          padding: 0.8rem; box-shadow: 0 10px 30px rgba(0,0,0,0.15); z-index: 100;
          text-align: left; pointer-events: none; animation: fadeIn 0.15s ease-out;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(5px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        
        .tooltip-event-item { display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-start; }
        .tooltip-event-item:last-child { margin-bottom: 0; }
        .tooltip-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
        .tooltip-info { display: flex; flex-direction: column; gap: 2px; }
        .tooltip-info strong { font-size: 0.75rem; color: #1a2a4b; line-height: 1.2; }
        .tooltip-info span { font-size: 0.65rem; color: #888; }
        .tooltip-arrow {
          position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
          width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #fff;
        }
      `}</style>

      <div className="agenda-wrapper">
        <div className="agenda-hero">
          <h1>📅 Agenda Musical</h1>
          <p>Consulta todos los ensayos, conciertos y reuniones de la OCGC.</p>
        </div>

        {/* Controles */}
        <div className="agenda-controls">
          <select
            className="agenda-select"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            aria-label="Filtrar por programa"
          >
            <option value="all">Todos los programas</option>
            {categories.map(c => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>

          <div className="type-filter-group" role="group" aria-label="Filtrar por tipo de evento">
            {['all', 'Ensayo', 'Concierto', 'Reunión'].map(t => (
              <button
                key={t}
                className={`type-btn ${typeFilter === t ? `active-${t}` : ''}`}
                onClick={() => setTypeFilter(t)}
              >
                {t === 'all' ? 'Todos' : t === 'Ensayo' ? '🎵 Ensayo' : t === 'Concierto' ? '🎼 Concierto' : '📋 Reunión'}
              </button>
            ))}
          </div>
        </div>

        <div className="agenda-grid">
          {/* Lista de eventos */}
          <div className="events-section">
            {loading ? (
              <div className="events-empty">Cargando agenda...</div>
            ) : filteredEvents.length === 0 ? (
              <div className="events-empty">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <strong>Sin eventos</strong>
                <p style={{ marginTop: '0.5rem' }}>No hay eventos para {selectedCatName.toLowerCase()}.</p>
              </div>
            ) : (
              <>
                {upcomingEvents.length > 0 && (
                  <>
                    <div className="section-divider">🗓 Próximos eventos ({upcomingEvents.length})</div>
                    {upcomingEvents.map(ev => <EventCard key={ev.id} event={ev} />)}
                  </>
                )}
                {pastEvents.length > 0 && (
                  <>
                    <div className="section-divider" style={{ marginTop: '2.5rem' }}>🕐 Eventos pasados</div>
                    {pastEvents.map(ev => <EventCard key={ev.id} event={ev} past />)}
                  </>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="sidebar-sticky">
            {/* Mini calendario */}
            <MiniCalendar
              events={filteredEvents}
              year={calYear}
              month={calMonth}
              onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); }}
            />

            {/* Resumen */}
            {!loading && filteredEvents.length > 0 && (
              <div className="stat-card">
                <h3>Resumen — {selectedCatName}</h3>
                {(['Ensayo', 'Concierto', 'Reunión'] as const).map(t => {
                  const count = filteredEvents.filter(e => e.type === t).length;
                  if (count === 0) return null;
                  const c = TYPE_COLORS[t];
                  return (
                    <div key={t} className="stat-row">
                      <span className="stat-label">
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.dot }} />
                        {t}s
                      </span>
                      <span className="stat-value">{count}</span>
                    </div>
                  );
                })}
                <div className="stat-row" style={{ borderTop: '2px solid #eee', marginTop: '0.5rem', paddingTop: '0.8rem' }}>
                  <span className="stat-label" style={{ fontWeight: 700 }}>Total</span>
                  <span className="stat-value">{filteredEvents.length}</span>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function EventCard({ event, past = false }: { event: any; past?: boolean }) {
  const d = new Date(event.date);
  const colors = TYPE_COLORS[event.type] || { bg: '#f0f4f8', accent: '#999', dot: '#999' };
  return (
    <div className="event-card" style={{ opacity: past ? 0.65 : 1, borderLeft: `4px solid ${colors.accent}` }}>
      {/* Caja fecha */}
      <div className="event-date-box" style={{ background: colors.bg, color: colors.accent }}>
        <span className="event-date-day">{d.getDate()}</span>
        <span className="event-date-mon">{MONTHS_ES[d.getMonth()].slice(0, 3)}</span>
      </div>
      <div className="event-body">
        <div className="event-meta">
          <span className="event-badge" style={{ background: colors.bg, color: colors.accent }}>{event.type}</span>
          {event.category && <span className="event-program-tag">📂 {event.category.name}</span>}
        </div>
        <div className="event-title">{event.title}</div>
        <div className="event-detail-row">
          <span className="event-detail">🕒 {d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          {event.location && <span className="event-detail">📍 {event.location}</span>}
          <span className="event-detail">📅 {d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        {event.description && (
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#888', lineHeight: 1.5 }}>{event.description}</p>
        )}
      </div>
    </div>
  );
}
