'use client'
import { useState } from 'react' 
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'

export const useMenuLogic = (alTerminar: any, perfilUsuario: any) => {
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
      metodo: metodo,
      cajero: perfilUsuario 
        ? `${perfilUsuario.nombre} ${perfilUsuario.apellido || ''}`.trim() 
        : 'Personal de Turno'
    });

    setShowModal(true);
  };

  /**
   * EJECUTAR REGISTRO DB
   * Recibe el método de pago y los montos desglosados (pago_ef, pago_qr)
   * para cumplir con los 7 argumentos requeridos por api.registrarPedido.
   */
  const ejecutarRegistroDB = async (metodo: string, montos: { pago_ef: number, pago_qr: number }) => {
    try {
      // Sincronización con la API: enviamos los 7 argumentos esperados
      const { error } = await api.registrarPedido(
        datosParaImprimir.cliente,   // 1. Mesa/Cliente
        datosParaImprimir.carrito,   // 2. Productos
        datosParaImprimir.notas,     // 3. Observaciones
        metodo,                      // 4. Método (ef, qr, mix, pya)
        datosParaImprimir.cajero,    // 5. Responsable
        montos.pago_ef,              // 6. Monto en efectivo
        montos.pago_qr               // 7. Monto en QR
      );
      
      if (!error) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const hoyISO = hoy.toISOString();

        // Cálculo del número de pedido correlativo para el día
        const { data: vHoy } = await supabase
          .from('ventas')
          .select('creado_at')
          .gte('creado_at', hoyISO);
        
        const nroPedido = new Set(vHoy?.map(v => v.creado_at)).size;
        
        return { ...datosParaImprimir, nro: `#${nroPedido}`, metodo };
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

  const cerrarSinRegistrar = () => {
    setShowModal(false);
    setDatosParaImprimir(null);
  };

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
    solicitarConfirmacion, 
    ejecutarRegistroDB,     
    showModal, 
    datosParaImprimir, 
    finalizarLimpiarTodo,
    cerrarSinRegistrar 
  };
};
