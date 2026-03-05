'use client';
import { useState } from 'react';
import axios from 'axios';
import { Logo } from '../../complements/logo';

export default function Register() {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    habilidades: ''
  });
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:4000/api/auth/register', form);
      setMensaje('✅ ' + res.data.mensaje);
      setTimeout(() => { window.location.href = '/login'; }, 1500);
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setMensaje(err.response?.data?.error || '❌ Error al registrar');
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
      fontFamily: 'Segoe UI, sans-serif'
    }}>
      <div style={{
        background: '#ffffff',
        backdropFilter: 'blur(20px)',
        border: '1px solid #e5e5e5',
        borderRadius: '20px',
        padding: '50px 40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.08)'
      }}>

        <Logo showText={true} />

        {/* Nombre */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ color: '#555', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            NOMBRE COMPLETO
          </label>
          <input
            name="nombre"
            type="text"
            placeholder="Tu nombre"
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: '#f9f9f9',
              border: '1px solid #e0e0e0',
              borderRadius: '10px',
              color: '#222',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ color: '#555', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
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
              borderRadius: '10px',
              color: '#222',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ color: '#555', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
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
              borderRadius: '10px',
              color: '#222',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Habilidades */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ color: '#555', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            HABILIDADES
          </label>
          <input
            name="habilidades"
            type="text"
            placeholder="JavaScript, Node.js, React..."
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: '#f9f9f9',
              border: '1px solid #e0e0e0',
              borderRadius: '10px',
              color: '#222',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <p style={{ color: '#aaa', fontSize: '12px', margin: '6px 0 0' }}>
            Separa tus habilidades con comas
          </p>
        </div>

        {/* Botón */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '15px',
            background: loading ? 'rgba(0,201,74,0.4)' : 'linear-gradient(135deg, #00FF6A, #00C94A)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '1px',
            transition: 'all 0.3s',
            boxShadow: '0 10px 20px rgba(0,201,74,0.25)'
          }}
        >
          {loading ? 'Registrando...' : 'CREAR CUENTA'}
        </button>

        {/* Mensaje */}
        {mensaje && (
          <p style={{
            textAlign: 'center',
            marginTop: '20px',
            color: mensaje.includes('✅') ? '#16a34a' : '#f87171',
            fontSize: '14px'
          }}>{mensaje}</p>
        )}

        {/* Link login */}
        <p style={{ textAlign: 'center', marginTop: '25px', color: '#888', fontSize: '14px' }}>
          ¿Ya tienes cuenta?{' '}
          <a href="/login" style={{ color: '#00C94A', textDecoration: 'none', fontWeight: 600 }}>
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}