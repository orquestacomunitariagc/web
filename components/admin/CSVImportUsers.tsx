"use client";

import { useState } from 'react';
import Papa from 'papaparse';
import { useNotifications } from '../ui/NotificationContext';

export default function CSVImportUsers({ onImportSuccess }: { onImportSuccess: () => void }) {
  const { showToast } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const processCSV = (file: File) => {
    setLoading(true);
    setErrorInfo(null);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        let successCount = 0;
        let errors = [];
        
        for (const row of rows) {
          // Normalización de claves para soportar tildes (agrupación, sección, matrícula)
          const findVal = (keys: string[]) => {
            const foundKey = Object.keys(row).find(k => 
              keys.includes(k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
            );
            return foundKey ? row[foundKey] : undefined;
          };

          const nombre = findVal(['nombre']);
          const apellidos = findVal(['apellidos']);
          const dni = findVal(['dni']);
          const email = findVal(['email']);
          const papel = findVal(['papel']);
          const agrupacion = findVal(['agrupacion']);
          const seccion = findVal(['seccion']);
          const matricula = findVal(['matricula', 'matricula_coche']);
          const esMaster = String(findVal(['es_master'])).toLowerCase() === 'true';
          const esArchivero = String(findVal(['es_archivero'])).toLowerCase() === 'true';
          const esExternal = String(findVal(['es_external'])).toLowerCase() === 'true';

          try {
            const res = await fetch('/api/admin/users/import', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                firstName: nombre,
                lastName: apellidos,
                dni,
                roles: seccion ? [seccion] : [],
                isMaster: esMaster,
                isArchiver: esArchivero,
                isExternal: esExternal,
                agrupacion,
                seccion,
                papel,
                matricula
              })
            });
            
            if (res.ok) {
              successCount++;
            } else {
              const errData = await res.json();
              errors.push(`${row.nombre || 'Fila'}: ${errData.error || 'Error desconocido'}`);
            }
          } catch(e) {
            errors.push(`${row.nombre || 'Fila'}: Fallo de conexión`);
          }
        }
        
        if (errors.length > 0) {
          setErrorInfo(`Importados ${successCount}. Errores: ${errors.slice(0, 5).join(' | ')}${errors.length > 5 ? '...' : ''}`);
        } else {
          showToast(`Importación completada. Usuarios procesados: ${successCount}`);
        }
        
        setLoading(false);
        onImportSuccess();
      },
      error: (err) => {
        setErrorInfo("Error al leer CSV: " + err.message);
        setLoading(false);
      }
    });
  };

  return (
    <div style={{ background: '#fff3f3', padding: '1.5rem', borderRadius: '12px', border: '1px dashed #e74c3c', marginTop: '2rem' }}>
      <h3 style={{ margin: '0 0 1rem', color: '#c0392b' }}>👥 Importar Miembros</h3>
      <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
        Sube un CSV para crear o actualizar miembros (Músicos, Admin o Externos). <br/>
        Columnas: <code>nombre, apellidos, dni, papel, agrupacion, seccion, email, es_master, es_archivero, es_external, matricula_coche</code>
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <input 
          type="file" 
          accept=".csv"
          disabled={loading}
          onChange={(e) => {
            if (e.target.files?.[0]) processCSV(e.target.files[0]);
          }}
          style={{ fontSize: '0.9rem' }}
        />
        {loading && <span style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '0.9rem' }}>⚙️ Importando...</span>}
      </div>
      {errorInfo && <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '1rem', background: '#fff', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ffcdd2' }}>{errorInfo}</p>}
    </div>
  );
}
