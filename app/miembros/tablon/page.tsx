"use client";

import { useEffect, useState } from 'react';
import { useUser } from "@clerk/nextjs";

export default function TablonPage() {
  const { isLoaded } = useUser();
  const [recentScores, setRecentScores] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  useEffect(() => {
    if (isLoaded) {
      fetch("/api/scores")
        .then(res => res.json())
        .then(data => setRecentScores(data.slice(0, 5)))
        .catch(err => console.error("Error loading scores:", err));

      fetch("/api/events")
        .then(res => res.json())
        .then(data => {
            const today = new Date();
            today.setHours(0,0,0,0);
            const futureEvents = data.filter((ev:any) => new Date(ev.date) >= today);
            setUpcomingEvents(futureEvents.slice(0, 4));
        })
        .catch(err => console.error("Error loading events:", err));
    }
  }, [isLoaded]);

  const forceDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="tablon-full-container">
      <div className="dashboard-grid">
        
        {/* COLUMNA IZQUIERDA: PARTITURAS */}
        <section className="dashboard-column">
          <div className="column-header">
            <span className="icon-circ">🎼</span>
            <h3>Últimas partituras</h3>
          </div>

          <div className="cards-stack">
            {recentScores.length === 0 ? (
              <div className="empty-card">No hay partituras nuevas.</div>
            ) : (
              recentScores.map(score => (
                <div key={score.id} className="item-row-card">
                  <div className="item-body">
                    <div className="item-meta">
                       <h4>{score.title}</h4>
                       <span className="item-label">{score.category?.name || "General"}</span>
                    </div>
                  </div>
                  <div className="item-actions">
                    <a href={score.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-action-outline">ABRIR</a>
                    <button onClick={() => forceDownload(score.fileUrl, `${score.title}.pdf`)} className="btn-action-solid">DESCARGAR</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* COLUMNA DERECHA: AGENDA */}
        <section className="dashboard-column">
          <div className="column-header">
            <span className="icon-circ accent">📅</span>
            <h3>Próximos eventos</h3>
          </div>

          <div className="cards-stack">
            {upcomingEvents.length === 0 ? (
              <div className="empty-card">No hay eventos próximos.</div>
            ) : (
              upcomingEvents.map(event => {
                const evDate = new Date(event.date);
                const isConcert = event.type?.toLowerCase().includes("concierto");
                return (
                  <div key={event.id} className={`event-card-item ${isConcert ? 'is-concert' : ''}`}>
                    <div className="ev-date-box">
                      <span className="day">{evDate.getDate()}</span>
                      <span className="month">{evDate.toLocaleString('es-ES', { month: 'short' }).toUpperCase()}</span>
                    </div>
                    <div className="ev-info-details">
                       <h5>{event.title}</h5>
                       <p>
                         {evDate.toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'UTC' })} • {evDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                       </p>
                       <span className="ev-loc">{event.location || "Sede OCGC"}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

      </div>

      <style jsx>{`
        .tablon-full-container { width: 100%; }
        .dashboard-grid { display: grid; grid-template-columns: 1fr 340px; gap: 4rem; }
        
        .dashboard-column { display: flex; flex-direction: column; gap: 1.5rem; }
        .column-header { display: flex; align-items: center; gap: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #f1f5f9; }
        .column-header h3 { font-family: 'Inter', sans-serif; font-size: 1rem; font-weight: 800; color: #1a2a4b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
        .icon-circ { width: 36px; height: 36px; background: #478AC910; color: #478AC9; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid #478AC920; }
        .icon-circ.accent { background: #1a2a4b10; color: #1a2a4b; }

        .cards-stack { display: flex; flex-direction: column; gap: 0.75rem; }

        /* Row Card Partitura */
        .item-row-card { background: white; border: 1px solid #f1f5f9; border-radius: 12px; padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; transition: 0.2s; }
        .item-row-card:hover { border-color: #478AC930; transform: translateX(5px); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        
        .item-meta h4 { margin: 0; font-size: 1.1rem; color: #1a2a4b; font-weight: 800; }
        .item-label { font-size: 0.75rem; color: #478AC9; font-weight: 700; text-transform: uppercase; margin-top: 0.2rem; display: block; }

        .item-actions { display: flex; gap: 0.75rem; }
        .btn-action-solid { background: #1a2a4b; color: white !important; border: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 800; font-size: 0.7rem; cursor: pointer; }
        .btn-action-outline { background: #f8fafc; color: #64748b !important; border: 1px solid #e2e8f0; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 800; font-size: 0.7rem; text-decoration: none; }

        /* Row Card Evento */
        .event-card-item { display: flex; align-items: center; gap: 1.25rem; padding: 1rem; background: #fff; border: 1px solid #f1f5f9; border-radius: 12px; border-left: 4px solid #478AC9; }
        .event-card-item.is-concert { border-left-color: #f43f5e; background: #fff8f8; }
        
        .ev-date-box { display: flex; flex-direction: column; align-items: center; min-width: 50px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.4rem; }
        .ev-date-box .day { font-size: 1.25rem; font-weight: 900; color: #1a2a4b; line-height: 1; }
        .ev-date-box .month { font-size: 0.65rem; font-weight: 800; color: #94a3b8; }
        
        .ev-info-details h5 { margin: 0; font-size: 0.95rem; color: #1a2a4b; font-weight: 800; line-height: 1.2; }
        .ev-info-details p { margin: 0.2rem 0 0; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: capitalize; }
        .ev-loc { font-size: 0.65rem; color: #478AC9; font-weight: 800; text-transform: uppercase; margin-top: 0.4rem; display: block; }

        .empty-card { padding: 3rem; text-align: center; color: #cbd5e1; border: 1px dashed #f1f5f9; border-radius: 12px; }

        @media (max-width: 1100px) {
          .dashboard-grid { grid-template-columns: 1fr; gap: 3rem; }
          .dashboard-column:last-child { max-width: 400px; }
        }
      `}</style>
    </div>
  );
}
