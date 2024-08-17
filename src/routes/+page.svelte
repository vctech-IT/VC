<!-- dashboard/+page.svelte -->
<script lang="ts">
import { onMount } from 'svelte';
import Chart from 'chart.js/auto';
import DateRangePicker from '$lib/components/DateRangePicker.svelte';
import KPICard from '$lib/components/KPICard.svelte';
import ReportGenerator from '$lib/components/ReportGenerator.svelte';
import OrderTable from '$lib/components/OrderTable.svelte';
import Modal from '$lib/components/Modal.svelte';
import Tabs from '$lib/components/Tabs.svelte';
import LineChart from '$lib/components/LineChart.svelte';
import { faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
import { goto } from '$app/navigation';

let totalOrders = 0;
let activeTab = 0;
let totalRevenue = 0;
let activeInstallations = 0;
let activeServices = 0;
let installationDetails: any;
let serviceDetails: any;
let orderCategories: {category: string, count: number, revenue: number}[] = [];
let ordersByStage: {stage: number, count: number}[] = [];
let recentOrders: any[] = [];
let topCustomers: {name: string, totalOrders: number, totalRevenue: number}[] = [];
let ordersByMonth: {month: number, year: number, count: number, revenue: number}[] = [];
let averageOrderValue = 0;
let conversionRate = 0;
let dateRange = { start: null, end: null };
let orderChart: Chart;
let showModal = false;

onMount(async () => {
  await fetchDashboardData();
});

interface ModalContent {
  title: string;
  totalOrders: number;
  totalSum: number;
  categorizedData: {
    byClient: { [key: string]: { orders: number; sum: number } };
    byCategory: { [key: string]: { orders: number; sum: number } };
  };
  soNumbers: Array<{ SONumber: string; SOId: string }>;
  details?: Array<{
    SONumber: string;
    SOId: string;
    clientName: string;
    category: string;
    cost: number;
    engName: string;
    scheduleDate: Date;
    vendorName: string;
  }>;
}

let modalContent: ModalContent = {
  title: 'Modal Title',
  totalOrders: 0,
  totalSum: 0,
  categorizedData: {
    byClient: {},
    byCategory: {}
  },
  soNumbers: [],
};

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
  installationDetails = data.installationDetails;
  serviceDetails = data.serviceDetails;
  orderCategories = data.orderCategories;
  ordersByStage = data.ordersByStage;
  recentOrders = data.recentOrders;
  topCustomers = data.topCustomers;
  ordersByMonth = data.ordersByMonth;
  averageOrderValue = data.averageOrderValue;
  conversionRate = data.conversionRate;
  updateChart();
}

function processInstallationData(details: any[], totalInstallations: number): ModalContent {
  let totalSum = 0;
  let byClient: { [key: string]: { orders: number; sum: number } } = {};
  let byCategory: { [key: string]: { orders: number; sum: number } } = {};
  let soNumbers: Array<{ SONumber: string; SOId: string }> = [];

  for (let installation of details) {
    totalSum += installation.cost;
    soNumbers.push({ SONumber: installation.SONumber, SOId: installation.SOId });

    if (!byClient[installation.clientName]) {
      byClient[installation.clientName] = { orders: 0, sum: 0 };
    }
    byClient[installation.clientName].orders++;
    byClient[installation.clientName].sum += installation.cost;

    if (!byCategory[installation.category]) {
      byCategory[installation.category] = { orders: 0, sum: 0 };
    }
    byCategory[installation.category].orders++;
    byCategory[installation.category].sum += installation.cost;
  }

  return {
    title: "Total Installations",
    totalOrders: totalInstallations,
    totalSum,
    categorizedData: { byClient, byCategory },
    soNumbers
  };
}

function processServiceData(details: any[], totalServices: number): ModalContent {
  let totalSum = 0;
  let byClient: { [key: string]: { orders: number; sum: number } } = {};
  let byCategory: { [key: string]: { orders: number; sum: number } } = {};
  let soNumbers: Array<{ SONumber: string; SOId: string }> = [];

  for (let service of details) {
    totalSum += service.cost;
    soNumbers.push({ SONumber: service.SONumber, SOId: service.SOId });

    // Process by client
    if (!byClient[service.clientName]) {
      byClient[service.clientName] = { orders: 0, sum: 0 };
    }
    byClient[service.clientName].orders++;
    byClient[service.clientName].sum += service.cost;

    // Process by category
    if (!byCategory[service.category]) {
      byCategory[service.category] = { orders: 0, sum: 0 };
    }
    byCategory[service.category].orders++;
    byCategory[service.category].sum += service.cost;
  }

  return {
    title: "Total Services",
    totalOrders: totalServices,
    totalSum,
    categorizedData: { byClient, byCategory },
    soNumbers,
    details: details.map(service => ({
      SONumber: service.SONumber,
      SOId: service.SOId,
      clientName: service.clientName,
      category: service.category,
      cost: service.cost,
      engName: service.engName,
      scheduleDate: service.scheduleDate,
      vendorName: service.vendorName
    }))
  };
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
    
    modalContent = processModalData(data.orders, getStageTitle(stage), value);
  } else if (title === "Total Installations") {
    modalContent = processInstallationData(installationDetails, value);
  } else if (title === "Total Services") {
    modalContent = processServiceData(serviceDetails, value);
  } else {
    modalContent = { 
      title, 
      totalOrders: value, 
      totalSum: 0, 
      categorizedData: { byClient: {}, byCategory: {} },
      soNumbers: [] 
    };
  }
  showModal = true;
}

