<!-- Dashboard.svelte -->
<script lang="ts">
import { onMount } from 'svelte';
import Chart from 'chart.js/auto';
import DateRangePicker from '$lib/components/DateRangePicker.svelte';
import KPICard from '$lib/components/KPICard.svelte';
import ReportGenerator from '$lib/components/ReportGenerator.svelte';
import OrderTable from '$lib/components/OrderTable.svelte';
import Modal from '$lib/components/Modal.svelte';

let totalOrders = 0;
let totalRevenue = 0;
let activeInstallations = 0;
let activeServices = 0;
let orderCategories: {category: string, count: number}[] = [];
let recentOrders: any[] = [];
let dateRange = { start: null, end: null };
let orderChart: Chart;

let showModal = false;
let modalContent = { title: '', data: null };

onMount(async () => {
  await fetchDashboardData();
});

async function fetchDashboardData() {
  const response = await fetch('/api/dashboard-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dateRange)
  });
  const data = await response.json();
  
  totalOrders = data.totalOrders;
  totalRevenue = data.totalRevenue;
  activeInstallations = data.activeInstallations;
  activeServices = data.activeServices;
  orderCategories = data.orderCategories;
  recentOrders = data.recentOrders;
  updateChart();
}

function updateChart() {
  if (orderChart) orderChart.destroy();

  const orderCtx = document.getElementById('orderCategoryChart') as HTMLCanvasElement;
  orderChart = new Chart(orderCtx, {
    type: 'doughnut',
    data: {
      labels: orderCategories.map(c => c.category),
      datasets: [{
        data: orderCategories.map(c => c.count),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Order Categories' },
        legend: { position: 'right' }
      }
    }
  });
}

function handleDateRangeChange(event:any) {
  dateRange = event.detail;
  fetchDashboardData();
}

function handleCardClick(event:any) {
  const { title, value } = event.detail;
  modalContent = { title, data: value };
  showModal = true;
}

function closeModal() {
  showModal = false;
}
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-6">Dashboard</h1>
  
  <DateRangePicker on:change={handleDateRangeChange} />

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <KPICard title="Total Orders" value={totalOrders} icon="shopping-cart" on:click={handleCardClick} />
    <KPICard title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon="currency-rupee" on:click={handleCardClick} />
    <KPICard title="Active Installations" value={activeInstallations} icon="tools" on:click={handleCardClick} />
    <KPICard title="Active Services" value={activeServices} icon="cogs" on:click={handleCardClick} />
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
    <div class="bg-white rounded-lg shadow p-6">
      <canvas id="orderCategoryChart"></canvas>
    </div>
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4">Recent Orders</h2>
      <OrderTable orders={recentOrders} />
    </div>
  </div>

  <ReportGenerator {totalOrders} {totalRevenue} {activeInstallations} {activeServices} {orderCategories} />
</div>

{#if showModal}
  <Modal title={modalContent.title} on:close={closeModal}>
    <div class="p-4">
      <h3 class="text-lg font-semibold mb-2">{modalContent.title} Details</h3>
      <p class="text-xl">{modalContent.data}</p>
      <!-- Add more detailed information or charts here based on the card type -->
    </div>
  </Modal>
{/if}