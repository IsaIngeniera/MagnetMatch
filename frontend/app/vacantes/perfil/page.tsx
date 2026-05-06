'use client';

import React, { useState, useEffect } from 'react';
import {
  User, Phone, Briefcase, Edit2, Loader2, CheckCircle, Percent,
  X, Save, Tag, Plus, GraduationCap, Trophy, Trash2, FileText, Upload
} from 'lucide-react';
import { API_URL } from '@/lib/api';
import axios from 'axios';

// --- INTERFACES ---

interface Habilidad { id_habilidad: number; nombre: string; categoria: string; nivel?: string; anios_experiencia?: number; }

interface HabilidadSeleccionada { id_habilidad: number; nivel: string; anios_experiencia: number; unidad: 'años' | 'meses'; }

interface Experiencia { id_experiencia: number; empresa: string; cargo: string; fecha_inicio: string; fecha_fin?: string; descripcion_logros?: string; soporte_url?: string; }

interface Educacion { id_educacion: number; institucion: string; titulo: string; estado: 'en_curso' | 'completado' | 'abandonado'; fecha_fin?: string; soporte_url?: string; }

interface Logro { id_logro: number; titulo_logro: string; url_credencial?: string; verificado: boolean; }

type Modalidad = 'remoto' | 'híbrido' | 'presencial';

interface Aspirante {
  id_aspirante: number;
  email: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  expectativa_salarial?: number;
  modalidad_preferida?: Modalidad;
  porcentaje_completitud: number;
  fecha_registro?: string;
  cv_url?: string;
  habilidades?: Habilidad[];
  // ✅ HU-Actualizar Perfil: nuevos campos
  descripcion?: string;
  ubicacion?: string;
}

