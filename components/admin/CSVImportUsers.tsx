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
    <div style={{ background: '#fff9f9', padding: '1.5rem', borderRadius: '12px', border: '1px dashed #e74c3c' }}>
      <h3 style={{ margin: '0 0 1rem', color: '#c0392b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.4rem' }}>👥</span> Importar Miembros por CSV
      </h3>
      
      <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #ffcdd2', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        <p style={{ margin: '0 0 0.8rem', fontWeight: 'bold', color: '#d32f2f' }}>📌 Estructura del archivo necesaria:</p>
        <ul style={{ margin: '0', paddingLeft: '1.2rem', color: '#555', lineHeight: '1.5' }}>
          <li><strong>Identificación:</strong> <code>nombre, apellidos, dni</code> (Obligatorios)</li>
          <li><strong>Acceso:</strong> <code>email</code> (Necesario para que el usuario pueda entrar).</li>
          <li><strong>Perfil Artístico:</strong> <code>agrupacion, seccion, papel</code> (ej: Orquesta / Violín / Músico).</li>
          <li><strong>Otros:</strong> <code>matricula_coche, es_master, es_archivero, es_external</code>.</li>
        </ul>
        <div style={{ marginTop: '0.8rem', padding: '0.5rem', background: '#f8f9fa', borderRadius: '4px', borderLeft: '3px solid #e74c3c' }}>
          <strong>Ejemplo:</strong> Juan,Perez,12345678X,juan@ocgc.com,Orquesta,Viola,Músico
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <label style={{ 
          background: '#e74c3c', 
          color: 'white', 
          padding: '0.6rem 1.2rem', 
          borderRadius: '6px', 
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: '500',
          fontSize: '0.9rem',
          opacity: loading ? 0.7 : 1
        }}>
          {loading ? 'Procesando...' : '📁 Seleccionar Archivo CSV'}
          <input 
            type="file" 
            accept=".csv"
            disabled={loading}
            onChange={(e) => {
              if (e.target.files?.[0]) processCSV(e.target.files[0]);
            }}
            style={{ display: 'none' }}
          />
        </label>
        {loading && <span style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '0.9rem' }}>⚙️ Importando datos y sincronizando Clerk...</span>}
      </div>
      {errorInfo && <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '1rem', background: '#fff', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ffcdd2' }}>{errorInfo}</p>}
    </div>
  );
}
