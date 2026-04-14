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
  empresa?: { nombre: string };
  habilidades?: Habilidad[];
}

export default function InicioPage() {
  const [porcentaje, setPorcentaje] = useState(0);
  const [recomendadas, setRecomendadas] = useState<Vacante[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ HU "Aplicar con un clic": estado por vacante
  const [aplicando, setAplicando] = useState<number | null>(null);
  const [mensajePostulacion, setMensajePostulacion] = useState<{ id: number; texto: string; exito: boolean } | null>(null);
  // ✅ Registro de vacantes ya aplicadas en esta sesión
  const [aplicadas, setAplicadas] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { setLoading(false); return; }

        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [resPerfil, resRec] = await Promise.all([
          axios.get(`${API_URL}/api/aspirantes/perfil/me`, config),
          axios.get(`${API_URL}/api/vacantes/recomendadas`, config).catch(() => null)
        ]);

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

  // ✅ HU "Aplicar con un clic": handler
  const handleAplicar = async (vacante: Vacante) => {
    // CA: Restricción de perfil al 100%
    if (porcentaje < 100) {
      setMensajePostulacion({
        id: vacante.id_vacante,
        texto: `Tu perfil está al ${porcentaje}%. Complétalo al 100% para poder aplicar.`,
        exito: false
      });
      return;
    }

    setAplicando(vacante.id_vacante);
    setMensajePostulacion(null);

    try {
      const token = localStorage.getItem('token');
      // CA: Sincronización de compatibilidad — el backend calcula y guarda el score automáticamente
      await axios.post(
        `${API_URL}/api/aspirantes/me/match/${vacante.id_vacante}`,
        { estado_postulacion: 'postulado' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // CA: Confirmación de acción exitosa
      setMensajePostulacion({
        id: vacante.id_vacante,
        texto: '¡Postulación enviada con éxito! La empresa recibirá tu perfil y score de compatibilidad.',
        exito: true
      });
      setAplicadas(prev => new Set(prev).add(vacante.id_vacante));

    } catch (err) {
      let texto = 'Error al enviar la postulación. Inténtalo de nuevo.';
      if (axios.isAxiosError(err)) {
        texto = err.response?.data?.error || texto;
      }
      setMensajePostulacion({ id: vacante.id_vacante, texto, exito: false });
    } finally {
      setAplicando(null);
    }
  };

  if (loading) return <div style={{ padding: '20px', color: '#00C94A', fontWeight: 700 }}>Cargando dashboard...</div>;

  return (
    <div style={{ maxWidth: '900px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '30px', color: '#111' }}>Panel de Inicio</h1>

      {/* BARRA DE PROGRESO CIRCULAR — sin cambios */}
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
          <h3 style={{ margin: '0 0 5px', fontSize: '20px', fontWeight: 800, color: '#000000'}}>Progreso de tu Perfil</h3>
          <p style={{ color: '#000000', margin: 0, fontSize: '15px' }}>
            {porcentaje < 100
              ? 'Completa tus datos para aumentar tus posibilidades.'
              : '¡Tu perfil está al máximo nivel!'}
          </p>
          {/* ✅ Aviso contextual si el perfil no está completo */}
          {porcentaje < 100 && (
            <p style={{ color: '#f59e0b', margin: '6px 0 0', fontSize: '13px', fontWeight: 600 }}>
              ⚠️ Necesitas el 100% para poder aplicar a vacantes.
            </p>
          )}
        </div>
      </div>

      {/* VACANTES RECOMENDADAS */}
      <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#000000' }}>
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

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                <div>
                  <div style={{ color: '#00C94A', fontSize: '24px', fontWeight: 900 }}>
                    {v.matchScore || v.score || 0}%
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>MATCH</div>
                </div>

                {/* ✅ HU "Aplicar con un clic": botón con restricción de perfil */}
                <button
                  onClick={() => handleAplicar(v)}
                  disabled={aplicando === v.id_vacante || aplicadas.has(v.id_vacante)}
                  title={porcentaje < 100 ? `Tu perfil está al ${porcentaje}%. Necesitas el 100% para aplicar.` : 'Aplicar a esta vacante'}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: (aplicando === v.id_vacante || aplicadas.has(v.id_vacante)) ? 'not-allowed' : 'pointer',
                    // Gris si perfil incompleto o ya aplicado, verde si puede aplicar
                    background: aplicadas.has(v.id_vacante)
                      ? '#e2e8f0'
                      : porcentaje < 100
                        ? '#e2e8f0'
                        : aplicando === v.id_vacante
                          ? '#ccc'
                          : 'linear-gradient(135deg, #00FF6A, #00C94A)',
                    color: (porcentaje < 100 || aplicadas.has(v.id_vacante)) ? '#94a3b8' : '#fff',
                    boxShadow: (porcentaje === 100 && !aplicadas.has(v.id_vacante))
                      ? '0 4px 12px rgba(0,201,74,0.25)'
                      : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {aplicando === v.id_vacante
                    ? 'Enviando...'
                    : aplicadas.has(v.id_vacante)
                      ? '✅ Aplicado'
                      : porcentaje < 100
                        ? '🔒 Perfil incompleto'
                        : 'Aplicar'}
                </button>
              </div>
            </div>

            {/* ✅ CA: Confirmación / mensaje de error por vacante */}
            {mensajePostulacion?.id === v.id_vacante && (
              <div style={{
                marginTop: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                background: mensajePostulacion.exito ? '#f0fdf4' : '#fff7ed',
                color: mensajePostulacion.exito ? '#16a34a' : '#b45309',
                border: `1px solid ${mensajePostulacion.exito ? '#bbf7d0' : '#fde68a'}`
              }}>
                {mensajePostulacion.texto}
              </div>
            )}
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