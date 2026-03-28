'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { estilos } from './UI'
// IMPORTANTE: Importamos createClient para crear el cliente silencioso
import { createClient } from '@supabase/supabase-js'

export default function Personal() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({ 
    email: '', password: '', nombre: '', apellido: '', rol: 'cajero_auxiliar' 
  });

  // Creamos un cliente que NO guarda sesión en el navegador (PersistSession: false)
  // Esto evita que al crear un usuario se cierre tu sesión de Admin
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  )

  const cargarUsuarios = async () => {
    const { data } = await supabase.from('perfiles').select('*').order('nombre');
    if (data) setUsuarios(data);
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const crearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // USAMOS supabaseAdmin en lugar del supabase normal
    const { error } = await supabaseAdmin.auth.signUp({
      email: nuevoUsuario.email,
      password: nuevoUsuario.password,
      options: {
        data: { 
          nombre: nuevoUsuario.nombre, 
          apellido: nuevoUsuario.apellido, 
          rol: nuevoUsuario.rol 
        }
      }
    });

    if (error) return alert("Error: " + error.message);
    
    alert("¡Personal registrado con éxito! Ya puede iniciar sesión en su dispositivo.");
    
    setNuevoUsuario({ email: '', password: '', nombre: '', apellido: '', rol: 'cajero_auxiliar' });
    
    // Recargamos la lista con el cliente normal para ver al nuevo integrante
    setTimeout(() => {
      cargarUsuarios();
    }, 1500);
  };

  const eliminarUsuario = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${nombre}?`)) return;
    const { error } = await supabase.rpc('eliminar_usuario', { user_id: id });
    if (error) {
      alert("Error al eliminar: " + error.message);
    } else {
      alert("Usuario eliminado correctamente");
      cargarUsuarios();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div className={estilos.card}>
        <h2 className="text-xl font-bold text-purple-700 mb-4 uppercase tracking-tight">👤 Equipo Spinach</h2>
        <div className="grid gap-2">
          {usuarios.map((u) => (
            <div key={u.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="font-black text-gray-800 uppercase text-xs">{u.nombre} {u.apellido}</p>
                <p className={`text-[9px] font-bold uppercase ${
                  u.rol === 'subadmin' ? 'text-purple-600' : 
                  u.rol === 'cajero' ? 'text-blue-500' : 'text-green-600'
                }`}>
                  {u.rol === 'cajero_auxiliar' ? 'Cajero Auxiliar' : u.rol}
                </p>
              </div>
              
              {u.rol !== 'admin' && (
                <button 
                  onClick={() => eliminarUsuario(u.id, u.nombre)}
                  className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full transition-all shadow-sm"
                  title="Eliminar usuario"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <form className={estilos.formCard} onSubmit={crearUsuario}>
        <h2 className="text-xl font-black text-gray-700 mb-4 uppercase tracking-tighter">🆕 Agregar al Personal</h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input type="text" placeholder="NOMBRE" value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} className={estilos.input} required />
            <input type="text" placeholder="APELLIDO" value={nuevoUsuario.apellido} onChange={e => setNuevoUsuario({...nuevoUsuario, apellido: e.target.value})} className={estilos.input} required />
          </div>
          <input type="email" placeholder="EMAIL DE ACCESO" value={nuevoUsuario.email} onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} className={estilos.input} required />
          <input type="password" placeholder="CONTRASEÑA INICIAL" value={nuevoUsuario.password} onChange={e => setNuevoUsuario({...nuevoUsuario, password: e.target.value})} className={estilos.input} required />
          
          <select value={nuevoUsuario.rol} onChange={e => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})} className={estilos.input}>
            <option value="cajero_auxiliar">CAJERO AUXILIAR</option>
            <option value="cajero">CAJERO</option>
            <option value="subadmin">SUB-ADMIN</option>
          </select>

          <button className="w-full bg-purple-600 text-white font-black py-4 rounded-2xl uppercase shadow-lg hover:scale-[0.98] transition-all">
            DAR DE ALTA EN EL SISTEMA
          </button>
        </div>
      </form>
    </div>
  )
}