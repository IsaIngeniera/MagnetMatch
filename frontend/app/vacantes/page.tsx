'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '@/lib/api';

// --- INTERFACES (Solución al error 'any' de la imagen) ---
interface Vacante {
  id_vacante: number;
  titulo: string;
  descripcion: string;
  modalidad: string;
  empresa_nombre?: string;
  habilidades_requeridas: string;
  score?: number; // HU-11: Match Score
}

interface Postulacion {
  id_match: number;
  id_vacante: number;
  estado_postulacion: string;
  score_compatibilidad: number;
  fecha_calculo: string;
  vacante: Vacante;
}

export default function Vacantes() {
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [recomendadas, setRecomendadas] = useState<Vacante[]>([]);
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const [porcentaje, setPorcentaje] = useState(0); // HU-2: Progreso de Perfil
  const [recomendacionesProgreso, setRecomendacionesProgreso] = useState<string[]>([]);
  const [paginaActiva, setPaginaActiva] = useState('inicio');
  const [loading, setLoading] = useState(false);
  const [consejo, setConsejo] = useState<string | null>(null);
  const [loadingConsejo, setLoadingConsejo] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // HU-2: Progreso del perfil
      const resProgreso = await axios.get(`${API_URL}/api/aspirante/me/progreso`, config);
      setPorcentaje(resProgreso.data.data.porcentaje_total || 0);
      setRecomendacionesProgreso(resProgreso.data.data.recomendaciones || []);

      const isComplete = resProgreso.data.data.porcentaje_total === 100;

      // HU-11/12: Recomendaciones con Match Score
      // Auto-calculamos si el perfil está al 100%
      const resRecs = await axios.get(`${API_URL}/api/match/recomendaciones/me?refresh=${isComplete}`, config);
      setRecomendadas(resRecs.data.data?.recomendaciones || []);

      // HU-13/15: Historial de postulaciones
      const resPost = await axios.get(`${API_URL}/api/match/me/postulaciones`, config);
      setPostulaciones(resPost.data.data);

      // Cargar vacantes generales
      const resVac = await axios.get(`${API_URL}/api/vacantes`);
      setVacantes(resVac.data);
    } catch (error) {
      console.error("Error al cargar datos", error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerConsejoIA = async () => {
    if (porcentaje < 100) return;
    setLoadingConsejo(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/api/aspirante/recomendaciones/me/consejo-ia`, config);
      setConsejo(res.data.consejo);
    } catch (e) {
      console.error(e);
      setConsejo("Error al conectar con la IA.");
    } finally {
      setLoadingConsejo(false);
    }
  };

  // --- COMPONENTES VISUALES ---

  // HU-2: Barra de progreso circular según wireframe
  const PerfilProgresoCircular = () => (
    <div style={{
      background: '#ffffff', borderRadius: '20px', padding: '24px', marginBottom: '32px',
      display: 'flex', alignItems: 'center', gap: '24px', border: '1px solid #e5e5e5',
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
    }}>
      <div style={{ 
        position: 'relative', width: '80px', height: '80px', borderRadius: '50%', 
        background: `conic-gradient(#00C94A ${porcentaje}%, #f0f0f0 0)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{
          width: '64px', height: '64px', background: '#fff', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: 800, color: '#111'
        }}>{porcentaje}%</div>
      </div>
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700 }}>Mi progreso del perfil</h3>
        <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
          {porcentaje < 100 ? 'Completa tu perfil para mejorar tu visibilidad y habilitar el Match con IA.' : '¡Perfil al 100%! Estás listo para usar la IA.'}
        </p>
        {porcentaje < 100 && recomendacionesProgreso.length > 0 && (
          <ul style={{ margin: '12px 0 0 0', paddingLeft: '20px', color: '#d97706', fontSize: '13px', fontWeight: 600 }}>
            {recomendacionesProgreso.map((rec, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>{rec}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  // HU-11: Tarjeta con Match Score
  const VacanteCardEnriquecida = ({ v, color, isMatch }: { v: Vacante; color: string; isMatch?: boolean }) => (
    <div style={{
      background: '#ffffff', border: `1px solid #e5e5e5`, borderLeft: `5px solid ${isMatch ? '#00C94A' : color}`,
      borderRadius: '16px', padding: '20px', marginBottom: '16px', display: 'flex',
      justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      <div>
        <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700 }}>{v.titulo}</h3>
        <p style={{ margin: '0 0 10px', color: '#666', fontSize: '14px' }}>{v.empresa_nombre || 'Empresa'} • {v.modalidad}</p>
        <div style={{ display: 'flex', gap: '6px' }}>
          {v.habilidades_requeridas ? v.habilidades_requeridas.split(',').map((h, i) => (
            <span key={i} style={{ background: '#f0fdf4', color: '#00C94A', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>{h.trim()}</span>
          )) : <span style={{ background: '#f0fdf4', color: '#00C94A', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>Varias</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        {isMatch && v.score && (
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#00C94A' }}>{v.score}% Match</span>
          </div>
        )}
        <button style={{
          background: 'linear-gradient(135deg, #00FF6A, #00C94A)', color: '#fff', border: 'none',
          padding: '8px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer'
        }}>Ver detalles</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '260px', background: '#fff', borderRight: '1px solid #e5e5e5', padding: '32px 20px' }}>
        <div style={{ fontWeight: 900, fontSize: '22px', color: '#00C94A', marginBottom: '40px', textAlign: 'center' }}>MAGNETMATCH</div>
        <nav>
          {[
            { id: 'inicio', icon: '🏠', label: 'Inicio' },
            { id: 'postulaciones', icon: '📋', label: 'Mis Postulaciones' },
            { id: 'perfil', icon: '👤', label: 'Perfil' },
            { id: 'mensajes', icon: '✉️', label: 'Mensajes' },
          ].map(link => (
            <div key={link.id} onClick={() => setPaginaActiva(link.id)} style={{
              padding: '12px 16px', marginBottom: '8px', borderRadius: '12px', cursor: 'pointer',
              background: paginaActiva === link.id ? '#00C94A15' : 'transparent',
              color: paginaActiva === link.id ? '#00C94A' : '#64748b',
              fontWeight: paginaActiva === link.id ? 700 : 500, display: 'flex', gap: '12px'
            }}>
              <span>{link.icon}</span> {link.label}
            </div>
          ))}
        </nav>
      </aside>

      {/* CONTENIDO */}
      <main style={{ flex: 1, padding: '48px', overflowY: 'auto' }}>
        <PerfilProgresoCircular />

        {paginaActiva === 'inicio' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Recomendadas para ti</h2>
              <button 
                onClick={obtenerConsejoIA}
                disabled={porcentaje < 100 || loadingConsejo || recomendadas.length === 0}
                style={{
                  background: porcentaje === 100 && recomendadas.length > 0 ? 'linear-gradient(135deg, #00FF6A, #00C94A)' : '#e2e8f0',
                  color: porcentaje === 100 && recomendadas.length > 0 ? '#fff' : '#94a3b8',
                  padding: '10px 20px', borderRadius: '12px', fontWeight: 700, border: 'none',
                  cursor: porcentaje === 100 && !loadingConsejo && recomendadas.length > 0 ? 'pointer' : 'not-allowed',
                  boxShadow: porcentaje === 100 && recomendadas.length > 0 ? '0 10px 20px rgba(0,201,74,0.2)' : 'none',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                {loadingConsejo ? 'Consultando a la IA...' : '✨ Consejo de IA'}
              </button>
            </div>

            {porcentaje < 100 && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '12px', marginBottom: '20px', color: '#991b1b', fontSize: '14px', fontWeight: 600 }}>
                Completa tu perfil al 100% en la pestaña "Perfil" para habilitar el motor de Inteligencia Artificial y encontrar tus vacantes ideales.
              </div>
            )}

            {recomendadas.length > 0 ? recomendadas.map(v => (
              <VacanteCardEnriquecida key={v.id_vacante} v={v} color="#00C94A" isMatch={true} />
            )) : porcentaje === 100 ? (
              <p style={{ color: '#64748b', fontSize: '14px', fontStyle: 'italic', marginBottom: '20px' }}>
                Aún no tienes recomendaciones. Haz clic en "Cálculo de Match con IA" para descubrir tus mejores opciones.
              </p>
            ) : null}
            
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: '40px', marginBottom: '20px' }}>Todas las vacantes</h2>
            {vacantes.map(v => (
              <VacanteCardEnriquecida key={v.id_vacante} v={v} color="#cbd5e1" />
            ))}
          </>
        )}

        {paginaActiva === 'postulaciones' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {/* HU-13/15: Tablero Kanban según wireframe */}
            {['postulado', 'en_revision', 'entrevista', 'oferta'].map(col => (
              <div key={col} style={{ background: '#f1f5f9', borderRadius: '12px', padding: '16px', minHeight: '500px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase' }}>{col.replace('_', ' ')}</h4>
                {postulaciones.filter(p => p.estado_postulacion === col).map(p => (
                  <div key={p.id_match} style={{ background: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700 }}>{p.vacante?.titulo}</p>
                    <span style={{ fontSize: '12px', color: '#00C94A', fontWeight: 600 }}>{p.score_compatibilidad}% Match</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {paginaActiva === 'perfil' && (
          <div style={{ maxWidth: '600px', background: '#fff', padding: '32px', borderRadius: '20px', border: '1px solid #e5e5e5' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>Mi Perfil</h2>
            
            {/* HU-5: Subida de CV */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Hoja de Vida (PDF)</label>
              <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer' }}>
                <input type="file" accept=".pdf" style={{ display: 'none' }} id="cv-upload" />
                <label htmlFor="cv-upload" style={{ cursor: 'pointer', color: '#00C94A', fontWeight: 700 }}>📁 Cargar CV</label>
              </div>
            </div>
            <button style={{ width: '100%', padding: '14px', background: '#00C94A', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Guardar Cambios</button>
          </div>
        )}
      </main>

      {/* MODAL DE CONSEJO DE IA */}
      {consejo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff', padding: '32px', borderRadius: '24px', maxWidth: '500px', width: '90%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: 900, color: '#111', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✨ Consejo de IA
            </h2>
            <div style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }} dangerouslySetInnerHTML={{ __html: consejo }}></div>
            <button 
              onClick={() => setConsejo(null)}
              style={{
                width: '100%', padding: '14px', background: '#0f172a', color: '#fff', border: 'none',
                borderRadius: '12px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase',
                fontSize: '13px', letterSpacing: '1px'
              }}
            >
              Cerrar y Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}