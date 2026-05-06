'use client';
import { useState } from 'react';
import axios from 'axios';
import { Logo } from '../../complements/logo';
import { auth, googleProvider } from '../../lib/firebase'; 
import { API_URL } from '@/lib/api';
import { useRouter } from 'next/navigation'; 
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter(); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMensaje('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
      const idToken = await userCredential.user.getIdToken(true); 
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email: form.email,
        token: idToken,
        firebase_uid: userCredential.user.uid
      });
      if (res.data.success) {
        localStorage.setItem('token', idToken);
        localStorage.setItem('user', JSON.stringify(res.data.usuario));
        setMensaje('✅ ¡Bienvenido!');
        setTimeout(() => router.push('/vacantes/inicio'), 1000); 
      }
    } catch (err: unknown) {
      console.error(err);
      let mensajeError = "Error al iniciar sesión. Por favor intenta de nuevo.";
      if (axios.isAxiosError(err)) {
        mensajeError = err.response?.data?.error || "Error de conexión con el servidor.";
      } else if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as any).code;
        switch (code) {
          case 'auth/invalid-email':
            mensajeError = "El correo electrónico no es válido.";
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            mensajeError = "Correo o contraseña incorrectos.";
            break;
          case 'auth/too-many-requests':
            mensajeError = "Demasiados intentos fallidos. Intenta más tarde.";
            break;
          default:
            mensajeError = "Hubo un problema con la autenticación.";
        }
      } else if (err instanceof Error) {
        mensajeError = err.message;
      }
      setMensaje(`❌ ${mensajeError}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken(true);
      const res = await axios.post(`${API_URL}/api/auth/google-login`, {
        email: result.user.email,
        token: idToken,
        firebase_uid: result.user.uid
      });
      if (res.data) {
        localStorage.setItem('token', res.data.token || idToken);
        localStorage.setItem('user', JSON.stringify(res.data.usuario || { email: result.user.email }));
        window.location.replace('/vacantes/inicio');
      }
    } catch (error) {
      console.error("Error Google login:", error);
      setMensaje('❌ Error al iniciar con Google');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid #eee',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    outline: 'none',
    backgroundColor: '#f9f9f9',
    color: '#333'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '24px', padding: '50px 40px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px rgba(0,0,0,0.08)' }}>
        
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Link href="/" style={{ position: 'absolute', top: '10px', left: 0, color: '#666', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={24} />
          </Link>
          <Logo showText={true} />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px',
            color: '#444', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continuar con Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
          <span style={{ color: '#aaa', fontSize: '12px' }}>O CON EMAIL</span>
          <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#555', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>EMAIL</label>
          <input name="email" type="email" placeholder="tu@email.com" onChange={handleChange} style={inputStyle} />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ color: '#555', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>CONTRASEÑA</label>
          <input name="password" type="password" placeholder="••••••••" onChange={handleChange} style={inputStyle} />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '16px', borderRadius: '12px', color: '#fff', fontSize: '16px', fontWeight: 800,
            background: loading ? '#ccc' : 'linear-gradient(135deg, #00FF6A, #00C94A)',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 10px 20px rgba(0,201,74,0.25)'
          }}
        >
          {loading ? 'CARGANDO...' : 'INICIAR SESIÓN'}
        </button>

        {mensaje && (
          <div style={{
            marginTop: '20px', 
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

        <p style={{ textAlign: 'center', marginTop: '30px', color: '#888', fontSize: '14px' }}>
          ¿No tienes cuenta? <a href="/register" style={{ color: '#00C94A', textDecoration: 'none', fontWeight: 600 }}>Regístrate</a>
        </p>
      </div>
    </div>
  );
}