"use client";

import { useEffect, useState } from 'react';

export default function LogsPanel() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/logs')
      .then(r => r.json())
      .then(data => setLogs(data))
      .catch(console.error);
  }, []);

  const handleExport = () => {
    window.location.href = '/api/admin/logs/export';
  };

  return (
    <div className="logs-panel" style={{ padding: '2rem', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>📝 Logs de Auditoría</h2>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>Historial inmutable de las acciones administrativas recientes.</p>
        </div>
        <button onClick={handleExport} className="btn-main-admin" style={{ background: '#2c3e50', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}>
          📄 Exportar CSV
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '1rem' }}>Fecha y Hora</th>
              <th style={{ padding: '1rem' }}>Acción</th>
              <th style={{ padding: '1rem' }}>Detalles</th>
              <th style={{ padding: '1rem' }}>Admin ID</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={log.id} style={{ borderBottom: '1px solid #eee', background: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: '1rem', fontWeight: 'bold', color: '#2c3e50' }}>{log.action}</td>
                <td style={{ padding: '1rem', color: '#555', fontSize: '0.85rem' }}>
                  {typeof log.details === 'string' ? log.details : (
                    <pre style={{ margin: 0, fontSize: '0.75rem', background: '#f1f1f1', padding: '0.4rem', borderRadius: '4px' }}>
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#888' }}>
                  <code style={{ background: '#eee', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{log.userClerkId}</code>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No hay registros de actividad.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
