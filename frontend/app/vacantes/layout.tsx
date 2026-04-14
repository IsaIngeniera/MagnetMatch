'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '../../complements/logo';

export default function VacantesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { id: 'inicio',        href: '/vacantes/inicio',        icon: '🏠', label: 'Inicio' },
    { id: 'postulaciones', href: '/vacantes/postulaciones', icon: '📋', label: 'Mis Postulaciones' },
    { id: 'perfil',        href: '/vacantes/perfil',        icon: '👤', label: 'Perfil' },
    { id: 'mensajes',      href: '/vacantes/mensajes',      icon: '✉️', label: 'Mensajes' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f9fafb', fontFamily: 'Segoe UI, sans-serif' }}>

      {/* ── HEADER BAR HORIZONTAL (top) — pequeño ── */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '48px',
        background: '#f7f0f5',
        borderBottom: '1px solid #f7f0f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        /* padding-left empuja el nav para que no quede detrás del sidebar */
        paddingLeft: '260px',
        zIndex: 100,
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
      }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href);
            return (
              <Link
                key={link.id}
                href={link.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 14px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 700,
                  color: isActive ? '#00C94A' : '#343a40',
                  background: isActive ? 'rgba(0,201,74,0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(0,201,74,0.2)' : '1px solid transparent',
                  transition: 'all 0.18s',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '14px' }}>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* ── BODY: sidebar + main ── */}
      <div style={{ display: 'flex', flex: 1, marginTop: '48px' }}>

        {/* SIDEBAR FIJO (empieza justo bajo el header) */}
        <aside style={{
          width: '260px',
          background: '#f7f0f5',
          borderRight: '1px solid #f7f0f5',
          padding: '30px 20px',
          position: 'fixed',
          top: '48px',
          left: 0,
          height: 'calc(100vh - 48px)',
        }}>
          <div style={{ marginBottom: '40px', paddingLeft: '10px' }}>
            <Logo showText={true} />
          </div>

          <nav>
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href);
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    marginBottom: '8px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    background: isActive ? 'rgba(0,201,74,0.1)' : 'transparent',
                    color: isActive ? '#00C94A' : '#343a40',
                    fontWeight: isActive ? 700 : 700,
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Botón Cerrar Sesión */}
          <div style={{ position: 'absolute', bottom: '30px', width: '80%' }}>
            <button
              onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                border: '1px solid #fee2e2',
                color: '#ef4444',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main style={{
          flex: 1,
          marginLeft: '260px',
          padding: '40px',
          minHeight: 'calc(100vh - 48px)',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}