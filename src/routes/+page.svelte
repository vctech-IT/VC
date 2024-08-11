<!-- Dashboard.svelte -->
<script lang="ts">
import { onMount } from 'svelte';
import Chart from 'chart.js/auto';
import DateRangePicker from '$lib/components/DateRangePicker.svelte';
import KPICard from '$lib/components/KPICard.svelte';
import ReportGenerator from '$lib/components/ReportGenerator.svelte';
import OrderTable from '$lib/components/OrderTable.svelte';
import Modal from '$lib/components/Modal.svelte';
import Tabs from '$lib/components/Tabs.svelte';

let totalOrders = 0;
let activeTab = 0;
let totalRevenue = 0;
let activeInstallations = 0;
let activeServices = 0;
let orderCategories: {category: string, count: number}[] = [];
let ordersByStage: {stage: number, count: number}[] = [];
let recentOrders: any[] = [];
let dateRange = { start: null, end: null };
let orderChart: Chart;
let showModal = false;

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
  ordersByStage = data.ordersByStage;
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

function handleDateRangeChange(event: any) {
  dateRange = event.detail;
  fetchDashboardData();
}

async function handleCardClick(event: any) {
  const { title, value } = event.detail;
  const stage = parseInt(title.split(' ')[1]); 

  if (!isNaN(stage)) {
    const response = await fetch('/api/stage-details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage, ...dateRange })
    });
    const data = await response.json();
    const totalSum = data.orders.reduce((sum: any, order: any) => sum + order.Total, 0);
    modalContent = { 
      title: getStageTitle(stage), 
      data: value,
      orders: data.orders,
      totalSum
    };
  } else {
    modalContent = { title, data: value, orders: [], totalSum: 0 };
  }
  showModal = true;
}

function getStageTitle(stage: number): string {
  switch (stage) {
    case 0: return "Site Not Ready";
    case 1: return "Logistic";
    case 2: return "Material to Procure";
    case 3: return "Ongoing";
    case 4: return "Return Pickup";
    case 5: return "Share With Account";
    default: return "Unknown Stage";
  }
}

function closeModal() {
  showModal = false;
}

  interface Order {
    SONumber: string;
    clientName: string;
    Total: number;
    SOCategory: string;
    PMName: string;
    clientExpectedDate: string;
  }

  interface ModalContent {
    title: string;
    data: any;
    orders: Order[];
    totalSum: number;
  }

  let modalContent: ModalContent = {
    title: 'Modal Title',
    data: 'Modal Data',
    totalSum: 0,
    orders: [
      {
        SONumber: 'SO-123',
        clientName: 'Client Name',
        Total: 100,
        SOCategory: 'Category',
        PMName: 'PM Name',
        clientExpectedDate: '2022-01-01',
      },
    ],
  };

</script>

<div class="container mx-auto px-4 py-8 bg-gray-100">
  <h1 class="text-4xl font-bold mb-6">Dashboard</h1>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <KPICard title="Total Orders" value={totalOrders} icon="shopping-cart" color="bg-blue-500" on:click={handleCardClick} />
    <KPICard title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon="currency-rupee" color="bg-green-500" on:click={handleCardClick} />
    <KPICard title="Total Installations" value={activeInstallations} icon="tools" color="bg-yellow-500" on:click={handleCardClick} />
    <KPICard title="Total Services" value={activeServices} icon="cogs" color="bg-purple-500" on:click={handleCardClick} />
  </div>

  <div class="bg-white rounded-lg shadow p-4 mb-8">
    <h2 class="text-2xl font-semibold mb-4">Orders by Stage</h2>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {#each ordersByStage as { stage, count }}
        <KPICard 
          title={`Stage ${stage}`} 
          value={count} 
          icon="layer-group" 
          color={getStageColor(stage)} 
          on:click={handleCardClick}
        />
      {/each}
    </div>
  </div>
  
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-semibold mb-4">Order Categories</h2>
      <canvas id="orderCategoryChart"></canvas>
    </div>
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-semibold mb-4">Recent Orders</h2>
      <OrderTable orders={recentOrders} />
    </div>
  </div>
  
  <div class="bg-white rounded-lg shadow p-6">
    <ReportGenerator {totalOrders} {totalRevenue} {activeInstallations} {activeServices} {orderCategories} {ordersByStage} />
  </div>
</div>

{#if showModal}
  <Modal title={modalContent.title} on:close={closeModal}>
    <div class="p-4">
      <h3 class="text-2xl font-semibold mb-2">{modalContent.title}</h3>
      <p class="text-xl mb-2">Total Orders: {modalContent.data}</p>
      <p class="text-xl mb-4 font-bold">Total Sum: ₹{modalContent.totalSum.toLocaleString()}</p>
      {#if modalContent.orders.length > 0}
        <Tabs tabs={['Table View', 'Card View']} bind:activeTab>
          {#if activeTab === 0}
            <table class="w-full table-auto">
              <thead>
                <tr class="bg-gray-100">
                  <th class="px-4 py-2 text-left">SO Number</th>
                  <th class="px-4 py-2 text-left">Client Name</th>
                  <th class="px-4 py-2 text-left">Total</th>
                  <th class="px-4 py-2 text-left">Category</th>
                  <th class="px-4 py-2 text-left">PM Name</th>
                  <th class="px-4 py-2 text-left">Expected Date</th>
                </tr>
              </thead>
              <tbody>
                {#each modalContent.orders as order}
                  <tr class="border-b">
                    <td class="px-4 py-2">{order.SONumber}</td>
                    <td class="px-4 py-2">{order.clientName}</td>
                    <td class="px-4 py-2">₹{order.Total.toLocaleString()}</td>
                    <td class="px-4 py-2">{order.SOCategory}</td>
                    <td class="px-4 py-2">{order.PMName}</td>
                    <td class="px-4 py-2">{new Date(order.clientExpectedDate).toLocaleDateString()}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each modalContent.orders as order}
                <div class="bg-white rounded-lg shadow p-4">
                  <h4 class="text-lg font-semibold">{order.SONumber}</h4>
                  <p><strong>Client:</strong> {order.clientName}</p>
                  <p><strong>Total:</strong> ₹{order.Total.toLocaleString()}</p>
                  <p><strong>Category:</strong> {order.SOCategory}</p>
                  <p><strong>PM:</strong> {order.PMName}</p>
                  <p><strong>Expected Date:</strong> {new Date(order.clientExpectedDate).toLocaleDateString()}</p>
                </div>
              {/each}
            </div>
          {/if}
        </Tabs>
      {:else}
        <p>No detailed information available for this card.</p>
      {/if}
    </div>
  </Modal>
{/if}

<script context="module">
function getStageColor(stage) {
  const colors = [
    'bg-red-500',    // Stage 0
    'bg-yellow-500', // Stage 1
    'bg-green-500',  // Stage 2
    'bg-blue-500',   // Stage 3
    'bg-indigo-500', // Stage 4
    'bg-purple-500'  // Stage 5
  ];
  return colors[stage] || 'bg-gray-500';
}
</script>