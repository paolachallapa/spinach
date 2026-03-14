import { estilosTicket } from '@/components/UI';

export const printer = {
  imprimirTicket(nom: string, items: any[], total: number, n: string, nro?: string) {
    const win = window.open('', '', 'width=400,height=600');
    if (!win) return;
    
    win.document.title = "Ticket - Spinach";
    const fechaActual = new Date().toLocaleString('es-BO');
    
    win.document.write(`
      <html>
        <head><style>${estilosTicket}</style></head>
        <body>
          <div class="text-center header">
            <h2>SPINACH 🍱</h2>
            <small>${fechaActual}</small>
          </div>
          <div class="linea"></div>
          <div style="font-size: 15px"><b>CLIENTE:</b> ${nom.toUpperCase()}</div>
          <div class="linea"></div>
          
          ${items.map(i => `
            <div class="item">
              <span>${i.cantidad}x ${i.nombre}</span> 
              <span>Bs${(i.precio * i.cantidad).toFixed(2)}</span>
            </div>
          `).join('')}

          ${n ? `
            <div style="margin-top: 5px; padding: 10px; border: 1px dashed #ccc; font-size: 20px;">
              <b>NOTAS:</b> ${n.toUpperCase()}
            </div>
          ` : ''}

          <div class="linea"></div>
          
          <div class="total">
            <span>TOTAL:</span> 
            <span>Bs ${total.toFixed(2)}</span>
          </div>

          <div style="margin-top: 15px; display: flex; justify-content: flex-start;">
            <div style="font-size: 14px; font-weight: 900; border: 2px solid black; padding: 4px 8px; text-transform: uppercase;">
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