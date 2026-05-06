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

      {/* ── BODY: sidebar + main ── */}
      <div style={{ display: 'flex', flex: 1 }}>

        {/* SIDEBAR FIJO */}
        <aside style={{
          width: '260px',
          background: '#f7f0f5',
          borderRight: '1px solid #f7f0f5',
          padding: '30px 20px',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
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

          {/* Asesor + Cerrar Sesión */}
          <div style={{ marginTop: 'auto', paddingTop: '24px' }}>

            {/* Tarjeta del asesor */}
            <div style={{
              background: 'transparent',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '12px',
              textAlign: 'center',
            }}>
              <img
                src="/advisor.png"
                alt="Asesor MagnetMatch"
                style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  objectFit: 'cover', border: '3px solid #00FF6A',
                  display: 'block', margin: '0 auto 10px',
                }}
              />
              <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                Contacta a un Asesor
              </p>
              <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#64748b' }}>Estamos aquí para ayudarte</p>
              <a
                href="tel:+573001234567"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: '#00FF6A', color: '#0f172a',
                  padding: '7px 14px', borderRadius: '20px',
                  fontWeight: 800, fontSize: '13px', textDecoration: 'none',
                }}
              >
                📞 +57 300 123 4567
              </a>
            </div>

            {/* Botón Cerrar Sesión */}
            <button
              onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
              style={{
                width: '100%', padding: '12px',
                background: 'transparent', border: '1px solid #fee2e2',
                color: '#ef4444', borderRadius: '10px',
                cursor: 'pointer', fontWeight: 600,
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
          padding: '40px 48px',
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}