function processModalData(orders: any[], title: string, totalOrders: number): ModalContent {
  let totalSum = 0;
  let byClient: { [key: string]: { orders: number; sum: number } } = {};
  let byCategory: { [key: string]: { orders: number; sum: number } } = {};
  let soNumbers: Array<{ SONumber: string; SOId: string }> = [];

  for (let order of orders) {
    totalSum += order.Total;
    soNumbers.push({ SONumber: order.SONumber, SOId: order.SOId });

    // Process by client
    if (!byClient[order.clientName]) {
      byClient[order.clientName] = { orders: 0, sum: 0 };
    }
    byClient[order.clientName].orders++;
    byClient[order.clientName].sum += order.Total;

    // Process by category
    if (!byCategory[order.SOCategory]) {
      byCategory[order.SOCategory] = { orders: 0, sum: 0 };
    }
    byCategory[order.SOCategory].orders++;
    byCategory[order.SOCategory].sum += order.Total;
  }

  return {
    title,
    totalOrders,
    totalSum,
    categorizedData: { byClient, byCategory },
    soNumbers
  };
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

  let errorMessage = '';
  async function handleSOClick(soId: string) {
    try {
      isLoading = true;
      errorMessage = '';
      await goto(`/salesOrder/${soId}`, { replaceState: false });
    } catch (error) {
      console.error('Navigation error:', error);
      errorMessage = 'Failed to navigate to the sales order page. Please try again.';
    } finally {
      isLoading = false;
    }
}

  let isLoading = false;
</script>

<div class="container mx-auto px-4 py-8 bg-gray-100">
  <h1 class="text-4xl font-bold mb-6">Dashboard</h1>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <KPICard title="Total Orders" value={totalOrders} icon="shopping-cart" color="bg-blue-500" />
    <KPICard title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon="currency-rupee" color="bg-green-500" />
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
      <h2 class="text-2xl font-semibold mb-4">Top Customers</h2>
      <table class="w-full">
        <thead>
          <tr>
            <th class="text-left">Customer</th>
            <th class="text-right">Total Orders</th>
            <th class="text-right">Total Revenue</th>
          </tr>
        </thead>
        <tbody>
          {#each topCustomers as customer}
            <tr>
              <td>{customer.name}</td>
              <td class="text-right">{customer.totalOrders}</td>
              <td class="text-right">₹{customer.totalRevenue.toLocaleString()}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
  
  <div class="bg-white rounded-lg shadow p-6">
<ReportGenerator 
  {totalOrders}
  {totalRevenue}
  {activeInstallations}
  {activeServices}
  {orderCategories}
  {ordersByStage}
  {recentOrders}
  {topCustomers}
  {ordersByMonth}
  {averageOrderValue}
  {conversionRate}
/>
  </div>
</div>

{#if showModal}
  <Modal title={modalContent.title} on:close={closeModal} size='lg'>
    <div class="p-6 bg-gray-50 rounded-lg">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-white p-4 rounded-lg shadow-sm">
          <h3 class="text-lg font-medium text-gray-900 mb-2">Total Orders</h3>
          <p class="text-3xl font-bold text-blue-600">{modalContent.totalOrders}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow-sm">
          <h3 class="text-lg font-medium text-gray-900 mb-2">Total Sum</h3>
          <p class="text-3xl font-bold text-green-600">₹{modalContent.totalSum.toLocaleString()}</p>
        </div>
      </div>
      
      <Tabs tabs={['By Client', 'By Category', 'SO Numbers']} bind:activeTab>
        {#if activeTab === 0}
          <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sum</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each Object.entries(modalContent.categorizedData.byClient) as [client, data]}
                  <tr class="hover:bg-gray-50 transition-colors duration-150">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{data.orders}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">₹{data.sum.toLocaleString()}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else if activeTab === 1}
          <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sum</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each Object.entries(modalContent.categorizedData.byCategory) as [category, data]}
                  <tr class="hover:bg-gray-50 transition-colors duration-150">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{data.orders}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">₹{data.sum.toLocaleString()}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <div class="bg-white rounded-lg shadow-sm p-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">SO Numbers</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {#each modalContent.soNumbers as { SONumber, SOId }}
                <div 
                  class="bg-gray-100 rounded-lg p-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors duration-150"
                  on:click={() => handleSOClick(SOId)}
                >
                  {SONumber}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </Tabs>
    </div>
        <svelte:fragment slot="footer">
      <button type="button" 
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm transition duration-150 ease-in-out"
              on:click={closeModal}>
        Close
      </button>
    </svelte:fragment>
  </Modal>
{/if}

{#if isLoading}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-4 rounded-lg shadow-lg">
      <p class="text-lg font-semibold">Loading...</p>
    </div>
  </div>
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