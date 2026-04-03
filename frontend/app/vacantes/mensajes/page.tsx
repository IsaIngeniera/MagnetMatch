'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '@/lib/api';
import { Send, MessageSquare, CheckCheck, Circle } from 'lucide-react';

// --- INTERFACES (alineadas con Mensaje.js) ---
interface Mensaje {
  id_mensaje: number;
  id_receptor: number;
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

export default function MensajesPage() {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [seleccionada, setSeleccionada] = useState<Conversacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMensajes = async () => {
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

        // Mantener seleccionada actualizada si ya había una
        if (seleccionada) {
          const actualizada = convs.find(c => c.asunto === seleccionada.asunto);
          if (actualizada) setSeleccionada(actualizada);
        } else if (convs.length > 0) {
          setSeleccionada(convs[0]);
        }
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error('Error cargando mensajes:', err.response?.data?.error || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMensajes();
  }, []);

  // Scroll al fondo cuando cambia la conversación seleccionada
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [seleccionada]);

  const handleSeleccionar = async (conv: Conversacion) => {
    setSeleccionada(conv);

    // Marcar como leídos los mensajes no leídos de esta conversación
    const noLeidos = conv.mensajes.filter(m => !m.leido);
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

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
            <div className="p-4 border-b border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversaciones</p>
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
                  <div>
                    <h2 className="text-sm font-black text-slate-800 uppercase">
                      Chat con: {seleccionada.asunto}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold">
                      {seleccionada.mensajes.length} mensaje{seleccionada.mensajes.length !== 1 ? 's' : ''}
                    </p>
                  </div>
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

                {/* Input enviar mensaje */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={nuevoMensaje}
                      onChange={e => setNuevoMensaje(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && nuevoMensaje.trim() && setNuevoMensaje('')}
                      placeholder="Enviar mensaje..."
                      className="flex-1 px-4 py-3 rounded-2xl bg-white border-2 border-slate-100 focus:border-green-400 outline-none text-sm font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-normal transition"
                    />
                    <button
                      onClick={() => nuevoMensaje.trim() && setNuevoMensaje('')}
                      className="w-11 h-11 rounded-2xl bg-slate-900 hover:bg-black transition flex items-center justify-center flex-shrink-0 shadow-lg"
                    >
                      <Send size={16} className="text-white" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Estado vacío */
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
                  <MessageSquare size={28} className="text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-400 uppercase italic">Selecciona una conversación</p>
                  <p className="text-xs text-slate-300 mt-1">Tus mensajes aparecerán aquí</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}