export default function PerfilPage() {
  const [aspirante, setAspirante] = useState<Aspirante | null>(null);
  const [cargando, setCargando] = useState(true);
  const [experiencias, setExperiencias] = useState<Experiencia[]>([]);
  const [educaciones, setEducaciones] = useState<Educacion[]>([]);
  const [logros, setLogros] = useState<Logro[]>([]);
  const [catalogoHabilidades, setCatalogoHabilidades] = useState<Habilidad[]>([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [tabActiva, setTabActiva] = useState<'datos' | 'exp' | 'edu' | 'logro'>('datos');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Formulario de Perfil Básico
  const [formDatos, setFormDatos] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    expectativa_salarial: '',
    modalidad_preferida: 'remoto' as Modalidad,
    descripcion: '',   // ← nuevo
    ubicacion: ''      // ← nuevo
  });

  const [nuevaHabilidadInput, setNuevaHabilidadInput] = useState('');

  const [habilidadesSeleccionadas, setHabilidadesSeleccionadas] = useState<HabilidadSeleccionada[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [subiendoCV, setSubiendoCV] = useState(false);

  const [eduFiles, setEduFiles] = useState<File[]>([]);
  const [modalHabilidad, setModalHabilidad] = useState<Habilidad | null>(null);
  const [formHabilidad, setFormHabilidad] = useState<{ nivel: string; anios_experiencia: number; unidad: 'años' | 'meses' }>({ nivel: 'básico', anios_experiencia: 0, unidad: 'años' });

  const [newExp, setNewExp] = useState({ empresa: '', cargo: '', fecha_inicio: '', fecha_fin: '', descripcion_logros: '' });
  const [newEdu, setNewEdu] = useState({ institucion: '', titulo: '', estado: 'completado' as Educacion['estado'], fecha_fin: '' });
  const [newLogro, setNewLogro] = useState({ titulo_logro: '', url_credencial: '' });

  const fetchData = async (updateForm: boolean = true) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/api/aspirantes/perfil/me`, config);
      const data = res.data.data as Aspirante;

      setAspirante(data);

      if (updateForm) {
        setFormDatos({
          nombres: data.nombres || '',
          apellidos: data.apellidos || '',
          telefono: data.telefono || '',
          expectativa_salarial: data.expectativa_salarial?.toString() || '',
          modalidad_preferida: data.modalidad_preferida || 'remoto',
          descripcion: data.descripcion || '',   // ← nuevo
          ubicacion: data.ubicacion || ''        // ← nuevo
        });

        setHabilidadesSeleccionadas(data.habilidades?.map((h: Habilidad) => ({
          id_habilidad: h.id_habilidad,
          nivel: h.nivel || 'básico',
          anios_experiencia: h.anios_experiencia ?? 0,
          unidad: 'años' as const
        })) || []);
      }


      if (data.id_aspirante) {
        const [rExp, rEdu, rLog] = await Promise.all([
          axios.get(`${API_URL}/api/aspirantes/${data.id_aspirante}/experiencia`, config),
          axios.get(`${API_URL}/api/aspirantes/${data.id_aspirante}/educacion`, config),
          axios.get(`${API_URL}/api/aspirantes/${data.id_aspirante}/logros`, config)
        ]);
        setExperiencias(rExp.data.data as Experiencia[]);
        setEducaciones(rEdu.data.data as Educacion[]);
        setLogros(rLog.data.data as Logro[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchData();
    axios.get(`${API_URL}/api/habilidades`).then(r => setCatalogoHabilidades(r.data.data.habilidades as Habilidad[]));
  }, []);

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' }) : 'Actualidad';

  const handleGuardarDatos = async () => {
    setGuardando(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const bodyDatos = {
        ...formDatos,
        expectativa_salarial: formDatos.expectativa_salarial === '' ? null : parseFloat(formDatos.expectativa_salarial)
      };
      await axios.put(`${API_URL}/api/aspirantes/perfil/me`, bodyDatos, config);

      const existingIds = aspirante?.habilidades?.map((h: Habilidad) => h.id_habilidad) || [];
      const toAdd = habilidadesSeleccionadas.filter(hs => !existingIds.includes(hs.id_habilidad));
      const toRemove = existingIds.filter((id: number) => !habilidadesSeleccionadas.find(hs => hs.id_habilidad === id));
      const toUpdate = habilidadesSeleccionadas.filter(hs => existingIds.includes(hs.id_habilidad));

      for (const hs of toAdd) {
        await axios.post(`${API_URL}/api/aspirantes/${aspirante?.id_aspirante}/habilidades`, {
          id_habilidad: hs.id_habilidad, nivel: hs.nivel, anios_experiencia: hs.anios_experiencia
        }, config);
      }
      for (const id_hab of toRemove) {
        await axios.delete(`${API_URL}/api/aspirantes/${aspirante?.id_aspirante}/habilidades/${id_hab}`, config);
      }
      for (const hs of toUpdate) {
        await axios.put(`${API_URL}/api/aspirantes/${aspirante?.id_aspirante}/habilidades/${hs.id_habilidad}`, {
          nivel: hs.nivel, anios_experiencia: hs.anios_experiencia
        }, config);
      }

      setMensaje('✅ Perfil guardado con éxito');
      fetchData(false);
    } catch (e) {
      setMensaje('❌ Error interno al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handleCVChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        alert('Solo se permiten archivos PDF');
        return;
      }
      setSubiendoCV(true);
      try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('cv', file);
        await axios.post(`${API_URL}/api/aspirantes/me/upload-cv`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        setMensaje('✅ CV subido con éxito');
        fetchData(false);
      } catch (err: any) {
        setMensaje('❌ Error al subir el CV');
      } finally {
        setSubiendoCV(false);
      }
    }
  };

  const handleAddExtra = async (tipo: 'exp' | 'edu' | 'logro') => {
    setGuardando(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      let url = `${API_URL}/api/aspirantes/${aspirante?.id_aspirante}/`;
      let payload: Record<string, unknown> = {};

      if (tipo === 'exp') {
        url += 'experiencia';
        payload = { ...newExp, fecha_fin: newExp.fecha_fin || null };
      } else if (tipo === 'edu') {
        url += 'educacion';
        payload = { ...newEdu, fecha_fin: newEdu.fecha_fin || null };
      } else {
        url += 'logros';
        payload = { ...newLogro, url_credencial: newLogro.url_credencial || null };
      }

      await axios.post(url, payload, config);
      setMensaje('✅ Registro agregado');
      fetchData(false);
      setNewExp({ empresa: '', cargo: '', fecha_inicio: '', fecha_fin: '', descripcion_logros: '' });
      setNewEdu({ institucion: '', titulo: '', estado: 'completado', fecha_fin: '' });
      setNewLogro({ titulo_logro: '', url_credencial: '' });
    } catch (e: any) {
      setMensaje('❌ Error al agregar');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarItem = async (ruta: string, id: number) => {
    if (!confirm('¿Eliminar registro?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/aspirantes/${aspirante?.id_aspirante}/${ruta}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData(false);
    } catch (e) {
      alert('Error al eliminar');
    }
  };

  const handleAgregarHabilidadPersonalizada = async () => {
    if (!nuevaHabilidadInput.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const existing = catalogoHabilidades.find(h => h.nombre.toLowerCase() === nuevaHabilidadInput.trim().toLowerCase());

      let habilidadObj = existing;

      if (!existing) {
        const res = await axios.post(`${API_URL}/api/habilidades`, { nombre: nuevaHabilidadInput.trim(), categoria: 'General' }, config);
        habilidadObj = res.data.data;
        setCatalogoHabilidades(prev => [...prev, habilidadObj as Habilidad]);
      }

      setModalHabilidad(habilidadObj as Habilidad);
      setFormHabilidad({ nivel: 'básico', anios_experiencia: 0, unidad: 'años' });
      setNuevaHabilidadInput('');
    } catch (e: any) {
      if (e.response?.status === 409) {
        alert('Esta habilidad ya existe en la lista o en la base de datos.');
      } else {
        console.error(e);
        alert('Error al agregar la habilidad');
      }
    }
  };

  const handleEliminarCV = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('¿Eliminar Hoja de Vida?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/aspirantes/perfil/me`, { cv_url: null }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      alert('Error al eliminar el CV');
    }
  };

  if (cargando) return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin text-green-500" size={48} /></div>;

  return (
    <>
      <div className="w-full max-w-5xl mx-auto space-y-6 p-4 md:p-8">

        {/* HEADER */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
            <div className="h-full bg-gradient-to-r from-[#00FF6A] to-[#00C94A] transition-all duration-1000" style={{ width: `${aspirante?.porcentaje_completitud || 0}%` }} />
          </div>
          <p className="absolute top-4 right-8 text-[10px] font-black text-slate-800 uppercase tracking-widest">Mi progreso del perfil · {aspirante?.porcentaje_completitud || 0}%</p>

          <div className="flex flex-col md:flex-row gap-8 items-center mt-2">
            <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center border-2 border-white shadow-md text-slate-300"><User size={48} /></div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Mi Perfil</p>
              <h1 className="text-3xl font-black text-slate-900 uppercase italic">{aspirante?.nombres} {aspirante?.apellidos}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                <span className="bg-slate-50 px-3 py-1 rounded-full text-xs font-bold text-slate-500 flex items-center gap-1"><Phone size={12} /> {aspirante?.telefono || 'Sin teléfono'}</span>
                {aspirante?.email && <span className="bg-slate-50 px-3 py-1 rounded-full text-xs font-bold text-slate-500">{aspirante.email}</span>}
                <span className="bg-green-50 px-3 py-1 rounded-full text-xs font-bold text-green-600 flex items-center gap-1"><Percent size={12} /> {aspirante?.porcentaje_completitud}% Completado</span>
              </div>

              {/* ✅ HU-Actualizar Perfil: mostrar descripción y ubicación */}
              {(aspirante?.descripcion || aspirante?.ubicacion) && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {aspirante?.ubicacion && (
                    <p style={{ margin: 0, fontSize: '14px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📍 <span>{aspirante.ubicacion}</span>
                    </p>
                  )}
                  {aspirante?.descripcion && (
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.6', maxWidth: '600px' }}>
                      {aspirante.descripcion}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto mt-4 md:mt-0">
              <button onClick={() => window.location.href = '/vacantes/inicio'} className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition shadow-md w-full"><span className="text-lg">🚀</span> POSTULARSE A VACANTES</button>
              <button onClick={() => setModalAbierto(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition shadow-lg w-full"><Edit2 size={18} /> GESTIONAR PERFIL</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            {/* HABILIDADES */}
            <section className="bg-white rounded-[32px] p-6 shadow-sm border-2 border-slate-200">
              <h3 className="text-xs font-black text-slate-700 mb-4 uppercase tracking-widest flex items-center gap-2"><Tag size={16} /> Habilidades</h3>
              {aspirante?.habilidades?.length ? (() => {
                const porCategoria = aspirante.habilidades!.reduce<Record<string, Habilidad[]>>((acc, h) => {
                  if (!acc[h.categoria]) acc[h.categoria] = [];
                  acc[h.categoria].push(h);
                  return acc;
                }, {});
                return (
                  <div className="space-y-3">
                    {Object.entries(porCategoria).map(([cat, habs]) => (
                      <div key={cat}>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">{cat}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {habs.map(h => (
                            <div key={h.id_habilidad} className="group/skill relative flex flex-col items-start px-3 py-1.5 bg-slate-100 rounded-lg gap-0.5">
                              <span className="text-[10px] font-bold uppercase text-slate-600">{h.nombre}</span>
                              <span className="text-[9px] font-semibold text-slate-400 uppercase">
                                {h.nivel}{h.anios_experiencia !== undefined ? ` · ${h.anios_experiencia} año${h.anios_experiencia === 1 ? '' : 's'}` : ''}
                              </span>
                              <button onClick={() => eliminarItem('habilidades', h.id_habilidad)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/skill:opacity-100 transition-opacity shadow-sm"><X size={10} /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })() : <p className="text-xs text-slate-400 italic">No has agregado habilidades</p>}
            </section>

            {/* LOGROS */}
            <section className="bg-white rounded-[32px] p-6 shadow-sm border-2 border-slate-200">
              <h3 className="text-xs font-black text-slate-700 mb-4 uppercase tracking-widest flex items-center gap-2"><Trophy size={16} /> Logros</h3>
              {logros.map(l => (
                <div key={l.id_logro} className="mb-4 last:mb-0 relative group">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1 pr-6">{l.titulo_logro} {l.verificado && <CheckCircle size={12} className="text-blue-500" />}</h4>
                  {l.url_credencial && <a href={l.url_credencial} target="_blank" className="text-[10px] text-blue-500 hover:underline">Ver Credencial</a>}
                  <button onClick={() => eliminarItem('logros', l.id_logro)} className="absolute right-0 top-0 p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14} /></button>
                </div>
              ))}
            </section>

            {/* DOCUMENTOS */}
            <section className="bg-white rounded-[32px] p-6 shadow-sm border-2 border-slate-200">
              <h3 className="text-xs font-black text-slate-700 mb-4 uppercase tracking-widest flex items-center gap-2"><FileText size={16} /> Mis Documentos</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hoja de Vida (CV)</h4>
                  {aspirante?.cv_url ? (
                    <div className="relative group">
                      <a href={`${API_URL}${aspirante.cv_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 pr-12 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition">
                        <div className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm"><FileText size={14} /></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-green-800 truncate">Mi_CV_Actualizado.pdf</p>
                        </div>
                      </a>
                      <button onClick={handleEliminarCV} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-red-100 text-red-500 hover:bg-red-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 shadow-sm transition"><Trash2 size={14} /></button>
                    </div>
                  ) : <p className="text-[10px] text-slate-400 font-bold italic bg-slate-50 p-2 rounded-lg text-center">No has subido tu CV</p>}
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* EXPERIENCIA */}
            <section className="bg-white rounded-[32px] p-8 shadow-sm border-2 border-slate-200">
              <h3 className="text-xs font-black text-slate-700 mb-6 uppercase tracking-widest flex items-center gap-2"><Briefcase size={18} /> Experiencia Laboral</h3>
              <div className="space-y-6 border-l-2 border-slate-100 pl-6">
                {experiencias.map(exp => (
                  <div key={exp.id_experiencia} className="relative group">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-4 border-green-500" />
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-slate-800 uppercase text-sm">{exp.cargo}</h4>
                        <p className="text-green-600 font-bold text-xs uppercase">{exp.empresa} <span className="text-slate-400 font-normal">| {formatDate(exp.fecha_inicio)} - {formatDate(exp.fecha_fin)}</span></p>
                      </div>
                      <button onClick={() => eliminarItem('experiencia', exp.id_experiencia)} className="text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                    </div>
                    {exp.descripcion_logros && <p className="mt-2 text-slate-500 text-sm leading-relaxed">{exp.descripcion_logros}</p>}
                  </div>
                ))}
              </div>
            </section>

            {/* EDUCACIÓN */}
            <section className="bg-white rounded-[32px] p-8 shadow-sm border-2 border-slate-200">
              <h3 className="text-xs font-black text-slate-700 mb-6 uppercase tracking-widest flex items-center gap-2"><GraduationCap size={18} /> Educación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {educaciones.map(edu => (
                  <div key={edu.id_educacion} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group relative">
                    <h4 className="font-black text-slate-800 text-xs uppercase">{edu.titulo}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{edu.institucion}</p>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-[9px] bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-500 uppercase">{edu.estado.replace('_', ' ')}</span>
                      <span className="text-[10px] font-bold text-slate-400">{formatDate(edu.fecha_fin)}</span>
                      <button onClick={() => eliminarItem('educacion', edu.id_educacion)} className="opacity-0 group-hover:opacity-100 text-red-300 transition-opacity"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* EXPECTATIVA SALARIAL */}
            <section className="bg-white rounded-[32px] p-8 shadow-sm border-2 border-slate-200">
              <h3 className="text-xs font-black text-slate-700 mb-6 uppercase tracking-widest flex items-center gap-2"><Briefcase size={18} /> Expectativa Salarial</h3>
              <div className="bg-green-50 p-6 rounded-3xl border border-green-100 flex items-center justify-center">
                <p className="text-2xl font-black text-green-600">
                  {aspirante?.expectativa_salarial ? `$ ${parseInt(aspirante.expectativa_salarial.toString()).toLocaleString('es-CO')} COP` : 'No especificada'}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* --- MODAL DE GESTIÓN --- */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800 uppercase italic">Gestionar Currículum</h2>
              <button onClick={() => { setModalAbierto(false); setMensaje(null); }} className="p-2 hover:bg-white rounded-full transition shadow-sm"><X size={20} /></button>
            </div>

            <div className="flex bg-slate-100 p-1 m-6 rounded-2xl">
              {(['datos', 'exp', 'edu', 'logro'] as const).map(t => (
                <button key={t} onClick={() => { setTabActiva(t); setMensaje(null); }} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition ${tabActiva === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
                  {t === 'datos' ? 'Datos Básicos' : t === 'exp' ? 'Experiencia' : t === 'edu' ? 'Educación' : 'Logros'}
                </button>
              ))}
            </div>

            <div className={`px-8 pb-8 overflow-y-auto space-y-6 transition-colors duration-300 ${
              tabActiva === 'datos' ? 'bg-blue-950/5' :
              tabActiva === 'exp'   ? 'bg-emerald-50' :
              tabActiva === 'edu'   ? 'bg-sky-50' :
              'bg-violet-50'
            }`}>
              {/* PESTAÑA DATOS */}
              {tabActiva === 'datos' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombres</label>
                      <input value={formDatos.nombres} onChange={e => setFormDatos({ ...formDatos, nombres: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-green-400 outline-none transition font-bold text-sm text-slate-900" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Apellidos</label>
                      <input value={formDatos.apellidos} onChange={e => setFormDatos({ ...formDatos, apellidos: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-green-400 outline-none transition font-bold text-sm text-slate-900" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Teléfono</label>
                      <input value={formDatos.telefono} onChange={e => setFormDatos({ ...formDatos, telefono: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-green-400 outline-none transition font-bold text-sm text-slate-900" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Expectativa Salarial</label>
                      <input type="number" value={formDatos.expectativa_salarial} onChange={e => setFormDatos({ ...formDatos, expectativa_salarial: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-green-400 outline-none transition font-bold text-sm text-slate-900" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Modalidad Preferida</label>
                      <select value={formDatos.modalidad_preferida} onChange={e => setFormDatos({ ...formDatos, modalidad_preferida: e.target.value as Modalidad })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-green-400 outline-none transition font-bold text-sm text-slate-900">
                        <option value="remoto">Remoto</option>
                        <option value="híbrido">Híbrido</option>
                        <option value="presencial">Presencial</option>
                      </select>
                    </div>
                  </div>

                  {/* ✅ HU-Actualizar Perfil: campos descripción y ubicación */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Ubicación</label>
                    <input
                      value={formDatos.ubicacion}
                      onChange={e => setFormDatos({ ...formDatos, ubicacion: e.target.value })}
                      placeholder="Ej: Medellín, Colombia"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-green-400 outline-none transition font-bold text-sm text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descripción Profesional</label>
                    <textarea
                      value={formDatos.descripcion}
                      onChange={e => setFormDatos({ ...formDatos, descripcion: e.target.value })}
                      placeholder="Cuéntanos sobre ti, tus fortalezas y objetivos profesionales..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-green-400 outline-none transition font-bold text-sm text-slate-900 resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Habilidades</label>
                    <p className="text-[10px] text-slate-400 ml-1 mb-2 italic">* Mínimo 3 habilidades requeridas para llegar al 100%.</p>

                    <div className="flex gap-2 mb-2">
                      <input
                        value={nuevaHabilidadInput}
                        onChange={e => setNuevaHabilidadInput(e.target.value)}
                        placeholder="Escribe una habilidad si no la ves abajo..."
                        className="flex-1 px-4 py-2 rounded-xl bg-slate-50 border-2 border-transparent focus:border-green-400 outline-none transition font-bold text-sm text-slate-900"
                      />
                      <button
                        onClick={handleAgregarHabilidadPersonalizada}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase hover:bg-black transition"
                      >
                        Añadir
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 max-h-40 overflow-y-auto">
                      {catalogoHabilidades.length > 0 ? catalogoHabilidades.map(h => {
                        const seleccionada = habilidadesSeleccionadas.find(hs => hs.id_habilidad === h.id_habilidad);
                        return (
                          <button
                            key={h.id_habilidad}
                            onClick={() => {
                              if (seleccionada) {
                                setHabilidadesSeleccionadas(prev => prev.filter(hs => hs.id_habilidad !== h.id_habilidad));
                              } else {
                                setModalHabilidad(h);
                                setFormHabilidad({ nivel: 'básico', anios_experiencia: 0, unidad: 'años' });
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${seleccionada ? 'bg-green-500 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}
                          >
                            {h.nombre}
                          </button>
                        );
                      }) : <span className="text-xs text-slate-400 italic p-2">Catálogo vacío, escribe tu habilidad arriba.</span>}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 mb-6">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><FileText size={16} /> Hoja de Vida (PDF)</h3>
                    <label htmlFor="cv-upload-input" className={`flex flex-col items-center justify-center gap-3 w-full rounded-2xl border-2 border-dashed p-6 cursor-pointer transition-colors ${subiendoCV ? 'border-green-400 bg-green-50 pointer-events-none' : 'border-slate-300 bg-slate-50 hover:border-green-400 hover:bg-green-50/40'}`}>
                      {subiendoCV ? <Loader2 size={28} className="text-green-500 animate-spin" /> : <Upload size={28} className="text-slate-400" />}
                      <p className="text-sm font-bold text-slate-800">{subiendoCV ? 'Subiendo...' : 'Selecciona tu CV'}</p>
                      <input id="cv-upload-input" type="file" accept=".pdf" onChange={handleCVChange} className="hidden" />
                    </label>
                  </div>

                  <button onClick={handleGuardarDatos} disabled={guardando} className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold uppercase text-xs flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl">
                    {guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar Datos y Habilidades
                  </button>
                </div>
              )}

              {/* PESTAÑAS EXTRAS (EXP, EDU, LOGRO) */}
              {tabActiva === 'exp' && (
                <div className="space-y-3">
                  <input placeholder="Empresa" value={newExp.empresa} onChange={e => setNewExp({ ...newExp, empresa: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm text-slate-900" />
                  <input placeholder="Cargo" value={newExp.cargo} onChange={e => setNewExp({ ...newExp, cargo: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm text-slate-900" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={newExp.fecha_inicio} onChange={e => setNewExp({ ...newExp, fecha_inicio: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm text-slate-900" />
                    <input type="date" value={newExp.fecha_fin} onChange={e => setNewExp({ ...newExp, fecha_fin: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm text-slate-900" />
                  </div>
                  <textarea placeholder="Descripción de logros" value={newExp.descripcion_logros} onChange={e => setNewExp({ ...newExp, descripcion_logros: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm text-slate-900 h-24" />
                  <button onClick={() => handleAddExtra('exp')} disabled={guardando} className="w-full py-3 bg-green-500 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                    {guardando ? <Loader2 size={16} /> : <Plus size={16} />} Registrar Experiencia
                  </button>
                </div>
              )}

              {tabActiva === 'edu' && (
                <div className="space-y-3">
                  <input placeholder="Institución" value={newEdu.institucion} onChange={e => setNewEdu({ ...newEdu, institucion: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm text-slate-900" />
                  <input placeholder="Título" value={newEdu.titulo} onChange={e => setNewEdu({ ...newEdu, titulo: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm text-slate-900" />
                  <select value={newEdu.estado} onChange={e => setNewEdu({ ...newEdu, estado: e.target.value as Educacion['estado'] })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm text-slate-900">
                    <option value="en_curso">En Curso</option>
                    <option value="completado">Completado</option>
                    <option value="abandonado">Abandonado</option>
                  </select>
                  <input type="date" value={newEdu.fecha_fin} onChange={e => setNewEdu({ ...newEdu, fecha_fin: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm text-slate-900" />
                  <button onClick={() => handleAddExtra('edu')} disabled={guardando} className="w-full py-3 bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                    {guardando ? <Loader2 size={16} /> : <Plus size={16} />} Registrar Educación
                  </button>
                </div>
              )}

              {tabActiva === 'logro' && (
                <div className="space-y-3">
                  <input placeholder="Título del Logro" value={newLogro.titulo_logro} onChange={e => setNewLogro({ ...newLogro, titulo_logro: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm text-slate-900" />
                  <input placeholder="URL Credencial" value={newLogro.url_credencial} onChange={e => setNewLogro({ ...newLogro, url_credencial: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm text-slate-900" />
                  <button onClick={() => handleAddExtra('logro')} disabled={guardando} className="w-full py-3 bg-purple-500 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                    {guardando ? <Loader2 size={16} /> : <Plus size={16} />} Registrar Logro
                  </button>
                </div>
              )}

              {mensaje && <p className={`text-center text-xs font-bold ${mensaje.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>{mensaje}</p>}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL POPUP HABILIDAD --- */}
      {modalHabilidad && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 space-y-5">
            <h3 className="text-base font-black text-slate-800 uppercase">{modalHabilidad.nombre}</h3>
            <select value={formHabilidad.nivel} onChange={e => setFormHabilidad(f => ({ ...f, nivel: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-green-400 outline-none transition font-bold text-sm text-slate-900">
              <option value="básico">Básico</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
              <option value="experto">Experto</option>
            </select>
            <div className="flex gap-2">
              <input type="number" placeholder="Tiempo" onChange={e => setFormHabilidad(f => ({ ...f, anios_experiencia: parseInt(e.target.value) || 0 }))} className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm" />
              <select onChange={e => setFormHabilidad(f => ({ ...f, unidad: e.target.value as 'años' | 'meses' }))} className="px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm">
                <option value="años">Años</option>
                <option value="meses">Meses</option>
              </select>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setModalHabilidad(null)} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-500 font-bold text-xs uppercase hover:bg-slate-50 transition">Cancelar</button>
              <button onClick={() => {
                setHabilidadesSeleccionadas(prev => [...prev, { id_habilidad: modalHabilidad.id_habilidad, nivel: formHabilidad.nivel, anios_experiencia: formHabilidad.anios_experiencia, unidad: formHabilidad.unidad }]);
                setModalHabilidad(null);
              }} className="flex-1 py-3 rounded-xl bg-green-500 text-white font-black text-xs uppercase">Añadir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}