'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '@/lib/api';

interface Postulacion {
  id_match: number;
  estado_postulacion: string;
  score_compatibilidad: number;
  vacante: { titulo: string; empresa: { nombre: string } };
}

export default function PostulacionesPage() {
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const estados = [
    { id: 'postulado', label: 'POSTULADO', bg: '#F1F5F9' },
    { id: 'en_revision', label: 'REVISIÓN', bg: '#E9E3FF' },
    { id: 'entrevista', label: 'ENTREVISTA', bg: '#FFE4E4' },
    { id: 'oferta', label: 'OFERTA', bg: '#E4FFE9' }
  ];

  useEffect(() => {
    const fetchPostulaciones = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // CORRECCIÓN: La ruta correcta en tu backend está bajo /aspirantes, no bajo /match
        const res = await axios.get(`${API_URL}/api/aspirantes/me/postulaciones`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setPostulaciones(res.data.data);
      } catch (error) {
        console.error("Error al cargar postulaciones:", error);
      }
    };
    fetchPostulaciones();
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '30px' }}>Mi Seguimiento</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '20px',
        alignItems: 'start' 
      }}>
        {estados.map((col) => (
          <div key={col.id} style={{ 
            background: col.bg, 
            borderRadius: '20px', 
            padding: '20px', 
            minHeight: '70vh' 
          }}>
            <h4 style={{ 
              fontSize: '12px', 
              fontWeight: 900, 
              color: '#64748b', 
              textAlign: 'center', 
              marginBottom: '20px',
              letterSpacing: '1px'
            }}>{col.label}</h4>

          {postulaciones
            .filter(p => p.estado_postulacion === col.id)
            .map((p) => (
              <div key={p.id_match} style={{
                background: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.03)'
              }}>
                <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>
                  {p.vacante?.titulo}
                </p>
                {/* Acceso a la empresa según tu include del controlador */}
                <p style={{ fontSize: '12px', color: '#64748b' }}>{p.vacante?.empresa?.nombre}</p> 
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#00C94A', fontWeight: 800 }}>
                    {p.score_compatibilidad}% Match
                  </span>
                </div>
              </div>
          ))}
          </div>
        ))}
      </div>
    </div>
  );
}