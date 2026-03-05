'use client';
import { useState } from 'react';
import axios from 'axios';
import { Logo } from '../../complements/logo';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMensaje('');
    try {
      const res = await axios.post('http://localhost:4000/api/auth/login', form);
      localStorage.setItem('token', res.data.token);
      setMensaje('✅ Login exitoso! Redirigiendo...');
      window.location.href = '/vacantes';
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setMensaje(err.response?.data?.error || '❌ Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

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
      <div style={{
        background: '#ffffff',
        backdropFilter: 'blur(20px)',
        border: '1px solid #e5e5e5',
        borderRadius: '24px',
        padding: '50px 40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.08)'
      }}>

        <Logo showText={true} />

        {/* Email */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#555', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>
            CORREO ELECTRÓNICO
          </label>
          <input
            name="email"
            type="email"
            placeholder="tu@email.com"
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: '#f9f9f9',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              color: '#222',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ color: '#555', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>
            CONTRASEÑA
          </label>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: '#f9f9f9',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              color: '#222',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Botón */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            background: loading ? 'rgba(0,201,74,0.4)' : 'linear-gradient(135deg, #00FF6A, #00C94A)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.5px',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 10px 20px rgba(0,201,74,0.25)'
          }}
        >
          {loading ? 'INICIANDO...' : 'INICIAR SESIÓN'}
        </button>

        {/* Mensaje */}
        {mensaje && (
          <div style={{
            textAlign: 'center',
            marginTop: '20px',
            padding: '10px',
            borderRadius: '8px',
            background: mensaje.includes('✅') ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
            color: mensaje.includes('✅') ? '#16a34a' : '#f87171',
            fontSize: '14px'
          }}>
            {mensaje}
          </div>
        )}

        {/* Link registro */}
        <p style={{ textAlign: 'center', marginTop: '30px', color: '#888', fontSize: '14px' }}>
          ¿No tienes cuenta?{' '}
          <a href="/register" style={{ color: '#00C94A', textDecoration: 'none', fontWeight: 600 }}>
            Regístrate aquí
          </a>
        </p>
      </div>
    </div>
  );
}