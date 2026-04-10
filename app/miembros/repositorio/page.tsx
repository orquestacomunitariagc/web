"use client";

import { useEffect, useState } from 'react';
import { useUser } from "@clerk/nextjs";

export default function RepositorioPageClient() {
  const { isLoaded } = useUser();
  const [scores, setScores] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'todas' | 'documentos'>('todas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      Promise.all([
        fetch("/api/scores").then(res => res.json()),
        fetch("/api/categories").then(res => res.json())
      ])
      .then(([scoresData, catsData]) => {
        setScores(Array.isArray(scoresData) ? scoresData : []);
        setCategories(Array.isArray(catsData) ? catsData : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando repositorio:", err);
        setLoading(false);
      });
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

  if (!isLoaded || loading) return <div className="p-10 text-center">Cargando archivo...</div>;

  const filteredScores = activeCategoryId === 'documentos' 
    ? scores.filter(s => s.isDocument)
    : activeCategoryId === 'todas' 
      ? scores.filter(s => !s.isDocument)
      : scores.filter(s => s.categoryId === activeCategoryId && !s.isDocument);

  return (
    <div className="repositorio-fixed-view">
      <div className="repo-grid-container">
        
        {/* SIDEBAR REHECHO (Vertical y claro) */}
        <aside className="repo-sidebar-nav">
          <div className="sidebar-brand">
            <h4>Archivos</h4>
          </div>
          
          <nav className="filter-group">
            <button 
              className={`filter-btn ${activeCategoryId === 'todas' ? 'active' : ''}`}
              onClick={() => setActiveCategoryId('todas')}
            >
              <i className="fa-solid fa-music"></i> Partituras
            </button>
            <button 
              className={`filter-btn ${activeCategoryId === 'documentos' ? 'active' : ''}`}
              onClick={() => setActiveCategoryId('documentos')}
            >
              <i className="fa-solid fa-file-lines"></i> Documentos
            </button>
          </nav>

          <div className="sidebar-divider">Programas</div>

          <nav className="filter-group">
                {categories.map(cat => (
                  <button 
                    key={cat.id} 
                    className={`filter-btn ${activeCategoryId === cat.id ? 'active' : ''}`}
                    onClick={() => setActiveCategoryId(cat.id)}
                  >
                    <i className="fa-solid fa-compact-disc"></i> 
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                       <span>{cat.name}</span>
                       {cat.eventDate && (
                         <span style={{ fontSize: '0.65rem', color: '#478AC9', fontWeight: 800 }}>
                           {new Date(cat.eventDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' })}
                         </span>
                       )}
                    </div>
                  </button>
                ))}
             </nav>
          </aside>

          {/* CONTENIDO PRINCIPAL */}
          <main className="repo-content-pane">
            <div className="pane-title-row">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2>
                  {activeCategoryId === 'todas' ? 'Partituras' 
                    : activeCategoryId === 'documentos' ? 'Documentación' 
                    : categories.find(c => c.id === activeCategoryId)?.name}
                </h2>
                {activeCategoryId !== 'todas' && activeCategoryId !== 'documentos' && (
                  <p style={{ color: '#478AC9', fontWeight: 800, margin: 0 }}>
                    CONCIERTO: {new Date(categories.find(c => c.id === activeCategoryId)?.eventDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                  </p>
                )}
              </div>
              <span className="results-chip">{filteredScores.length} Archivos</span>
            </div>

          <div className="inventory-stack">
            {filteredScores.length === 0 ? (
              <div className="inventory-empty">No hay archivos en esta categoría.</div>
            ) : (
              filteredScores.map(score => (
                <div key={score.id} className="inventory-card">
                  <div className="card-main">
                    <div className="card-doc-icon">PDF</div>
                    <div className="card-text">
                      <h4>{score.title}</h4>
                      <div className="card-tags">
                        <span className="tag-category">{score.category?.name || "REPERTORIO"}</span>
                        {score.allowedRoles?.length > 0 && <span className="tag-roles">{score.allowedRoles.join(" • ")}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="card-actions-group">
                    <a href={score.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-action-s">ABRIR</a>
                    <button onClick={() => forceDownload(score.fileUrl, `${score.title}.pdf`)} className="btn-action-p">BAJAR</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      <style jsx>{`
        .repositorio-fixed-view { width: 100%; }
        .repo-grid-container { display: flex; gap: 3.5rem; align-items: flex-start; }
        
        /* Sidebar Navigation Fix */
        .repo-sidebar-nav { width: 280px; flex-shrink: 0; background: #fff; border: 1px solid #eef2f6; border-radius: 16px; padding: 1.5rem; position: sticky; top: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
        .sidebar-brand { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2rem; }
        .sidebar-brand h4 { font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin: 0; letter-spacing: 0.1em; }
        
        .sidebar-divider { font-size: 0.7rem; font-weight: 800; color: #cbd5e1; margin: 2rem 0 1rem; padding-left: 0.5rem; text-transform: uppercase; border-top: 1px solid #f1f5f9; paddingTop: 1.5rem; }
        
        .filter-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .filter-btn { display: flex; align-items: center; gap: 1rem; width: 100%; background: none; border: none; padding: 0.85rem 1rem; border-radius: 12px; cursor: pointer; color: #64748b; font-weight: 600; font-size: 0.95rem; transition: 0.2s; text-align: left; }
        .filter-btn:hover { background: #f8fafc; color: #1a2a4b; }
        .filter-btn.active { background: #478AC910; color: #478AC9; font-weight: 800; }
        .filter-btn i { width: 20px; font-size: 1rem; opacity: 0.7; }

        /* Main Pane */
        .repo-content-pane { flex: 1; min-width: 0; }
        .pane-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; border-bottom: 1px solid #f8fafc; padding-bottom: 1.5rem; }
        .pane-title-row h2 { font-family: 'Inter', sans-serif; font-size: 2.2rem; font-weight: 900; color: #1a2a4b; margin: 0; }
        .results-chip { background: #1a2a4b; color: #fff; padding: 0.4rem 1rem; border-radius: 50px; font-size: 0.75rem; font-weight: 800; }

        /* Inventory Cards */
        .inventory-stack { display: flex; flex-direction: column; gap: 0.8rem; }
        .inventory-card { background: #fff; border: 1px solid #f1f5f9; border-radius: 16px; padding: 1.25rem 2rem; display: flex; justify-content: space-between; align-items: center; transition: 0.3s; }
        .inventory-card:hover { border-color: #478AC930; transform: translateY(-3px); box-shadow: 0 10px 30px rgba(0,0,0,0.04); }
        
        .card-main { display: flex; align-items: center; gap: 2rem; }
        .card-doc-icon { width: 44px; height: 44px; background: #fff1f2; color: #f43f5e; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 900; border: 1px solid #fee2e2; }
        
        .card-text h4 { margin: 0; font-size: 1.2rem; color: #1a2a4b; font-weight: 800; }
        .card-tags { display: flex; gap: 1rem; margin-top: 0.4rem; align-items: center; }
        .tag-category { font-size: 0.72rem; font-weight: 800; color: #478AC9; text-transform: uppercase; background: #478AC910; padding: 0.2rem 0.6rem; border-radius: 6px; }
        .tag-roles { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }

        .card-actions-group { display: flex; gap: 0.75rem; }
        .btn-action-p { background: #1a2a4b; color: white !important; border: none; padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 800; font-size: 0.75rem; cursor: pointer; transition: 0.2s; }
        .btn-action-p:hover { background: #0f172a; box-shadow: 0 4px 15px rgba(26, 42, 75, 0.2); }
        .btn-action-s { background: #f8fafc; color: #475569 !important; border: 1px solid #e2e8f0; padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 800; font-size: 0.75rem; text-decoration: none; transition: 0.2s; }
        .btn-action-s:hover { background: #f1f5f9; }

        .inventory-empty { padding: 5rem; text-align: center; color: #cbd5e1; border: 2px dashed #f1f5f9; border-radius: 20px; }
      `}</style>
    </div>
  );
}
