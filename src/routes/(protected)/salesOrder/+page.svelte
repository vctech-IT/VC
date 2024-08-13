<script lang="ts">
    import '$lib/styles/app.css'
    import type { PageData } from './$types';
    import { disableScrollHandling, goto } from '$app/navigation';
    import SalesOrderTable from '$lib/components/SalesOrderTable.svelte';
    import type { SalesOrder } from '$lib/types';
    import { loading } from '$lib/stores/loading';
    import { onMount } from 'svelte';
    import ColumnSelector from '$lib/components/ColumnSelector.svelte';
    import { clickOutside } from '$lib/actions/clickOutside';
    import { Search, Filter, Columns, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-svelte';

    let showColumnSelector = false;
    let columns = [
        { key: 'date', label: 'Date', selected: true, disableScrollHandling },
        { key: 'salesorder_number', label: 'Sales Order Number', selected: true },
        { key: 'customer_name', label: 'Customer Name', selected: true },
        { key: 'reference_number', label: 'Reference Number', selected: true },
        { key: 'total', label: 'Total', selected: true },
        { key: 'status', label: 'Status', selected: true },
        { key: 'invoiced_status', label: 'Invoiced Status', selected: true },
        { key: 'payment_status', label: 'Payment Status', selected: true },
        { key: 'ops_status', label: 'Ops Status', selected: true },
        { key: 'shipment_date', label: 'Shipment Date', selected: true },
        { key: 'order_status', label: 'Order Status', selected: true },
        { key: 'delivery_method', label: 'Delivery Method', selected: true }
    // Add more columns as needed
    ];

    let opsStatusFilter = 'all';
    const opsStatusOptions = [
        { value: 'all', label: 'All OPS Statuses' },
        { value: 'null', label: 'N/A' },
        { value: '0', label: 'Stage 0' },
        { value: '1', label: 'Stage 1' },
        { value: '2', label: 'Stage 2' },
        { value: '3', label: 'Stage 3' },
        { value: '4', label: 'Stage 4' },
        { value: '5', label: 'Stage 5' },
    ];

    function toggleColumnSelector() {
    showColumnSelector = !showColumnSelector;
    }

    function handleColumnChange(event: CustomEvent) {
    columns = event.detail;
    }

    export let data: PageData;
    let orders: SalesOrder[] = [];
    let totalOrders = 7340; 
    let totalPages = totalOrders > 0 ? Math.ceil(totalOrders / 200) : 0;
    let searchTerm = '';
    let errorMessage = '';
    let statusFilter = 'all';

    onMount(() => {
        orders = data.orders as SalesOrder[];
    });

    const statusOptions = [
        { value: 'all', label: 'All Statuses' },
        { value: 'draft', label: 'Draft' },
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' },
        { value: 'void', label: 'Void' },
        // Add more status options as needed
    ];

    async function changePage(pageNumber: number) {
        if (pageNumber < 1 || (totalPages > 0 && pageNumber > totalPages)) return;
        loading.set(true);
        try {
            await goto(`?page=${pageNumber}&search=${searchTerm}&status=${statusFilter}`);
            orders = data.orders as SalesOrder[];
            errorMessage = '';
        } catch (error) {
            console.error('Error changing page:', error);
            errorMessage = 'An error occurred while fetching orders. Please try again.';
        } finally {
            loading.set(false);
        }
    }

    async function handleSearch() {
        loading.set(true);
        errorMessage = '';
        try {
            await goto(`?search=${encodeURIComponent(searchTerm.trim())}&status=${statusFilter}&opsStatus=${opsStatusFilter}`);
            orders = data.orders as SalesOrder[];
            totalOrders = totalOrders;
            totalPages = totalOrders > 0 ? Math.ceil(totalOrders / 200) : 0;
            if (orders.length === 0) {
                errorMessage = 'No orders found for the given search term and filters.';
            }
        } catch (error) {
            console.error('Error searching orders:', error);
            errorMessage = 'An error occurred while searching. Please try again.';
        } finally {
            loading.set(false);
        }
    }

    function handleKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    }

    function handleRowClick(event: CustomEvent<SalesOrder>) {
        const order = event.detail;
        console.log('Clicked order:', order);
    }

    function getPageNumbers(current: number, total: number): (number | string)[] {
        const pages: (number | string)[] = [];
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        if (current <= 3) {
            pages.push(1, 2, 3, 4, '...', total);
        } else if (current >= total - 2) {
            pages.push(1, '...', total - 3, total - 2, total - 1, total);
        } else {
            pages.push(1, '...', current - 1, current, current + 1, '...', total);
        }
        return pages;
    }
