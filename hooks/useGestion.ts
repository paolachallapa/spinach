import { useState } from 'react'
import { api } from '@/lib/api'

export function useGestion(alTerminar: () => void) {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [esALaCarta, setEsALaCarta] = useState(false);
  const [esExtra, setEsExtra] = useState(false); 
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [modalStock, setModalStock] = useState({ abierto: false, id: '', nombre: '', actual: 0 });
  const [modalBorrar, setModalBorrar] = useState({ abierto: false, id: '', nombre: '' });

  const prepararEdicion = (p: any) => {
    setEditandoId(p.id);
    // Agregamos valores por defecto ('') para evitar errores de inputs controlados
    setNombre(p.nombre || '');
    setPrecio(p.precio?.toString() || '0');
    setStock(p.stock?.toString() || '0');
    setEsALaCarta(!!p.es_a_la_carta); // Forzamos a booleano
    setEsExtra(!!p.es_extra);         // Forzamos a booleano
    
    // Scroll suave hacia el formulario
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const limpiarFormulario = () => {
    setNombre(''); 
    setPrecio(''); 
    setStock(''); 
    setEsALaCarta(false); 
    setEsExtra(false);
    setEditandoId(null);
  };

  const ejecutarAccionRapida = async (p: any, metodoApi: Function, ...args: any[]) => {
    const res = await metodoApi(p.id, ...args);
    if (!res.error) alTerminar();
    else alert("Error al sincronizar");
  };

  const confirmarSumaStock = async (cantidadASumar: number) => {
    const res = await api.sumarStock(modalStock.id, modalStock.actual, cantidadASumar);
    if (!res.error) {
      setModalStock({ ...modalStock, abierto: false });
      alTerminar();
    }
  };

  const confirmarBorrado = async () => {
    const res = await api.archivarProducto(modalBorrar.id);
    if (!res.error) {
      setModalBorrar({ ...modalBorrar, abierto: false });
      alTerminar();
    }
  };

  const guardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      nombre, 
      precio: Number(precio), 
      stock: Number(stock), 
      es_a_la_carta: esALaCarta,
      es_extra: esExtra 
    };
    
    const res = editandoId 
      ? await api.editarProducto(editandoId, payload) 
      : await api.crearProducto(payload);

    if (!res.error) {
      limpiarFormulario();
      alTerminar();
    }
  };

  return {
    nombre, setNombre, precio, setPrecio, stock, setStock, 
    esALaCarta, setEsALaCarta, 
    esExtra, setEsExtra,
    editandoId, setEditandoId, modalStock, setModalStock, modalBorrar, setModalBorrar,
    prepararEdicion, ejecutarAccionRapida, confirmarSumaStock, confirmarBorrado, 
    guardarProducto, limpiarFormulario
  };
}