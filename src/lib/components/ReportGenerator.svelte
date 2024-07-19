<script lang="ts">
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export let totalOrders: number;
export let totalRevenue: number;
export let activeInstallations: number;
export let activeServices: number;
export let orderCategories: {category: string, count: number}[];

function generateReport() {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('Dashboard Report', 14, 22);

  doc.setFontSize(16);
  doc.text('Key Performance Indicators', 14, 35);
  doc.setFontSize(12);
  doc.text(`Total Orders: ${totalOrders}`, 14, 45);
  doc.text(`Total Revenue: ₹${totalRevenue.toLocaleString()}`, 14, 55);
  doc.text(`Active Installations: ${activeInstallations}`, 14, 65);
  doc.text(`Active Services: ${activeServices}`, 14, 75);

  doc.setFontSize(16);
  doc.text('Order Categories', 14, 90);
  doc.autoTable({
    head: [['Category', 'Count']],
    body: orderCategories.map(c => [c.category, c.count]),
    startY: 95
  });

  doc.save('dashboard-report.pdf');
}
</script>

<button
  on:click={generateReport}
  class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
>
  Generate Report
</button>