import { Logo } from '../complements/logo';

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Segoe UI, sans-serif',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>

        <Logo showText={true} />

        <h1 style={{
          color: '#111',
          fontSize: '48px',
          fontWeight: 800,
          margin: '0 0 12px',
          letterSpacing: '-1px'
        }}>
          MagnetMatch
        </h1>

        <p style={{
          color: '#888',
          fontSize: '18px',
          margin: '0 0 50px',
          lineHeight: '1.6'
        }}>
          Conectamos talento con las mejores oportunidades laborales
        </p>

        {/* Features */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          marginBottom: '50px',
          flexWrap: 'wrap'
        }}>
          {[
            { icon: '🎯', text: 'Vacantes personalizadas' },
            { icon: '🔒', text: 'Registro seguro' },
            { icon: '⚡', text: 'Match inteligente' },
          ].map((f, i) => (
            <div key={i} style={{
              background: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '12px',
              padding: '14px 20px',
              color: '#555',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <span>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/register" style={{
            background: 'linear-gradient(135deg, #00FF6A, #00C94A)',
            color: '#fff',
            textDecoration: 'none',
            padding: '16px 36px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            boxShadow: '0 10px 30px rgba(0,201,74,0.3)',
            transition: 'all 0.3s'
          }}>
            Crear cuenta →
          </a>
          <a href="/login" style={{
            background: '#ffffff',
            color: '#333',
            textDecoration: 'none',
            padding: '16px 36px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 700,
            border: '1px solid #e0e0e0',
            transition: 'all 0.3s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            Iniciar sesión
          </a>
        </div>

        <p style={{
          color: '#ccc',
          fontSize: '13px',
          marginTop: '50px'
        }}>
          © 2025 MagnetMatch · Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}