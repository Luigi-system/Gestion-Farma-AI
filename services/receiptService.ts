import { CompletedSaleInfo } from '../types';

export const generateReceiptHtml = (
    saleInfo: CompletedSaleInfo,
    docType: "boleta" | "factura" = "boleta"
): string => {
    const { saleData, details, clientName, totals } = saleInfo;
    const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`;
    const saleId = saleData.id;
    const title = docType === "factura" ? "Factura de Venta" : "Boleta de Venta";
    const docLabel = docType === "factura" ? "Factura" : "Boleta";

    return `
        <html>
        <head>
            <title>${title} N° ${saleId}</title>
            <style>
                @media print {
                    @page { size: 58mm auto; margin: 2mm; }
                    body { font-family: 'Courier New', monospace; font-size: 8pt; color: #000; }
                    .receipt { width: 100%; }
                    .center { text-align: center; }
                    .header { margin-bottom: 5px; }
                    .header h1 { font-size: 11pt; margin: 0; }
                    .header p { margin: 1px 0; font-size: 7pt; }
                    .item-table { width: 100%; border-collapse: collapse; font-size: 8pt; }
                    .item-table th, .item-table td { padding: 1mm 0; }
                    .item-table thead tr { border-bottom: 1px dashed #000; }
                    .item-table .desc { text-align: left; }
                    .item-table .qty, .item-table .price, .item-table .sub { text-align: right; }
                    .totals-table { width: 100%; margin-top: 5px; font-size: 9pt; }
                    .totals-table td { padding: 1px 0; }
                    .totals-table .label { text-align: left; }
                    .totals-table .value { text-align: right; }
                    .totals-table .total .value { font-weight: bold; }
                    .footer { margin-top: 5px; }
                    .qr-code { margin-top: 5px; }
                    .advice { margin-top: 5px; padding: 5px; border: 1px dashed #000; text-align: center; font-style: italic; font-size: 7pt; }
                    hr.dashed { border: none; border-top: 1px dashed #000; margin: 5px 0; }
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header center">
                    ${logoSvg}
                    <h1>GestionFarma</h1>
                    <p>RUC: 20123456789</p>
                    <p>Av. Principal 123, Lima, Perú</p>
                    <p>Cel: 987654321</p>
                </div>
                <hr class="dashed">
                <p>${docLabel} de Venta N°: ${saleId}</p>
                <p>Fecha: ${new Date(saleData.fecha_venta!).toLocaleString(
        "es-PE"
    )}</p>
                <p>Cliente: ${clientName}</p>
                <hr class="dashed">
                <table class="item-table">
                    <thead><tr><th class="desc">Producto</th><th class="qty">Cant</th><th class="sub">Total</th></tr></thead>
                    <tbody>
                        ${details
            .map(
                (item) => `
                            <tr>
                                <td class="desc">${item.isRedeemed
                        ? `(CANJE) ${item.producto_nombre}`
                        : item.producto_nombre
                    }</td>
                                <td class="qty">${item.cantidad}</td>
                                <td class="sub">S/${item.subtotal.toFixed(
                        2
                    )}</td>
                            </tr>
                        `
            )
            .join("")}
                    </tbody>
                </table>
                <hr class="dashed">
                <table class="totals-table">
                    <tr><td class="label">OP. GRAVADA:</td><td class="value">S/ ${totals.baseImponible.toFixed(
                2
            )}</td></tr>
                    <tr><td class="label">IGV (18%):</td><td class="value">S/ ${totals.igv.toFixed(
                2
            )}</td></tr>
                    <tr><td class="label">SUBTOTAL:</td><td class="value">S/ ${totals.subtotal.toFixed(
                2
            )}</td></tr>
                    <tr><td class="label">DESCUENTO:</td><td class="value">- S/ ${totals.totalDiscount.toFixed(
                2
            )}</td></tr>
                    ${totals.redondeo !== 0
                ? `<tr><td class="label">REDONDEO:</td><td class="value">S/ ${totals.redondeo.toFixed(
                    2
                )}</td></tr>`
                : ""
            }
                    <tr class="total"><td class="label">TOTAL A PAGAR:</td><td class="value">S/ ${totals.totalAPagar.toFixed(
                2
            )}</td></tr>
                </table>
                 <p>Tipo de Pago: ${saleData.tipo_pago}</p>
                ${saleData.consejo_ticket ? `<div class="advice">${saleData.consejo_ticket}</div>` : ''}
                <hr class="dashed">
                <div class="footer center">
                    <p>¡Gracias por su compra!</p>
                    <div class="qr-code">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                `Venta ID: ${saleId}`
            )}" alt="QR Code">
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
};
