'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Menu from '@/components/Menu'
import Tickets from '@/components/Tickets'
import Reportes from '@/components/Reportes'
import Gestion from '@/components/Gestion'
import Gastos from '@/components/Gastos'
import Balance from '@/components/Balance'

export default function Home() {
  const [vista, setVista] = useState('menu')
  const [productos, setProductos] = useState<any[]>([])
  const [ventas, setVentas] = useState<any[]>([])
  const [gastos, setGastos] = useState<any[]>([])

  const cargarDatos = async () => {
    // ELIMINADO EL FILTRO .eq('activo', true) para que Gestión pueda ver los productos ocultos
    const { data: p } = await supabase.from('productos').select('*').order('nombre')
    
    const { data: v } = await supabase.from('ventas').select('*').order('creado_at', { ascending: false })
    const { data: g } = await supabase.from('gastos').select('*').order('created_at', { ascending: false })
    
    if (p) setProductos(p)
    if (v) setVentas([...v])
    if (g) setGastos([...g])
  }

  useEffect(() => { 
    cargarDatos() 
  }, [vista])

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans">
      <header className="bg-white shadow-md mb-4 sticky top-0 z-50 print:hidden text-center p-4">
        <h1 className="text-xl font-black text-orange-600 mb-2 uppercase tracking-tighter">SPINACH 🍱</h1>
        <div className="flex gap-2 overflow-x-auto pb-2 justify-start md:justify-center no-scrollbar">
          <button onClick={() => setVista('menu')} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase flex-shrink-0 ${vista === 'menu' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}>Vender 💰</button>
          <button onClick={() => setVista('gastos')} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase flex-shrink-0 ${vista === 'gastos' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'}`}>Gastos 💸</button>
          <button onClick={() => setVista('balance')} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase flex-shrink-0 ${vista === 'balance' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>Balance Semanal 📊</button>
          <button onClick={() => setVista('reporte')} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase flex-shrink-0 ${vista === 'reporte' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>Cierre 🖨️</button>
          <button onClick={() => setVista('historial')} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase flex-shrink-0 ${vista === 'historial' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>Tickets 🕒</button>
          <button onClick={() => setVista('admin')} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase flex-shrink-0 ${vista === 'admin' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'}`}>Gestión ⚙️</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-2">
        {/* Aquí pasamos la lista completa, el filtro se hace dentro de Menu */}
        {vista === 'menu' && <Menu productos={productos} ventas={ventas} alTerminar={cargarDatos} />}
        {vista === 'gastos' && <Gastos gastos={gastos} alTerminar={cargarDatos} />}
        {vista === 'balance' && <Balance ventas={ventas} gastos={gastos} />}
        {vista === 'reporte' && <Reportes ventas={ventas} gastos={gastos} />}
        {vista === 'historial' && <Tickets ventas={ventas} alTerminar={cargarDatos} />}
        {vista === 'admin' && <Gestion productos={productos} alTerminar={cargarDatos} />}
      </main>
    </div>
  )
}