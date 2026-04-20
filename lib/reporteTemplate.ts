export const getReporteHTML = (fecha: string, nombreCajero: string, data: any) => {
  const { listaPrincipales, listaExtras, metodos, totales, fechaFormateada } = data;

  // Actualizamos la función para incluir el cálculo del precio unitario
  const generarFilas = (items: any[]) => items.map(item => {
    const precioUnitario = item.total / item.cantidad;
    return `
      <tr>
        <td style="width: 45%;">${item.nombre}</td>
        <td style="width: 15%; text-align: center;">${item.cantidad}</td>
        <td style="width: 20%; text-align: center;">Bs ${precioUnitario.toFixed(2)}</td>
        <td style="width: 20%; text-align: right;">Bs ${item.total.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  return `
    <html>
      <head>
        <title>Reporte Spinach</title>
        <style>
          @page { 
            size: auto; 
            margin: 0mm; 
          }
          
          @media print {
            body { margin: 10mm; }
          }

          html, body { height: 100%; margin: 0; padding: 0; }
          body { font-family: 'Helvetica', sans-serif; color: #333; line-height: 1.2; font-size: 11px; display: flex; flex-direction: column; }
          
          .wrapper { padding: 20px; flex: 1 0 auto; }
          
          .header { text-align: center; border-bottom: 2px solid #15803d; padding-bottom: 5px; margin-bottom: 15px; }
          .header h1 { margin: 0; color: #15803d; text-transform: uppercase; letter-spacing: 2px; font-size: 30px; }
          
          .info-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-weight: bold; background: #f4f4f4; padding: 5px 10px; border-radius: 4px; }
          
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px; }
          .stat-box { padding: 15px; border-radius: 15px; border: 3px solid #eee; text-align: center; }
          .stat-box small { font-size: 15px; font-weight: 900; text-transform: uppercase; color: green; display: block; }
          .stat-box p { margin: 2px 0 0 0; font-size: 18px; font-weight: bold; }

          .section-title { font-size: 9px; font-weight: 900; color: #15803d; text-transform: uppercase; margin: 10px 0 5px 0; border-left: 3px solid #15803d; padding-left: 5px; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; table-layout: fixed; }
          th { text-align: left; padding: 6px 8px; border-bottom: 1px solid #333; font-size: 9px; color: #666; }
          td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; text-transform: uppercase; }

          .totales-area { margin-left: auto; width: 220px; margin-top: 10px; }
          .total-item { display: flex; justify-content: space-between; padding: 2px 0; font-size: 15px;}
          .total-final { display: flex; justify-content: space-between; padding: 8px 0; color: black; border-radius: 4px; font-size: 17px; }
          
          .footer-wrapper { flex-shrink: 0; padding: 20px; width: 100%; box-sizing: border-box; }
          .firma-container { display: flex; justify-content: center; margin-bottom: 15px; }
          .firma-box { width: 200px; border-top: 1px solid #333; text-align: center; padding-top: 5px; }
          .firma-box p { margin: 0; font-size: 10px; font-weight: bold; text-transform: uppercase; }
          .footer-digital { text-align: center; font-size: 9px; color: #bbb; border-top: 1px dotted #eee; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header"><h1>SPINACH 🍱</h1><p>REPORTE DE CIERRE DIARIO</p></div>
          <div class="info-row">
            <span>FECHA: ${fechaFormateada.toUpperCase()}</span> 
            <span>CIERRE: #00${fecha.replace(/-/g, '')}</span> 
          </div>

          <div style="margin-bottom: 10px;">
            <strong>RESPONSABLE:</strong> <span style="text-transform: uppercase;">${nombreCajero}</span> 
          </div>

          <div class="stats-grid">
            <div class="stat-box"><small>Efectivo</small><p>Bs ${metodos.ef.toFixed(2)}</p></div> 
            <div class="stat-box"><small>QR / Transf.</small><p>Bs ${metodos.qr.toFixed(2)}</p></div> 
            <div class="stat-box"><small>PedidosYa</small><p>Bs ${metodos.pya.toFixed(2)}</p></div> 
          </div>

          <div class="section-title">Ventas Principales</div> 
          <table>
            <thead>
              <tr>
                <th style="width: 45%;">Producto</th>
                <th style="width: 15%; text-align: center;">Cant.</th>
                <th style="width: 20%; text-align: center;">P. Unit.</th>
                <th style="width: 20%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>${generarFilas(listaPrincipales)}</tbody> 
          </table>

          ${listaExtras.length > 0 ? `
            <div class="section-title">Extras y Adicionales</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 45%;">Producto</th>
                  <th style="width: 15%; text-align: center;">Cant.</th>
                  <th style="width: 20%; text-align: center;">P. Unit.</th>
                  <th style="width: 20%; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>${generarFilas(listaExtras)}</tbody>
            </table> 
          ` : ''}

          <div class="totales-area">
            <div class="total-item"><span>Ventas Brutas:</span><span>Bs ${totales.totalVentas.toFixed(2)}</span></div> 
            <div class="total-item" style="color: #b91c1c;"><span>Gastos:</span><span>-Bs ${totales.totalGastos.toFixed(2)}</span></div> 
            <div class="total-final"><span>EFECTIVO NETO:</span><span>Bs${totales.efectivoNeto.toFixed(2)}</span></div> 
          </div>
        </div>

        <div class="footer-wrapper">
          <div class="firma-container">
            <div class="firma-box">
              <p>${nombreCajero}</p> 
              <small style="color: #999; font-size: 8px;">Firma autorizada</small>
            </div>
          </div>
          <div class="footer-digital">Spinach POS — ${new Date().toLocaleString('es-BO')}</div> 
        </div>
        <script>
          window.onload = () => { 
            window.print(); 
            setTimeout(() => { window.close(); }, 500); 
          }
        </script>
      </body>
    </html>
  `;
};
