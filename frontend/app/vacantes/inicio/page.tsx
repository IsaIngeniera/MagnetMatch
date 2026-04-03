'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '@/lib/api';

interface Habilidad {
  id_habilidad: number;
  nombre: string;
}

interface Vacante {
  id_vacante: number;
  titulo: string;
  modalidad: string;
  matchScore?: number;
  score?: number;
  empresa?: {
    nombre: string;
  };
  habilidades?: Habilidad[];
}

export default function InicioPage() {
  const [porcentaje, setPorcentaje] = useState(0);
  const [recomendadas, setRecomendadas] = useState<Vacante[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Usamos el mismo endpoint que el perfil para garantizar consistencia
        const [resPerfil, resRec] = await Promise.all([
          axios.get(`${API_URL}/api/aspirantes/perfil/me`, config),
          axios.get(`${API_URL}/api/vacantes/recomendadas`, config).catch(() => null)
        ]);

        // porcentaje_completitud es el mismo campo que muestra la página de perfil
        setPorcentaje(resPerfil.data.data?.porcentaje_completitud || 0);

        if (resRec?.data?.success) {
          setRecomendadas(resRec.data.data || []);
        }

      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 400) {
            console.warn("Perfil incompleto o sin habilidades para recomendaciones");
            setRecomendadas([]);
          } else {
            console.error("Error de servidor:", err.response?.data?.error || err.message);
          }
        } else if (err instanceof Error) {
          console.error("Error inesperado:", err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div style={{ padding: '20px', color: '#00C94A', fontWeight: 700 }}>Cargando dashboard...</div>;

  return (
    <div style={{ maxWidth: '900px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '30px', color: '#111' }}>Panel de Inicio</h1>

      {/* BARRA DE PROGRESO CIRCULAR */}
      <div style={{
        background: '#fff', borderRadius: '24px', padding: '30px', marginBottom: '40px',
        display: 'flex', alignItems: 'center', gap: '30px', border: '1px solid #eef2f6',
        boxShadow: '0 10px 25px rgba(0,0,0,0.02)'
      }}>
        <div style={{
          position: 'relative', width: '100px', height: '100px', borderRadius: '50%',
          background: `conic-gradient(#00C94A ${porcentaje}%, #f0f0f0 0)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            width: '82px', height: '82px', background: '#fff', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: 900, color: '#111'
          }}>{porcentaje}%</div>
        </div>
        <div>
          <h3 style={{ margin: '0 0 5px', fontSize: '20px', fontWeight: 800 }}>Progreso de tu Perfil</h3>
          <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>
            {porcentaje < 100 ? 'Completa tus datos para aumentar tus posibilidades.' : '¡Tu perfil está al máximo nivel!'}
          </p>
        </div>
      </div>

      {/* VACANTES RECOMENDADAS */}
      <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        Recomendaciones para ti{' '}
        <span style={{ background: '#00C94A15', color: '#00C94A', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' }}>TOP MATCH</span>
      </h2>

      {recomendadas.length > 0 ? (
        recomendadas.map((v: Vacante) => (
          <div
            key={v.id_vacante}
            style={{
              background: '#fff', borderRadius: '16px', padding: '20px',
              marginBottom: '15px', border: '1px solid #eee'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '17px', color: '#111' }}>{v.titulo}</h4>
                <p style={{ margin: '5px 0 10px', color: '#64748b', fontSize: '14px' }}>
                  {v.modalidad} • <strong>{v.empresa?.nombre || 'Empresa Aliada'}</strong>
                </p>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {v.habilidades && v.habilidades.length > 0 ? (
                    v.habilidades.map((h) => (
                      <span
                        key={h.id_habilidad}
                        style={{
                          background: '#f1f5f9', color: '#475569',
                          padding: '2px 8px', borderRadius: '6px',
                          fontSize: '11px', fontWeight: 600
                        }}
                      >
                        {h.nombre}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Sin habilidades requeridas</span>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#00C94A', fontSize: '24px', fontWeight: 900 }}>
                  {v.matchScore || v.score || 0}%
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>MATCH</div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <p>No hay recomendaciones disponibles por ahora.</p>
        </div>
      )}
    </div>
  );
}