import { estilosTicket } from '@/components/UI';

export const printer = {
  imprimirTicket(nom: string, items: any[], total: number, n: string) {
    const win = window.open('', '', 'width=400,height=600');
    if (!win) return;
    
    win.document.title = "Ticket - Manhattan";
    const fechaActual = new Date().toLocaleString('es-BO');
    
    win.document.write(`
      <html>
        <head><style>${estilosTicket}</style></head>
        <body>
          <div class="text-center header">
            <h2>MANHATTAN 🍱</h2>
            <small>${fechaActual}</small>
          </div>
          <div class="linea"></div>
          <div style="font-size: 12px"><b>CLIENTE:</b> ${nom.toUpperCase()}</div>
          <div class="linea"></div>
          ${items.map(i => `
            <div class="item">
              <span>${i.cantidad}x ${i.nombre}</span> 
              <span>Bs${(i.precio * i.cantidad).toFixed(2)}</span>
            </div>
          `).join('')}
          ${n ? `<div class="nota-caja">NOTAS: ${n.toUpperCase()}</div>` : ''}
          <div class="linea"></div>
          <div class="total"><span>TOTAL:</span> <span>Bs ${total.toFixed(2)}</span></div>
          <div class="text-center" style="margin-top: 20px;"><small>¡Gracias!</small></div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  }
};