</script>

<div class="container mx-auto px-4 py-8">
    <div class="mb-6 flex items-center space-x-2">
        <input
            type="text"
            bind:value={searchTerm}
            on:keypress={handleKeyPress}
            placeholder="Search by order number"
            class="flex-grow px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div class="relative">
            <select
                bind:value={statusFilter}
                on:change={handleSearch}
                class="appearance-none px-4 py-2 pr-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {#each statusOptions as option}
                <option value={option.value}>{option.label}</option>
                {/each}
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <Filter size={16} />
            </div>
        </div>
        <div class="relative">
            <select
                bind:value={opsStatusFilter}
                on:change={handleSearch}
                class="appearance-none px-4 py-2 pr-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {#each opsStatusOptions as option}
                <option value={option.value}>{option.label}</option>
                {/each}
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <Filter size={16} />
            </div>
        </div>
        <button
            on:click={toggleColumnSelector}
            class="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Toggle Columns"
        >
            <Columns size={20} />
        </button>
        <button
            on:click={handleSearch}
            class="p-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Search"
        >
            <Search size={20} />
        </button>
    </div>

    {#if showColumnSelector}
    <div use:clickOutside on:clickoutside={toggleColumnSelector} class="absolute z-10 mt-2 right-0">
        <ColumnSelector {columns} on:change={handleColumnChange} />
    </div>
    {/if}

    {#if errorMessage}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span class="block sm:inline">{errorMessage}</span>
        </div>
    {/if}
        
    {#if orders.length > 0}
        <SalesOrderTable
            {orders}
            columns={columns.filter(col => col.selected)}
            on:rowClick={handleRowClick}
        />

    <div class="flex justify-center items-center space-x-2 my-6">
        <button
            on:click={() => changePage(1)}
            disabled={data.currentPage === 1}
            class="p-2 bg-blue-500 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors duration-200"
            title="First Page"
        >
            <ChevronsLeft size={16} />
        </button>

        <button
            on:click={() => changePage(data.currentPage - 1)}
            disabled={data.currentPage === 1}
            class="p-2 bg-blue-500 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors duration-200"
            title="Previous Page"
        >
            <ChevronLeft size={16} />
        </button>

        {#each getPageNumbers(data.currentPage, totalPages) as pageNum}
            {#if typeof pageNum === 'number'}
                <button
                    on:click={() => changePage(pageNum)}
                    class="px-3 py-1 rounded-md transition-colors duration-200 {pageNum === data.currentPage ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
                >
                    {pageNum}
                </button>
            {:else}
                <span class="px-3 py-1">...</span>
            {/if}
        {/each}

        <button
            on:click={() => changePage(data.currentPage + 1)}
            disabled={!data.hasMore}
            class="p-2 bg-blue-500 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors duration-200"
            title="Next Page"
        >
            <ChevronRight size={16} />
        </button>

        <button
            on:click={() => changePage(totalPages)}
            disabled={data.currentPage === totalPages}
            class="p-2 bg-blue-500 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors duration-200"
            title="Last Page"
        >
            <ChevronsRight size={16} />
        </button>
    </div>

    <div class="mt-4 flex justify-center items-center space-x-2">
        <label for="pageInput" class="text-sm font-medium">Go to page:</label>
        <input
            id="pageInput"
            type="number"
            min="1"
            max={totalPages}
            class="w-16 px-2 py-1 border rounded-md"
            on:keypress={(e) => {
                if (e.key === 'Enter') {
                    changePage(parseInt(e.currentTarget.value));
                }
            }}
        />
        <button
            on:click={() => {
                const input = document.getElementById('pageInput');
                if (input instanceof HTMLInputElement) {
                    changePage(parseInt(input.value));
                }
            }}
            class="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
            title="Go to Page"
        >
            <ChevronRight size={16} />
        </button>
    </div>
    {:else if !errorMessage}
        <div class="text-center py-8">
            <p class="text-xl text-gray-600">No orders found.</p>
        </div>
    {/if}
</div>

{#if $loading}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-lg">
            <div class="loading-spinner"></div>
            <p class="mt-4 text-center">Loading...</p>
        </div>
    </div>
{/if}

<style>
    .loading-spinner {
        width: 50px;
        height: 50px;
        border: 5px solid #f3f3f3;
        border-top: 5px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>