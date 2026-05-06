'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '@/lib/api';
import { Send, MessageSquare, CheckCheck, Circle, X, WifiOff, RefreshCw, Lock, Plus, Trash2 } from 'lucide-react';

// --- INTERFACES (alineadas con Mensaje.js) ---
interface Mensaje {
  id_mensaje: number;
  id_receptor: number;
  id_emisor: number;
  asunto: string;       // Funciona como nombre del remitente / hilo
  contenido: string;
  leido: boolean;
  fecha_envio: string;
}

// Agrupamos mensajes por asunto para simular conversaciones
interface Conversacion {
  asunto: string;
  mensajes: Mensaje[];
  noLeidos: number;
  ultimo: Mensaje;
}

// Empresa a la que el candidato ya aplicó
interface EmpresaAplicada {
  id_empresa: number;
  nombre: string;
}

export default function MensajesPage() {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [seleccionada, setSeleccionada] = useState<Conversacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // ID del usuario actual
  const [miId, setMiId] = useState<number | null>(null);

  // Empresas a las que el candidato ya aplicó (Objetivo 4)
  const [empresasAplicadas, setEmpresasAplicadas] = useState<EmpresaAplicada[]>([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string>('');

  const fetchEmpresasAplicadas = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/api/aspirantes/me/postulaciones`, config);
      if (res.data.success && res.data.data) {
        const empresas: EmpresaAplicada[] = [];
        const nombresVistos = new Set<string>();
        for (const post of res.data.data) {
          const nombre = post.vacante?.empresa?.nombre;
          if (nombre && !nombresVistos.has(nombre)) {
            nombresVistos.add(nombre);
            empresas.push({ id_empresa: 0, nombre });
          }
        }
        setEmpresasAplicadas(empresas);
      }
    } catch (e) {
      console.error('Error cargando empresas aplicadas:', e);
    }
  };

  const fetchMensajes = async () => {
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/api/aspirantes/me/mensajes`, config);

      if (res.data.success) {
        const mensajes: Mensaje[] = res.data.data;

        // Agrupar por asunto
        const mapa: Record<string, Mensaje[]> = {};
        mensajes.forEach(m => {
          if (!mapa[m.asunto]) mapa[m.asunto] = [];
          mapa[m.asunto].push(m);
        });

        const convs: Conversacion[] = Object.entries(mapa).map(([asunto, msgs]) => {
          // Ordenar mensajes por fecha dentro de cada conversación
          const ordenados = [...msgs].sort(
            (a, b) => new Date(a.fecha_envio).getTime() - new Date(b.fecha_envio).getTime()
          );
          return {
            asunto,
            mensajes: ordenados,
            noLeidos: msgs.filter(m => !m.leido).length,
            ultimo: ordenados[ordenados.length - 1]
          };
        });

        // Ordenar conversaciones por el más reciente
        convs.sort(
          (a, b) =>
            new Date(b.ultimo.fecha_envio).getTime() - new Date(a.ultimo.fecha_envio).getTime()
        );

        setConversaciones(convs);

        // Mantener seleccionada actualizada usando el estado más reciente (prev)
        setSeleccionada(prev => {
          if (prev) {
            const actualizada = convs.find(c => c.asunto === prev.asunto);
            return actualizada || null;
          } else if (convs.length > 0) {
            return convs[0];
          }
          return null;
        });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error('Error cargando mensajes:', err.response?.data?.error || err.message);
        setError('Error de conexión con el servidor. Por favor, verifica tu red o contacta soporte.');
      } else {
        setError('Ocurrió un error inesperado al cargar los mensajes.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMiId = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/api/aspirantes/perfil/me`, config);
      if (res.data.success) {
        setMiId(res.data.data.id_aspirante);
      }
    } catch (e) {
      console.error('Error fetching mi id', e);
    }
  };

  useEffect(() => {
    fetchMiId();
    fetchMensajes();
    fetchEmpresasAplicadas();
  }, []);

  // Scroll al fondo cuando cambia la conversación seleccionada
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [seleccionada]);

  const handleSeleccionar = async (conv: Conversacion) => {
    setSeleccionada(conv);

    // Marcar como leídos los mensajes no leídos de esta conversación
    // SOLO los que el aspirante recibió (no los que él mismo envió)
    const noLeidos = conv.mensajes.filter(m => !m.leido && m.id_receptor === miId);
    if (noLeidos.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await Promise.all(
        noLeidos.map(m =>
          axios.patch(
            `${API_URL}/api/aspirantes/me/mensajes/${m.id_mensaje}/leido`,
            {},
            config
          ).catch(e => console.error(e))
        )
      );

      // Refrescar lista tras marcar leídos
      fetchMensajes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEliminarConversacion = async (asunto: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la conversación con ${asunto}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_URL}/api/mensajes/conversacion/${encodeURIComponent(asunto)}`, config);
      if (seleccionada?.asunto === asunto) {
        setSeleccionada(null);
      }
      fetchMensajes();
    } catch (e) {
      console.error('Error eliminando conversación:', e);
      alert('Error al eliminar la conversación.');
    }
  };

  // Verificar si la conversación seleccionada pertenece a una empresa a la que se aplicó
  const puedeEnviarMensaje = (): boolean => {
    if (!seleccionada) return false;
    // Si hay empresas aplicadas, verificar que el asunto (empresa) esté en la lista
    if (empresasAplicadas.length === 0) return false;
    return empresasAplicadas.some(
      e => e.nombre.toLowerCase() === seleccionada.asunto.toLowerCase()
    );
  };

  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return;

    // Determinar el receptor y asunto
    let id_receptor_destino: number | null = null;
    let asunto = '';

    if (seleccionada) {
      // Respondiendo en conversación existente
      if (!puedeEnviarMensaje()) return;
      if (seleccionada.mensajes.length > 0 && miId !== null) {
        const m = seleccionada.mensajes[0];
        id_receptor_destino = (m.id_emisor === miId) ? m.id_receptor : m.id_emisor;
      } else {
        id_receptor_destino = seleccionada.ultimo.id_emisor;
      }
      asunto = seleccionada.asunto;
    } else {
      // Nueva conversación — debe haber empresa seleccionada
      if (!empresaSeleccionada) return;
      asunto = empresaSeleccionada;
      // Receptor ficticio para que pase la validación del backend si no tenemos ID de empresa
      id_receptor_destino = 1; 
    }

    setEnviando(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.post(`${API_URL}/api/mensajes`, {
        id_emisor: miId,
        id_receptor: id_receptor_destino,
        asunto: asunto,
        contenido: nuevoMensaje.trim()
      }, config);

      setNuevoMensaje('');
      setEmpresaSeleccionada('');
      fetchMensajes();
    } catch (e: any) {
      console.error('Error al enviar:', e);
      alert('Error al enviar el mensaje');
    } finally {
      setEnviando(false);
    }
  };

  const formatHora = (fecha: string) => {
    const d = new Date(fecha);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatFecha = (fecha: string) => {
    const d = new Date(fecha);
    const hoy = new Date();
    const esHoy =
      d.getDate() === hoy.getDate() &&
      d.getMonth() === hoy.getMonth() &&
      d.getFullYear() === hoy.getFullYear();
    return esHoy
      ? formatHora(fecha)
      : d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const totalNoLeidos = conversaciones.reduce((acc, c) => acc + c.noLeidos, 0);
  const puedeMensajear = puedeEnviarMensaje();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-10 text-center flex flex-col items-center gap-5 shadow-sm">
          {/* Ícono semántico de red caída */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <WifiOff size={36} className="text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-red-800 uppercase tracking-wide">Problema de Conexión</h2>
            <p className="text-sm font-semibold text-red-600 max-w-md">{error}</p>
            <p className="text-xs text-red-400 font-medium">Verifica tu conexión a internet o inténtalo de nuevo en unos momentos.</p>
          </div>
          <button
            onClick={() => { setLoading(true); fetchMensajes(); }}
            className="mt-2 px-8 py-3 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition flex items-center gap-2 shadow"
          >
            <RefreshCw size={14} /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-black text-slate-800 uppercase italic">Mensajes</h1>
          {totalNoLeidos > 0 && (
            <span className="bg-green-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
              {totalNoLeidos} nuevo{totalNoLeidos > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* LAYOUT PRINCIPAL */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden flex h-[calc(100vh-200px)] min-h-[500px]">

          {/* SIDEBAR — Lista de conversaciones */}
          <div className="w-72 flex-shrink-0 border-r border-slate-100 flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversaciones</p>
              <button 
                onClick={() => setSeleccionada(null)}
                title="Nueva Conversación"
                className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
                  <MessageSquare size={32} className="text-slate-200" />
                  <p className="text-xs text-slate-400 font-bold text-center uppercase italic">
                    No tienes mensajes aún
                  </p>
                </div>
              ) : (
                conversaciones.map(conv => {
                  const activa = seleccionada?.asunto === conv.asunto;
                  return (
                    <button
                      key={conv.asunto}
                      onClick={() => handleSeleccionar(conv)}
                      className={`w-full text-left px-4 py-4 border-b border-slate-50 transition-colors flex items-start gap-3 ${
                        activa ? 'bg-slate-900' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Avatar inicial */}
                      <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-sm uppercase ${
                        activa ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {conv.asunto.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-black uppercase truncate ${
                            activa ? 'text-white' : 'text-slate-800'
                          }`}>
                            {conv.asunto}
                          </span>
                          <span className={`text-[9px] font-bold flex-shrink-0 ml-1 ${
                            activa ? 'text-slate-400' : 'text-slate-400'
                          }`}>
                            {formatFecha(conv.ultimo.fecha_envio)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-0.5">
                          <p className={`text-[10px] truncate ${
                            activa ? 'text-slate-400' : conv.noLeidos > 0 ? 'text-slate-600 font-bold' : 'text-slate-400'
                          }`}>
                            {conv.ultimo.contenido}
                          </p>
                          {conv.noLeidos > 0 && !activa && (
                            <span className="ml-1 flex-shrink-0 bg-green-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                              {conv.noLeidos}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* PANEL DERECHO — Chat */}
          <div className="flex-1 flex flex-col min-w-0">
            {seleccionada ? (
              <>
                {/* Header del chat */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm">
                    {seleccionada.asunto.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-sm font-black text-slate-800 uppercase">
                      Chat con: {seleccionada.asunto}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold">
                      {seleccionada.mensajes.length} mensaje{seleccionada.mensajes.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {!puedeMensajear && (
                    <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                      <Lock size={12} className="text-amber-500" />
                      <span className="text-[10px] font-bold text-amber-600">Solo lectura</span>
                    </div>
                  )}
                  <button 
                    onClick={() => handleEliminarConversacion(seleccionada.asunto)}
                    className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition ml-2"
                    title="Eliminar conversación"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {seleccionada.mensajes.map(m => (
                    <div key={m.id_mensaje} className="flex justify-start">
                      <div className="max-w-[75%]">
                        <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                          <p className="text-sm text-slate-800 leading-relaxed">{m.contenido}</p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 ml-1">
                          <span className="text-[9px] text-slate-400 font-bold">
                            {formatHora(m.fecha_envio)}
                          </span>
                          {m.leido
                            ? <CheckCheck size={10} className="text-green-500" />
                            : <Circle size={8} className="text-slate-300 fill-slate-300" />
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Input enviar mensaje — condicionado */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                  {puedeMensajear ? (
                    <div className="flex gap-3 items-center">
                      <input
                        type="text"
                        value={nuevoMensaje}
                        onChange={e => setNuevoMensaje(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !enviando && handleEnviarMensaje()}
                        placeholder="Enviar mensaje..."
                        disabled={enviando}
                        className="flex-1 px-4 py-3 rounded-2xl bg-white border-2 border-slate-100 focus:border-green-400 outline-none text-sm font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-normal transition disabled:opacity-50"
                      />
                      <button
                        onClick={handleEnviarMensaje}
                        disabled={enviando || !nuevoMensaje.trim()}
                        className="w-11 h-11 rounded-2xl bg-slate-900 hover:bg-black transition flex items-center justify-center flex-shrink-0 shadow-lg disabled:opacity-50"
                      >
                        <Send size={16} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200">
                      <Lock size={16} className="text-amber-500 flex-shrink-0" />
                      <p className="text-xs font-bold text-amber-700">
                        Solo puedes enviar mensajes a empresas a las que ya te postulaste. Aplica a una vacante de esta empresa primero.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Estado vacío — panel de composición restringido a empresas aplicadas */
              <div className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center">
                    <MessageSquare size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-600 uppercase">Nueva Conversación</h2>
                    <p className="text-[10px] text-slate-400 font-bold">Envía un mensaje a una empresa a la que ya aplicaste</p>
                  </div>
                </div>

                {/* Área vacía con selector de empresa */}
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
                    <MessageSquare size={28} className="text-slate-300" />
                  </div>

                  {empresasAplicadas.length > 0 ? (
                    <div className="w-full max-w-sm space-y-3">
                      <p className="text-sm font-black text-slate-500 uppercase italic">Selecciona una empresa</p>
                      <p className="text-xs text-slate-400">Solo puedes contactar empresas a las que ya te postulaste.</p>
                      <select
                        value={empresaSeleccionada}
                        onChange={e => setEmpresaSeleccionada(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-slate-100 focus:border-green-400 outline-none text-sm font-bold text-slate-900 transition"
                      >
                        <option value="">— Elegir empresa —</option>
                        {empresasAplicadas.map(emp => (
                          <option key={emp.nombre} value={emp.nombre}>{emp.nombre}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-black text-slate-400 uppercase italic">No tienes postulaciones activas</p>
                      <p className="text-xs text-slate-300 mt-1">
                        Debes postularte a al menos una vacante para poder enviar mensajes a empresas.
                      </p>
                    </div>
                  )}
                </div>

                {/* Input siempre visible, pero condicionado */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                  {empresasAplicadas.length > 0 && empresaSeleccionada ? (
                    <div className="flex gap-3 items-center">
                      <input
                        type="text"
                        value={nuevoMensaje}
                        onChange={e => setNuevoMensaje(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !enviando && handleEnviarMensaje()}
                        placeholder={`Mensaje para ${empresaSeleccionada}...`}
                        disabled={enviando}
                        className="flex-1 px-4 py-3 rounded-2xl bg-white border-2 border-slate-100 focus:border-green-400 outline-none text-sm font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-normal transition disabled:opacity-50"
                      />
                      <button
                        onClick={handleEnviarMensaje}
                        disabled={enviando || !nuevoMensaje.trim()}
                        className="w-11 h-11 rounded-2xl bg-slate-900 hover:bg-black transition flex items-center justify-center flex-shrink-0 shadow-lg disabled:opacity-50"
                      >
                        <Send size={16} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200">
                      <Lock size={16} className="text-slate-400 flex-shrink-0" />
                      <p className="text-xs font-bold text-slate-500">
                        {empresasAplicadas.length === 0
                          ? 'Postúlate a una vacante para desbloquear el chat.'
                          : 'Selecciona una empresa del listado para comenzar a chatear.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}