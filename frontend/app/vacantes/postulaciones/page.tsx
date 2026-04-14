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
  // ✅ HU: Validación de lista vacía
  const [sinActividad, setSinActividad] = useState(false);
  const [loading, setLoading] = useState(true);

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
        const res = await axios.get(`${API_URL}/api/aspirantes/me/postulaciones`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // ✅ HU: el backend devuelve count:0 y data:[] cuando no hay postulaciones
        if (res.data.count === 0) {
          setSinActividad(true);
        } else {
          setPostulaciones(res.data.data);
        }
      } catch (error) {
        console.error("Error al cargar postulaciones:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPostulaciones();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px', color: '#00C94A', fontWeight: 700 }}>Cargando postulaciones...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '30px', color: '#000000' }}>Mi Seguimiento</h1>

      {/* ✅ HU: Mensaje informativo cuando no hay actividad */}
      {sinActividad ? (
        <div style={{
          textAlign: 'center', padding: '80px 40px',
          background: '#fff', borderRadius: '24px',
          border: '1px solid #eef2f6'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>
            Aún no tienes postulaciones
          </h3>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Ve al <a href="/vacantes/inicio" style={{ color: '#00C94A', fontWeight: 600, textDecoration: 'none' }}>Panel de Inicio</a> y aplica a una vacante para comenzar tu seguimiento.
          </p>
        </div>
      ) : (
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
                    <p style={{ fontSize: '12px', color: '#64748b' }}>{p.vacante?.empresa?.nombre}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#00C94A', fontWeight: 800 }}>
                        {p.score_compatibilidad}% Match
                      </span>
                    </div>
                  </div>
                ))}

              {/* ✅ Mensaje dentro de cada columna vacía */}
              {postulaciones.filter(p => p.estado_postulacion === col.id).length === 0 && (
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', marginTop: '30px' }}>
                  Sin postulaciones aquí
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}