'use client';

import { useState } from 'react';
import axios from 'axios';
import { Logo } from '../../complements/logo';
// En frontend/app/login/page.tsx
import { auth, googleProvider } from '../../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { API_URL } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Register() {
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    telefono: '',
  });
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
  setLoading(true);
  setMensaje('');

  try {
    // 1. Registro en Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
    const uid = userCredential.user.uid;

    // 2. Registro en Postgres
    // Enviamos 'form' (que ya tiene email, password, nombres, etc.) + el uid de Firebase
    await axios.post(`${API_URL}/api/auth/register`, {
      ...form,
      firebase_uid: uid
    });

    setMensaje('✅ ¡Cuenta creada con éxito!');
    // Redirigir al login o al perfil
    setTimeout(() => { window.location.href = '/login'; }, 1500);

  } catch (err: unknown) {
      let mensajeError = "Ocurrió un error inesperado al registrarte.";

      if (axios.isAxiosError(err)) {
        mensajeError = err.response?.data?.error || "Error de conexión con el servidor.";
      } else if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as any).code;
        switch (code) {
          case 'auth/email-already-in-use':
            mensajeError = "Este correo electrónico ya está registrado.";
            break;
          case 'auth/invalid-email':
            mensajeError = "El correo electrónico no es válido.";
            break;
          case 'auth/weak-password':
            mensajeError = "La contraseña debe tener al menos 6 caracteres.";
            break;
          default:
            mensajeError = "Hubo un problema al crear tu cuenta.";
        }
      } else if (err instanceof Error) {
        mensajeError = err.message;
      }

      setMensaje(`❌ ${mensajeError}`);
} finally {
  setLoading(false);
}
};

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    marginBottom: '12px',
    background: '#f9f9f9',
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    // --- CAMBIOS DE VISIBILIDAD AQUÍ ---
    color: '#1e293b', // Texto que escribe el usuario (Negro azulado)
    fontWeight: '500'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: '20px' }}>
      {/* Estilo inyectado para que el placeholder sea visible */}
      <style jsx global>{`
        input::placeholder {
          color: #94a3b8 !important;
          opacity: 1;
        }
      `}</style>
      
      <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ position: 'relative' }}>
          <Link href="/" style={{ position: 'absolute', top: 0, left: 0, color: '#666', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={24} />
          </Link>
          <Logo showText={true} />
        </div>
        <h2 style={{ textAlign: 'center', margin: '20px 0', color: '#333', fontSize: '20px' }}>Únete a MagnetMatch</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input name="nombres" placeholder="Nombres" onChange={handleChange} style={inputStyle} />
          <input name="apellidos" placeholder="Apellidos" onChange={handleChange} style={inputStyle} />
        </div>

        <input name="email" type="email" placeholder="Email" onChange={handleChange} style={inputStyle} />
        <input name="password" type="password" placeholder="Contraseña" onChange={handleChange} style={inputStyle} />
        <input name="telefono" placeholder="Teléfono" onChange={handleChange} style={inputStyle} />
        <button 
          onClick={handleSubmit} 
          disabled={loading}
          style={{
            width: '100%', padding: '15px', borderRadius: '12px', color: '#fff', fontWeight: 700, border: 'none',
            background: loading ? '#ccc' : 'linear-gradient(135deg, #00FF6A, #00C94A)',
            cursor: loading ? 'not-allowed' : 'pointer', transition: '0.3s'
          }}
        >
          {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
        </button>

        {mensaje && (
          <div style={{
            marginTop: '15px', 
            padding: '12px', 
            borderRadius: '8px', 
            background: mensaje.includes('✅') ? '#dcfce7' : '#fee2e2', 
            color: mensaje.includes('✅') ? '#166534' : '#991b1b', 
            fontSize: '14px', 
            textAlign: 'center',
            border: `1px solid ${mensaje.includes('✅') ? '#bbf7d0' : '#fecaca'}`,
            fontWeight: 500
          }}>
            {mensaje}
          </div>
        )}
      </div>
    </div>
  );
}