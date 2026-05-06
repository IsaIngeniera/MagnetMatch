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
  porcentaje_minimo?: number;
  empresa?: { nombre: string };
  habilidades?: Habilidad[];
}

export default function InicioPage() {
  const [porcentaje, setPorcentaje] = useState(0);
  const [recomendadas, setRecomendadas] = useState<Vacante[]>([]);
  const [loading, setLoading] = useState(true);
  const [consejo, setConsejo] = useState<string | null>(null);
  const [loadingConsejo, setLoadingConsejo] = useState(false);

  const [aplicando, setAplicando] = useState<number | null>(null);
  const [mensajePostulacion, setMensajePostulacion] = useState<{
    id: number; texto: string; exito: boolean
  } | null>(null);
  const [aplicadas, setAplicadas] = useState<Set<number>>(new Set());

  const [descartadas, setDescartadas] = useState<Set<number>>(new Set());
  const [ultimoDescarte, setUltimoDescarte] = useState<number | null>(null);
  const [mostrarDeshacer, setMostrarDeshacer] = useState(false);
  const [timerDeshacer, setTimerDeshacer] = useState<ReturnType<typeof setTimeout> | null>(null);

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
            setRecomendadas([]);
          } else {
            console.error('Error de servidor:', err.response?.data?.error || err.message);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const obtenerConsejoIA = async () => {
    if (porcentaje < 100) return;
    setLoadingConsejo(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/api/aspirantes/recomendaciones/me/consejo-ia`, config);
      setConsejo(res.data.consejo);
    } catch (e) {
      console.error(e);
      setConsejo("Error al conectar con la IA.");
    } finally {
      setLoadingConsejo(false);
    }
  };

  // ✅ HU-10: bloquear si perfil incompleto, match 0%, o match < porcentaje_minimo
  const puedeAplicar = (vacante: Vacante): { puede: boolean; razon?: string } => {
    const minimo = vacante.porcentaje_minimo ?? 0;
    const matchScore = vacante.matchScore ?? vacante.score ?? 0;

    if (porcentaje < 100) {
      return {
        puede: false,
        razon: `Tu perfil está al ${porcentaje}%. Complétalo al 100% para aplicar.`
      };
    }

    if (matchScore === 0) {
      return {
        puede: false,
        razon: 'Tu compatibilidad con esta vacante es del 0%. No cumples los requisitos mínimos de habilidades.'
      };
    }

    if (minimo > 0 && matchScore < minimo) {
      return {
        puede: false,
        razon: `Tu compatibilidad (${matchScore}%) no alcanza el mínimo requerido por la empresa (${minimo}%).`
      };
    }

    return { puede: true };
  };

  const handleAplicar = async (vacante: Vacante) => {
    const { puede, razon } = puedeAplicar(vacante);

    if (!puede) {
      setMensajePostulacion({ id: vacante.id_vacante, texto: razon!, exito: false });
      return;
    }

    setAplicando(vacante.id_vacante);
    setMensajePostulacion(null);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/vacantes/${vacante.id_vacante}/aplicar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMensajePostulacion({
        id: vacante.id_vacante,
        texto: '¡Postulación enviada con éxito! La empresa recibirá tu perfil.',
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

  const handleDescartar = (idVacante: number) => {
    setDescartadas(prev => new Set(prev).add(idVacante));
    setUltimoDescarte(idVacante);
    setMostrarDeshacer(true);

    if (timerDeshacer) clearTimeout(timerDeshacer);
    const t = setTimeout(() => {
      setMostrarDeshacer(false);
      setUltimoDescarte(null);
    }, 5000);
    setTimerDeshacer(t);
  };

  const handleDeshacer = () => {
    if (ultimoDescarte !== null) {
      setDescartadas(prev => {
        const next = new Set(prev);
        next.delete(ultimoDescarte);
        return next;
      });
    }
    setMostrarDeshacer(false);
    setUltimoDescarte(null);
    if (timerDeshacer) clearTimeout(timerDeshacer);
  };

  if (loading) return (
    <div style={{ padding: '20px', color: '#00C94A', fontWeight: 700 }}>
      Cargando dashboard...
    </div>
  );

  const vacantesVisibles = recomendadas.filter(v => !descartadas.has(v.id_vacante));

  // Mapa de logos por nombre de empresa
  const getLogoEmpresa = (nombre?: string): string => {
    if (!nombre) return '/logo_tech.png';
    const n = nombre.toLowerCase();
    if (n.includes('creative') || n.includes('minds') || n.includes('market')) return '/logo_creative.png';
    if (n.includes('bank') || n.includes('banco') || n.includes('finance') || n.includes('startup') || n.includes('data')) return '/logo_finance.png';
    if (n.includes('sales') || n.includes('retail') || n.includes('global')) return '/logo_sales.png';
    return '/logo_tech.png';
  };

  return (
    <div style={{ width: '100%', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>

      {/* COLUMNA PRINCIPAL */}
      <div style={{ flex: 1, minWidth: 0 }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '30px', color: '#111' }}>
        Panel de Inicio
      </h1>

      {/* BARRA DE PROGRESO CIRCULAR */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: '24px', padding: '30px', marginBottom: '40px',
        display: 'flex', alignItems: 'center', gap: '30px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
      }}>
        <div style={{
          position: 'relative', width: '110px', height: '110px', flexShrink: 0, borderRadius: '50%',
          background: `conic-gradient(#00FF6A ${porcentaje}%, #ffffff20 0)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            width: '88px', height: '88px', background: '#0f172a', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: 900, color: '#00FF6A'
          }}>{porcentaje}%</div>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 5px', fontSize: '20px', fontWeight: 800, color: '#fff' }}>
            Progreso de tu Perfil
          </h3>
          <p style={{ color: '#94a3b8', margin: '0 0 12px', fontSize: '14px' }}>
            {porcentaje < 100
              ? 'Completa tus datos para aumentar tus posibilidades.'
              : '¡Tu perfil está al máximo nivel! Ya puedes aplicar.'}
          </p>
          {porcentaje < 100 ? (
            <p style={{ color: '#f59e0b', margin: 0, fontSize: '13px', fontWeight: 600 }}>
              ⚠️ Necesitas el 100% para poder aplicar a vacantes.
            </p>
          ) : (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ background: '#00FF6A20', color: '#00FF6A', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>✓ CV subido</span>
              <span style={{ background: '#00FF6A20', color: '#00FF6A', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>✓ Habilidades</span>
              <span style={{ background: '#00FF6A20', color: '#00FF6A', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>✓ Experiencia</span>
            </div>
          )}
        </div>
      </div>

      {/* VACANTES RECOMENDADAS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 4px', color: '#0f172a', letterSpacing: '-0.5px' }}>
            Recomendaciones para ti
          </h2>
          <span style={{
            background: 'linear-gradient(135deg, #00FF6A20, #00C94A20)', color: '#00C94A',
            padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, letterSpacing: '1px'
          }}>TOP MATCH</span>
        </div>
        <button 
          onClick={obtenerConsejoIA}
          disabled={porcentaje < 100 || loadingConsejo || recomendadas.length === 0}
          style={{
            background: porcentaje === 100 && recomendadas.length > 0 ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#e2e8f0',
            color: porcentaje === 100 && recomendadas.length > 0 ? '#fff' : '#94a3b8',
            padding: '12px 24px', borderRadius: '14px', fontWeight: 800, border: 'none',
            cursor: porcentaje === 100 && !loadingConsejo && recomendadas.length > 0 ? 'pointer' : 'not-allowed',
            boxShadow: porcentaje === 100 && recomendadas.length > 0 ? '0 10px 20px rgba(99,102,241,0.3)' : 'none',
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          {loadingConsejo ? '⏳ Consultando...' : 'Consejo de IA'}
        </button>
      </div>

      {/* ✅ HU-12: Snackbar "Deshacer" */}
      <div style={{
        position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000,
        transition: 'all 0.3s ease',
        opacity: mostrarDeshacer ? 1 : 0,
        pointerEvents: mostrarDeshacer ? 'auto' : 'none',
      }}>
        <div style={{
          background: '#1e293b', color: '#fff',
          padding: '12px 20px', borderRadius: '14px',
          display: 'flex', alignItems: 'center', gap: '16px',
          fontSize: '14px', fontWeight: 600,
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
        }}>
          <span>Vacante descartada</span>
          <button
            onClick={handleDeshacer}
            style={{
              background: '#00C94A', color: '#fff',
              border: 'none', borderRadius: '8px',
              padding: '5px 14px', fontWeight: 700,
              cursor: 'pointer', fontSize: '13px'
            }}
          >
            Deshacer
          </button>
        </div>
      </div>

      {vacantesVisibles.length > 0 ? (
        vacantesVisibles.map((v: Vacante) => {
          const { puede, razon } = puedeAplicar(v);
          const porcentajeMinimo = v.porcentaje_minimo ?? 0;
          const matchScore = v.matchScore ?? v.score ?? 0;
          const yaAplicada = aplicadas.has(v.id_vacante);
          const estaAplicando = aplicando === v.id_vacante;
          const botonDeshabilitado = estaAplicando || yaAplicada || !puede;

          return (
            <div
              key={v.id_vacante}
              style={{
                background: '#fff', borderRadius: '20px', padding: '24px',
                marginBottom: '16px',
                border: '2px solid #e8effa',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                transition: 'box-shadow 0.2s, transform 0.2s',
                animation: 'slideIn 0.3s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(99,102,241,0.15)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              }}
            >
              <style>{`
                @keyframes slideIn {
                  from { opacity: 0; transform: translateY(-8px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
              `}</style>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                {/* LOGO EMPRESA */}
                <img
                  src={getLogoEmpresa(v.empresa?.nombre)}
                  alt={v.empresa?.nombre || 'empresa'}
                  style={{
                    width: '68px', height: '68px', borderRadius: '18px',
                    objectFit: 'cover', flexShrink: 0,
                    border: '2px solid #f1f5f9',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>{v.titulo}</h4>
                    {porcentajeMinimo > 0 && (
                      <span style={{
                        background: matchScore >= porcentajeMinimo ? '#f0fdf4' : '#fff7ed',
                        color: matchScore >= porcentajeMinimo ? '#16a34a' : '#b45309',
                        border: `1px solid ${matchScore >= porcentajeMinimo ? '#bbf7d0' : '#fde68a'}`,
                        padding: '2px 8px', borderRadius: '8px',
                        fontSize: '11px', fontWeight: 700
                      }}>
                        Mínimo {porcentajeMinimo}% match
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: '14px' }}>
                    {v.modalidad} • <strong>{v.empresa?.nombre || 'Empresa Aliada'}</strong>
                  </p>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {v.habilidades && v.habilidades.length > 0 ? (
                      v.habilidades.map((h) => (
                        <span key={h.id_habilidad} style={{
                          background: '#f1f5f9', color: '#475569',
                          padding: '2px 8px', borderRadius: '6px',
                          fontSize: '11px', fontWeight: 600
                        }}>
                          {h.nombre}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                        Sin habilidades requeridas
                      </span>
                    )}
                  </div>
                </div>

                <div style={{
                  textAlign: 'right', display: 'flex',
                  flexDirection: 'column', alignItems: 'flex-end', gap: '8px'
                }}>
                  <div>
                    <div style={{ color: matchScore === 0 ? '#ef4444' : '#00C94A', fontSize: '24px', fontWeight: 900 }}>
                      {matchScore}%
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>MATCH</div>
                  </div>

                  {/* ✅ HU-10: botón bloqueado si no cumple requisitos */}
                  <button
                    onClick={() => handleAplicar(v)}
                    disabled={botonDeshabilitado}
                    title={!puede ? razon : yaAplicada ? 'Ya aplicaste' : 'Aplicar a esta vacante'}
                    style={{
                      padding: '8px 18px', borderRadius: '10px',
                      border: 'none', fontSize: '13px', fontWeight: 700,
                      cursor: botonDeshabilitado ? 'not-allowed' : 'pointer',
                      background: yaAplicada
                        ? '#e2e8f0'
                        : !puede
                          ? '#e2e8f0'
                          : estaAplicando
                            ? '#ccc'
                            : 'linear-gradient(135deg, #00FF6A, #00C94A)',
                      color: botonDeshabilitado ? '#94a3b8' : '#fff',
                      boxShadow: !botonDeshabilitado
                        ? '0 4px 12px rgba(0,201,74,0.25)'
                        : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {estaAplicando
                      ? 'Enviando...'
                      : yaAplicada
                        ? '✅ Aplicado'
                        : !puede
                          ? '🔒 No cumple requisito'
                          : 'Aplicar'}
                  </button>

                  {/* ✅ HU-12: botón "No me interesa" */}
                  <button
                    onClick={() => handleDescartar(v.id_vacante)}
                    style={{
                      padding: '5px 12px', borderRadius: '8px',
                      border: '1px solid #e2e8f0', background: 'transparent',
                      color: '#94a3b8', fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      (e.target as HTMLButtonElement).style.borderColor = '#fca5a5';
                      (e.target as HTMLButtonElement).style.color = '#ef4444';
                      (e.target as HTMLButtonElement).style.background = '#fff1f2';
                    }}
                    onMouseLeave={e => {
                      (e.target as HTMLButtonElement).style.borderColor = '#e2e8f0';
                      (e.target as HTMLButtonElement).style.color = '#94a3b8';
                      (e.target as HTMLButtonElement).style.background = 'transparent';
                    }}
                  >
                    No me interesa
                  </button>
                </div>
              </div>

              {/* ✅ HU-10: mensaje de error/éxito — siempre visible debajo */}
              {mensajePostulacion?.id === v.id_vacante && (
                <div style={{
                  marginTop: '12px', padding: '10px 14px', borderRadius: '10px',
                  fontSize: '13px', fontWeight: 600,
                  background: mensajePostulacion.exito ? '#f0fdf4' : '#fff7ed',
                  color: mensajePostulacion.exito ? '#16a34a' : '#b45309',
                  border: `1px solid ${mensajePostulacion.exito ? '#bbf7d0' : '#fde68a'}`
                }}>
                  {mensajePostulacion.texto}
                </div>
              )}

              {/* ✅ HU-10: aviso estático cuando no puede aplicar y no hay mensaje activo */}
              {!puede && !mensajePostulacion && (
                <div style={{
                  marginTop: '10px', padding: '8px 12px', borderRadius: '8px',
                  fontSize: '12px', fontWeight: 600,
                  background: '#fff7ed', color: '#b45309',
                  border: '1px solid #fde68a'
                }}>
                  {razon}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <p>
            {descartadas.size > 0 && recomendadas.length === descartadas.size
              ? 'Has descartado todas las vacantes. ¡Vuelve más tarde!'
              : 'No hay recomendaciones disponibles por ahora.'}
          </p>
        </div>
      )}

      {/* MODAL DE CONSEJO DE IA */}
      {consejo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff', padding: '32px', borderRadius: '24px', maxWidth: '700px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: 900, color: '#111', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              ✨ Consejo de IA
            </h2>
            <div style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', overflowY: 'auto', paddingRight: '12px', flexGrow: 1 }} dangerouslySetInnerHTML={{ __html: consejo }}></div>
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

      </div>{/* fin columna principal */}

    </div>
  );
}