import { estilosTicket } from '@/components/UI';


export const printer = {

  imprimirTicket(nom: string, items: any[], total: number, n: string, nro?: string, metodo?: string, horaVenta?: string) {
    const win = window.open('', '', 'width=400,height=600');
    if (!win) return;
    
    win.document.title = "Ticket - Spinach";
    const fechaImpresion = new Date().toLocaleString('es-BO');

    const nombresMetodo: any = {
      'qr': 'QR / TRANSFERENCIA',
      'ef': 'EFECTIVO',
      'pya': 'PEDIDOSYA'
    };

   
    const notaLimpia = n?.toUpperCase().includes("HORA:") && n.length < 20 ? "" : n;
    
    win.document.write(`
      <html>
        <head><style>${estilosTicket}</style></head>
        <body>
          <div class="text-center header">
            <h2>SPINACH 🍱</h2>
            <small>${fechaImpresion}</small>
          </div>
          <div class="linea"></div>
          
          <div style="font-size: 25px"><b>C/MESA:</b> ${nom.toUpperCase()}</div>
          
          ${horaVenta ? `
            <div style="font-size: 13px; margin-top: 2px;">
              <b>HORA VENTA:</b> ${horaVenta}
            </div>
          ` : ''}

          <div class="linea"></div>
          
          ${items.map(i => `
            <div class="item" style="font-size: 25px">
              <span>${i.cantidad}x ${i.nombre}</span> 
              <span>Bs${(i.precio * i.cantidad).toFixed(2)}</span>
            </div>
          `).join('')}

          ${notaLimpia ? `
            <div style="margin-top: 5px; padding: 10px; border: 1px dashed #ccc; font-size: 20px;">
              <b>NOTAS:</b> ${notaLimpia.toUpperCase()}
            </div>
          ` : ''}

          <div class="linea"></div>
          
          <div class="total">
            <span>TOTAL:</span> 
            <span>Bs ${total.toFixed(2)}</span>
          </div>

          <div style="margin-top: 5px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
            PAGO: ${metodo ? nombresMetodo[metodo] : 'EFECTIVO'}
          </div>

          <div style="margin-top: 15px; display: flex; justify-content: flex-start;">
            <div style="font-size: 25px; font-weight: 900; border: 2px solid black; padding: 4px 8px; text-transform: uppercase;">
              ${nro ? nro : 'ORDEN: #--'}
            </div>
          </div>

          <div class="text-center" style="margin-top: 20px;"><small>¡Gracias!</small></div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  }
};