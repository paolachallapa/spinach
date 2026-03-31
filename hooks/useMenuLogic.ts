'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'

export const useMenuLogic = (alTerminar: any) => {
  const [cliente, setCliente] = useState('')
  const [notas, setNotas] = useState('')
  const [carrito, setCarrito] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [datosParaImprimir, setDatosParaImprimir] = useState<any>(null)

  const gestionarCarrito = (p: any, accion: 'sumar' | 'restar') => {
    const existe = carrito.find(item => item.id === p.id);
    if (accion === 'sumar') {
      if (p.stock <= (existe?.cantidad || 0)) return alert("¡Sin stock!");
      if (existe) {
        setCarrito(carrito.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      } else {
        setCarrito([...carrito, { ...p, cantidad: 1 }]);
      }
    } else {
      if (!existe) return;
      if (existe.cantidad > 1) {
        setCarrito(carrito.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad - 1 } : i));
      } else {
        setCarrito(carrito.filter(i => i.id !== p.id));
      }
    }
  };

  /**
   * PASO 1: Solo abre el modal y prepara los datos.
   * NO guarda en la base de datos aún.
   */
  const solicitarConfirmacion = (metodo: string) => {
    if (!cliente.trim() || carrito.length === 0) {
      return alert("Por favor, ingresa la MESA y agrega productos.");
    }
    
    const totalPedido = carrito.reduce((a, b) => a + (b.precio * b.cantidad), 0);
    
    setDatosParaImprimir({
      cliente: cliente,
      carrito: [...carrito],
      total: totalPedido,
      notas: notas,
      metodo: metodo
    });

    setShowModal(true);
  };

  /**
   * PASO 2: Realiza el registro real en Supabase.
   * Se ejecuta solo al dar "SÍ" en el modal.
   */
  const ejecutarRegistroDB = async () => {
    try {
      const { error } = await api.registrarPedido(
        datosParaImprimir.cliente, 
        datosParaImprimir.carrito, 
        datosParaImprimir.notas, 
        datosParaImprimir.metodo
      );
      
      if (!error) {
        // Obtenemos el número de pedido para el ticket
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const hoyISO = hoy.toISOString();

        const { data: vHoy } = await supabase
          .from('ventas')
          .select('creado_at')
          .gte('creado_at', hoyISO);
        
        const nroPedido = new Set(vHoy?.map(v => v.creado_at)).size;
        
        return { ...datosParaImprimir, nro: `#${nroPedido}` };
      } else { 
        alert("Error al guardar en base de datos"); 
        return null;
      }
    } catch (err) { 
      console.error(err);
      alert("Error de conexión"); 
      return null;
    }
  };

  /**
   * FUNCIÓN PARA LA "X": 
   * Solo cierra el modal. La venta NO se registra.
   */
  const cerrarSinRegistrar = () => {
    setShowModal(false);
    setDatosParaImprimir(null);
  };

  /**
   * LIMPIEZA FINAL:
   * Se ejecuta después de un registro exitoso.
   */
  const finalizarLimpiarTodo = () => {
    setShowModal(false);
    setCarrito([]); 
    setCliente(''); 
    setNotas('');
    setDatosParaImprimir(null);
    if (alTerminar) alTerminar();
  };

  return {
    cliente, setCliente, 
    notas, setNotas, 
    carrito, 
    gestionarCarrito, 
    solicitarConfirmacion, // Usar este en lugar de handleConfirmar
    ejecutarRegistroDB,     // Usar este dentro del "SÍ" del modal
    showModal, 
    datosParaImprimir, 
    finalizarLimpiarTodo,
    cerrarSinRegistrar 
  };
};
