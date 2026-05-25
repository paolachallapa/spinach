'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Menu from '@/components/Menu'
import Tickets from '@/components/Tickets'
import Reportes from '@/components/Reportes'
import Gestion from '@/components/Gestion'
import Gastos from '@/components/Gastos/Gastos'
import Balance from '@/components/Balance'
import Personal from '@/components/Personal'
import LoginPage from './login/page'
import PanelPedidosYa from '@/components/PanelPedidosYa'
import ModalPassword from '@/components/ui/ModalPassword'

export default function Home() {
  const [vista, setVista] = useState('menu')
  const [productos, setProductos] = useState<any[]>([])
  const [ventas, setVentas] = useState<any[]>([])
  const [gastos, setGastos] = useState<any[]>([])
  
  const [sesion, setSesion] = useState<any>(null)
  const [perfil, setPerfil] = useState<any>(null)
  const [cargando, setCargando] = useState(true)

  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false)

  // Carga masiva optimizada para el flujo de trabajo diario (últimos 90 días)
  const cargarDatos = async () => {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 90);
    // Usamos formato limpio para evitar errores de comparación de texto en Supabase
    const inicio90Dias = fechaLimite.toISOString().substring(0, 10) + " 00:00:00";

    const [resProductos, resVentas, resGastos] = await Promise.all([
      supabase.from('productos').select('*').order('nombre'),
      supabase.from('ventas')
        .select('*')
        .gte('creado_at', inicio90Dias)
        .order('creado_at', { ascending: false })
        .limit(5000), 
      supabase.from('gastos')
        .select('*')
        .gte('created_at', inicio90Dias)
        .order('created_at', { ascending: false })
        .limit(2000)
    ]);
    
    if (resProductos.data) setProductos(resProductos.data)
    if (resVentas.data) setVentas([...resVentas.data])
    if (resGastos.data) setGastos([...resGastos.data])
  }

  const cambiarPassword = () => {
    setModalPasswordAbierto(true)
  }

  const confirmarCambioClave = async (nuevaClave: string) => {
    const { error } = await supabase.auth.updateUser({ password: nuevaClave })
    if (error) {
      alert("Error: " + error.message)
    } else {
      alert("¡Contraseña actualizada correctamente!")
      setModalPasswordAbierto(false)
    }
  }

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSesion(session)
      
      if (session) {
        const { data } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setPerfil(data)
        await cargarDatos()
      }
      setCargando(false)
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session)
      if (!session) setPerfil(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (cargando) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center animate-pulse">
          <h1 className="text-2xl font-black text-green-600 italic">SPINACH 🍱</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verificando Credenciales...</p>
        </div>
      </div>
    )
  }

  if (!sesion) {
    return <LoginPage />
  }

  const ventasValidas = ventas.filter((v: any) => v.estado !== 'anulado');

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans">
      <ModalPassword 
        isOpen={modalPasswordAbierto}
        onClose={() => setModalPasswordAbierto(false)}
        onConfirm={confirmarCambioClave}
      />

      <header className="bg-white shadow-md mb-4 sticky top-0 z-50 print:hidden text-center p-4">
        <div className="flex justify-between items-center max-w-5xl mx-auto mb-2">
            <h1 className="text-xl font-black text-orange-600 uppercase tracking-tighter">SPINACH 🍱</h1>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-[9px] font-black text-gray-400 uppercase leading-none">{perfil?.nombre || 'Usuario'}</p>
                <p className="text-[10px] font-bold text-green-600 uppercase leading-tight">{perfil?.rol || 'Personal'}</p>
                <button 
                  onClick={cambiarPassword}
                  className="text-[8px] font-black text-blue-500 uppercase hover:underline block ml-auto"
                >
                  Cambiar Clave 🔑
                </button>
              </div>
              <button 
                onClick={cerrarSesion}
                className="px-3 py-1 rounded-full text-[9px] font-black uppercase border-2 border-red-100 text-red-500 hover:bg-red-50 transition-all"
              >
                Salir 🚪
              </button>
            </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 justify-start md:justify-center no-scrollbar">
          <button onClick={() => setVista('menu')} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase flex-shrink-0 ${vista === 'menu' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}>Vender 💰</button>
          
          {perfil?.rol === 'admin' && (
            <button onClick={() => setVista('pya')} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase flex-shrink-0 ${vista === 'pya' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-gray-100 text-gray-500'}`}>Pedidos Ya 🛵</button>
          )}

          {(perfil?.rol === 'admin' || perfil?.rol === 'subadmin') && (
            <>
              <button onClick={() => setVista('gastos')} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase flex-shrink-0 ${vista === 'gastos' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'}`}>Gastos 💸</button>
              <button onClick={() => setVista('balance')} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase flex-shrink-0 ${vista === 'balance' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>Balance 📊</button>
            </>
          )}
          
          <button onClick={() => setVista('reporte')} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase flex-shrink-0 ${vista === 'reporte' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>Cierre 🖨️</button>
          <button onClick={() => setVista('historial')} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase flex-shrink-0 ${vista === 'historial' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>Tickets 🕒</button>
          
          <button onClick={() => setVista('admin')} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase flex-shrink-0 ${vista === 'admin' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'}`}>Gestión ⚙️</button>

          {perfil?.rol === 'admin' && (
            <button onClick={() => setVista('personal')} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase flex-shrink-0 ${vista === 'personal' ? 'bg-indigo-700 text-white' : 'bg-gray-100 text-gray-500'}`}>Personal 👤</button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-2">
        {vista === 'menu' && <Menu productos={productos} ventas={ventasValidas} alTerminar={cargarDatos} />}
        {vista === 'pya' && perfil?.rol === 'admin' && <PanelPedidosYa ventas={ventasValidas} alTerminar={cargarDatos} />}
        {vista === 'gastos' && (perfil?.rol === 'admin' || perfil?.rol === 'subadmin') && <Gastos gastos={gastos} alTerminar={cargarDatos} />}
        
        {/* ENVIAMOS VENTAS COMPLETAS Y GASTOS COMPLETOS MAPEADOS PARA EL COMPONENTE DE BALANCE */}
        {vista === 'balance' && (perfil?.rol === 'admin' || perfil?.rol === 'subadmin') && (
          <Balance 
            ventas={ventasValidas} 
            gastos={gastos} 
            alTerminar={cargarDatos} 
            supabase={supabase} 
          />
        )}
        
        {vista === 'reporte' && <Reportes ventas={ventasValidas} gastos={gastos} productos={productos} />}
        {vista === 'historial' && <Tickets ventas={ventas} alTerminar={cargarDatos} perfilUsuario={perfil} />}
        {vista === 'admin' && <Gestion productos={productos} alTerminar={cargarDatos} />}
        {vista === 'personal' && perfil?.rol === 'admin' && <Personal />}
      </main>
    </div>
  )
}
