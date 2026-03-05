'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface Vacante {
  id: number;
  titulo: string;
  descripcion: string;
  habilidades_requeridas: string;
}

export default function Vacantes() {
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [recomendadas, setRecomendadas] = useState<Vacante[]>([]);
  const [mensaje, setMensaje] = useState('');
  const [mostrarNotif, setMostrarNotif] = useState(false);
  const [paginaActiva, setPaginaActiva] = useState('inicio');

  const notificaciones = [
    { icon: '💼', texto: 'Nueva vacante sugerida', tiempo: 'hace 5 min' },
    { icon: '📩', texto: 'Invitación a entrevista', tiempo: 'hace 1 hora' },
    { icon: '⭐', texto: 'Tu perfil fue visto', tiempo: 'hace 2 horas' },
    { icon: '🎯', texto: 'Nuevo match encontrado', tiempo: 'hace 3 horas' },
  ];

  const navLinks = [
    { id: 'inicio', icon: '🏠', label: 'Inicio' },
    { id: 'perfil', icon: '👤', label: 'Perfil' },
    { id: 'postulaciones', icon: '📋', label: 'Mis Postulaciones' },
    { id: 'mensajes', icon: '✉️', label: 'Mensajes' },
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    axios.get('http://localhost:4000/api/vacantes')
      .then(res => setVacantes(res.data))
      .catch(() => setMensaje('Error al cargar vacantes'));

    axios.get('http://localhost:4000/api/vacantes/recomendadas', {
      headers: { authorization: token }
    })
      .then(res => setRecomendadas(res.data.recomendadas))
      .catch(() => setMensaje('Error al cargar recomendadas'));
  }, []);

  const badgeStyle = (color: string) => ({
    display: 'inline-block',
    background: `${color}20`,
    color: color,
    border: `1px solid ${color}40`,
    borderRadius: '20px',
    padding: '3px 10px',
    fontSize: '12px',
    fontWeight: 600,
    marginRight: '6px',
    marginTop: '4px',
  });

  const VacanteCard = ({ v, color }: { v: Vacante; color: string }) => (
    <div style={{
      background: '#ffffff',
      border: `1px solid ${color}40`,
      borderLeft: `4px solid ${color}`,
      borderRadius: '12px',
      padding: '20px 24px',
      marginBottom: '14px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ color: '#111', margin: '0 0 6px', fontSize: '16px', fontWeight: 700 }}>
            {v.titulo}
          </h3>
          <p style={{ color: '#666', margin: '0 0 12px', fontSize: '14px', lineHeight: '1.5' }}>
            {v.descripcion}
          </p>
          <div>
            {v.habilidades_requeridas.split(',').map((h, i) => (
              <span key={i} style={badgeStyle(color)}>{h.trim()}</span>
            ))}
          </div>
        </div>
        <button style={{
          background: `linear-gradient(135deg, #00FF6A, #00C94A)`,
          border: 'none',
          borderRadius: '8px',
          color: '#fff',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          marginLeft: '16px',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,201,74,0.3)'
        }}>
          Aplicar →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      fontFamily: 'Segoe UI, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* NAVBAR TOP */}
      <nav style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e5e5',
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>

        {/* Links navbar */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: '🏠 Inicio', id: 'inicio' },
            { label: '👤 Perfil', id: 'perfil' },
            { label: '📋 Mis Postulaciones', id: 'postulaciones' },
          ].map((link) => (
            <button key={link.id}
              onClick={() => setPaginaActiva(link.id)}
              style={{
                color: paginaActiva === link.id ? '#00C94A' : '#555',
                background: paginaActiva === link.id ? 'rgba(0,201,74,0.1)' : 'transparent',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}>{link.label}</button>
          ))}
        </div>

        {/* Notificaciones + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          <button
            onClick={() => setMostrarNotif(!mostrarNotif)}
            style={{
              background: '#f5f5f5',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              color: '#333',
              width: '38px',
              height: '38px',
              cursor: 'pointer',
              fontSize: '18px',
              position: 'relative'
            }}>
            🔔
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#00C94A',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#fff'
            }}>4</span>
          </button>

          {/* Panel notificaciones */}
          {mostrarNotif && (
            <div style={{
              position: 'absolute',
              top: '50px',
              right: '0',
              background: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '12px',
              width: '300px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              zIndex: 200,
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#111', fontWeight: 700, fontSize: '15px' }}>Notificaciones</span>
                <span style={{
                  background: 'rgba(0,201,74,0.15)',
                  color: '#00C94A',
                  borderRadius: '20px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  fontWeight: 700
                }}>4 nuevas</span>
              </div>
              {notificaciones.map((n, i) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid #f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer'
                }}>
                  <span style={{ fontSize: '20px' }}>{n.icon}</span>
                  <div>
                    <p style={{ color: '#333', margin: 0, fontSize: '13px', fontWeight: 600 }}>{n.texto}</p>
                    <p style={{ color: '#aaa', margin: '2px 0 0', fontSize: '12px' }}>{n.tiempo}</p>
                  </div>
                </div>
              ))}
              <div style={{ padding: '12px 20px', textAlign: 'center' }}>
                <a href="#" style={{ color: '#00C94A', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                  Ver todas →
                </a>
              </div>
            </div>
          )}

          <button
            onClick={() => { localStorage.removeItem('token'); window.location.href = '/'; }}

            style={{
              background: 'rgba(0,201,74,0.1)',
              border: '1px solid rgba(0,201,74,0.3)',
              borderRadius: '8px',
              color: '#00C94A',
              padding: '8px 14px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600
            }}>
            Salir
          </button>
        </div>
      </nav>

      {/* LAYOUT PRINCIPAL */}
      <div style={{ display: 'flex', flex: 1 }}>

        {/* SIDEBAR IZQUIERDA */}
        <aside style={{
          width: '220px',
          background: '#ffffff',
          borderRight: '1px solid #e5e5e5',
          padding: '30px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          position: 'sticky',
          top: '64px',
          height: 'calc(100vh - 64px)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.04)'
        }}>
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setPaginaActiva(link.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '10px',
                border: 'none',
                background: paginaActiva === link.id ? 'rgba(0,201,74,0.1)' : 'transparent',
                color: paginaActiva === link.id ? '#00C94A' : '#555',
                fontSize: '14px',
                fontWeight: paginaActiva === link.id ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                borderLeft: paginaActiva === link.id ? '3px solid #00C94A' : '3px solid transparent',
                transition: 'all 0.2s'
              }}>
              <span style={{ fontSize: '18px' }}>{link.icon}</span>
              {link.label}
            </button>
          ))}

          <div style={{ borderTop: '1px solid #f0f0f0', margin: '16px 0' }} />

          <button
            onClick={() => { localStorage.removeItem('token'); window.location.href = '/'; }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              border: 'none',
              background: 'transparent',
              color: '#00C94A',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              borderLeft: '3px solid transparent',
            }}>
            <span style={{ fontSize: '18px' }}>🚪</span>
            Cerrar sesión
          </button>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main style={{ flex: 1, padding: '40px 32px', overflowY: 'auto' }}>
          {mensaje && <p style={{ color: '#f87171', textAlign: 'center' }}>{mensaje}</p>}

          {recomendadas.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <span style={{ fontSize: '20px' }}>⭐</span>
                <h2 style={{ color: '#111', margin: 0, fontSize: '18px', fontWeight: 700 }}>Recomendadas para ti</h2>
                <span style={{
                  background: 'rgba(0,201,74,0.15)',
                  color: '#00C94A',
                  border: '1px solid rgba(0,201,74,0.3)',
                  borderRadius: '20px',
                  padding: '2px 10px',
                  fontSize: '12px',
                  fontWeight: 700
                }}>{recomendadas.length}</span>
              </div>
              {recomendadas.map(v => <VacanteCard key={v.id} v={v} color="#00C94A" />)}
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '20px' }}>💼</span>
              <h2 style={{ color: '#111', margin: 0, fontSize: '18px', fontWeight: 700 }}>Todas las vacantes</h2>
              <span style={{
                background: 'rgba(0,201,74,0.15)',
                color: '#00C94A',
                border: '1px solid rgba(0,201,74,0.3)',
                borderRadius: '20px',
                padding: '2px 10px',
                fontSize: '12px',
                fontWeight: 700
              }}>{vacantes.length}</span>
            </div>
            {vacantes.map(v => <VacanteCard key={v.id} v={v} color="#00C94A" />)}
          </div>
        </main>
      </div>
    </div>
  );
}