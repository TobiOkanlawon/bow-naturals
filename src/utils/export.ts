import { type Order, formatNaira } from '../data/store';

// CSV Export
export function exportCSV(orders: Order[], filename: string = 'orders') {
  const headers = ['S/N', 'Customer', 'Phone', 'WhatsApp', 'Address', 'City', 'State', 'Products', 'Qty', 'Deal Type', 'Order Date', 'Expected Delivery', 'Status', 'Payment', 'Amount Paid', 'Total Amount', 'Notes'];
  const rows = orders.map(o => [
    o.serialNumber,
    o.customerName,
    o.phoneNumber,
    o.whatsappNumber,
    o.deliveryAddress,
    o.city,
    o.state,
    o.items.map(i => `${i.productName}(${i.quantity})`).join('; '),
    o.items.reduce((s, i) => s + i.quantity, 0),
    o.dealType,
    o.orderDate,
    o.expectedDeliveryDate,
    o.orderStatus,
    o.paymentStatus,
    o.amountPaid,
    o.totalAmount,
    o.notes,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
  downloadFile(csv, `${filename}.csv`, 'text/csv');
}

// PDF Export using a printable HTML
export function exportPDF(title: string, elementId: string) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;color:#333}
    h1{font-size:18px;margin-bottom:10px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
    th{background:#f5f5f5;font-weight:600}
    .stat-card{display:inline-block;padding:12px 20px;margin:4px;border:1px solid #ddd;border-radius:8px;text-align:center}
    .stat-value{font-size:20px;font-weight:700}
    .stat-label{font-size:10px;color:#888}
    @media print{body{padding:10px}}</style></head><body>`);
  win.document.write(`<h1>${title}</h1><p style="font-size:11px;color:#888">Generated: ${new Date().toLocaleString()}</p><hr/>`);
  win.document.write(el.innerHTML);
  win.document.write('</body></html>');
  win.document.close();
  setTimeout(() => { win.print(); }, 500);
}

// Order PDF with table
export function exportOrdersPDF(orders: Order[], title: string = 'Orders Report') {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;color:#333;font-size:11px}
    h1{font-size:16px}
    table{width:100%;border-collapse:collapse;margin-top:10px}
    th,td{border:1px solid #ddd;padding:5px 6px;text-align:left}
    th{background:#f0f0f0;font-weight:600;font-size:10px}
    td{font-size:10px}
    .summary{margin-top:15px;padding:10px;background:#f9f9f9;border-radius:6px}
    @media print{body{padding:5px}}</style></head><body>`);
  win.document.write(`<h1>${title}</h1><p style="color:#888;font-size:10px">Generated: ${new Date().toLocaleString()}</p>`);

  const delivered = orders.filter(o => o.orderStatus === 'delivered');
  const totalRevenue = delivered.reduce((s, o) => s + o.amountPaid, 0);
  const totalProfit = delivered.reduce((s, o) => s + o.grossProfit, 0);

  win.document.write(`<div class="summary"><strong>Total Orders:</strong> ${orders.length} | <strong>Delivered:</strong> ${delivered.length} | <strong>Revenue:</strong> ${formatNaira(totalRevenue)} | <strong>Net Profit:</strong> ${formatNaira(totalProfit)}</div>`);

  win.document.write('<table><thead><tr><th>S/N</th><th>Customer</th><th>Phone</th><th>City/State</th><th>Products</th><th>Qty</th><th>Type</th><th>Order Date</th><th>Status</th><th>Payment</th><th>Amount</th><th>Paid</th></tr></thead><tbody>');
  orders.forEach(o => {
    win.document.write(`<tr>
      <td>${o.serialNumber}</td><td>${o.customerName}</td><td>${o.phoneNumber}</td>
      <td>${o.city}, ${o.state}</td>
      <td>${o.items.map(i => `${i.productName}(${i.quantity})`).join(', ')}</td>
      <td>${o.items.reduce((s, i) => s + i.quantity, 0)}</td>
      <td>${o.dealType}</td><td>${o.orderDate}</td><td>${o.orderStatus}</td>
      <td>${o.paymentStatus}</td><td>${formatNaira(o.totalAmount)}</td><td>${formatNaira(o.amountPaid)}</td>
    </tr>`);
  });
  win.document.write('</tbody></table></body></html>');
  win.document.close();
  setTimeout(() => { win.print(); }, 500);
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
