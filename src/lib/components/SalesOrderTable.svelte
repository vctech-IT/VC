<script lang="ts">
    import type { SalesOrder } from '$lib/types';
    import { createEventDispatcher, onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition';
    import { Cog, CheckCircle, AlertCircle, XCircle } from 'lucide-svelte';
    import { jsPDF } from "jspdf";
    import "jspdf-autotable";
    import * as XLSX from 'xlsx';

    export let orders: SalesOrder[] = [];
    export let currentPage = 1;
    export let totalPages = 1;
    export let totalCount = 0;

    let searchTerm = '';
    let filteredOrders: SalesOrder[] = [];
    let paginatedOrders: SalesOrder[] = [];
    let itemsPerPage = 10;
    let originalColumnOrder = [
        'date', 'salesorder_number', 'customer_name', 'reference_number', 'total',
        'status', 'invoiced_status', 'payment_status', 'ops_status', 'shipment_date', 'order_status', 'delivery_method'
    ];
    let visibleColumns = [...originalColumnOrder];
    let tempVisibleColumns: string[] = [];
    let isColumnSelectorOpen = false;
    let isDownloadMenuOpen = false;
    let isLoading = false;
    let lockedColumns = ['date', 'salesorder_number', 'customer_name', 'total', 'order_status'];

    let columnSelectorRef: HTMLDivElement;
    let downloadMenuRef: HTMLDivElement;

    const dispatch = createEventDispatcher();

    function normalizeString(str: string): string {
        return str.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    function handleSearch() {
        const normalizedSearch = normalizeString(searchTerm);
        filteredOrders = orders.filter(order => {
            const normalizedSalesOrderNumber = normalizeString(order.salesorder_number);
            const normalizedCustomerName = normalizeString(order.customer_name);
            const normalizedReferenceNumber = normalizeString(order.reference_number);
            const normalizedFullOrderNumber = normalizeString(`vctso${order.salesorder_number}`);

            return normalizedSalesOrderNumber.includes(normalizedSearch) ||
                   normalizedCustomerName.includes(normalizedSearch) ||
                   normalizedReferenceNumber.includes(normalizedSearch) ||
                   normalizedFullOrderNumber.includes(normalizedSearch);
        });

        // Additional check for "VCT/SO/" format
        const parts = searchTerm.split('/');
        if (parts.length === 3 && parts[0].toLowerCase() === 'vct' && parts[1].toLowerCase() === 'so') {
            const orderNumber = parts[2];
            filteredOrders = filteredOrders.filter(order => 
                normalizeString(order.salesorder_number).includes(normalizeString(orderNumber))
            );
        }

        currentPage = 1; // Reset to first page when searching
        updatePagination();
    }

    $: {
        handleSearch();
    }

    function updatePagination() {
        totalCount = filteredOrders.length;
        totalPages = Math.ceil(totalCount / itemsPerPage);
        currentPage = Math.min(Math.max(1, currentPage), totalPages);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalCount);
        paginatedOrders = filteredOrders.slice(startIndex, endIndex);
    }

    async function handleRowClick(order: SalesOrder) {
        isLoading = true;
        await goto(`/salesOrder/${order.salesorder_id}`);
        isLoading = false;
    }

    async function changePage(newPage: number) {
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            updatePagination();
            await goto(`?page=${currentPage}`);
        }
    }

    function formatDate(date: Date): string {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    }

    function toggleColumn(column: string) {
    if (lockedColumns.includes(column)) {
        return;
    }
    if (visibleColumns.includes(column)) {
        visibleColumns = visibleColumns.filter(c => c !== column);
    } else {
        const index = originalColumnOrder.findIndex(c => c === column);
        const insertIndex = visibleColumns.findIndex(c => originalColumnOrder.indexOf(c) > index);
        if (insertIndex === -1) {
            visibleColumns = [...visibleColumns, column];
        } else {
            visibleColumns = [
                ...visibleColumns.slice(0, insertIndex),
                column,
                ...visibleColumns.slice(insertIndex)
            ];
        }
    }
}

    function toggleDownloadMenu(event: MouseEvent) {
        event.stopPropagation();
        isDownloadMenuOpen = !isDownloadMenuOpen;
    }

    function handleDownload(type: 'csv' | 'excel' | 'pdf') {
        if (type === 'csv') {
            downloadCSV();
        } else if (type === 'excel') {
            downloadExcel();
        } else if (type === 'pdf') {
            downloadPDF();
        }
        isDownloadMenuOpen = false;
    }

   
    function downloadCSV() {
        const headers = visibleColumns.map(column => column.replace('_', ' '));
        const csvContent = [
            headers.join(','),
            ...filteredOrders.map(order => 
                visibleColumns.map(column => {
                    if (column === 'date' || column === 'shipment_date') {
                        return order[column] ? formatDate(new Date(order[column])) : 'N/A';
                    } else if (column === 'total') {
                        return formatCurrency(order[column]);
                    } else {
                        return order[column];
                    }
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "sales_orders.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    function downloadPDF() {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4'
        });

        const tableData = filteredOrders.map(order => 
            visibleColumns.map(column => {
                if (column === 'date' || column === 'shipment_date') {
                    return order[column] ? formatDate(new Date(order[column])) : 'N/A';
                } else if (column === 'total') {
                    return formatCurrency(order[column]);
                } else {
                    return order[column] ? order[column].toString() : '';
                }
            })
        );

        const maxColumnsPerPage = 5;
        const pages = Math.ceil(visibleColumns.length / maxColumnsPerPage);

        for (let i = 0; i < pages; i++) {
            if (i > 0) doc.addPage();

            const startCol = i * maxColumnsPerPage;
            const endCol = Math.min((i + 1) * maxColumnsPerPage, visibleColumns.length);

            const pageColumns = visibleColumns.slice(startCol, endCol);
            const pageData = tableData.map(row => row.slice(startCol, endCol));

            doc.text(`Sales Orders (Page ${i + 1} of ${pages})`, 40, 15);

            doc.autoTable({
                head: [pageColumns.map(column => column.replace('_', ' ').toUpperCase())],
                body: pageData,
                startY: 30,
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                },
                columnStyles: {},
            });
        }

        doc.save("sales_orders.pdf");
    }

    function downloadExcel() {
        // Sort the filteredOrders array based on the date column (assuming it's the first column)
        const sortedOrders = [...filteredOrders].sort((a, b) => new Date(b.date) - new Date(a.date));

        const wsData = [
            visibleColumns.map(column => column.replace('_', ' ')),
            ...sortedOrders.map(order => 
                visibleColumns.map(column => {
                    if (column === 'date' || column === 'shipment_date') {
                        return order[column] ? formatDate(new Date(order[column])) : 'N/A';
                    } else if (column === 'total') {
                        return formatCurrency(order[column]);
                    } else {
                        return order[column];
                    }
                })
            )
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sales Orders");

        // Set column widths
        const columnWidths = visibleColumns.map(column => ({wch: column.length + 5}));
        ws['!cols'] = columnWidths;

        XLSX.writeFile(wb, "sales_orders.xlsx");
    }

    function handleClickOutside(event: MouseEvent) {
        if (columnSelectorRef && !columnSelectorRef.contains(event.target as Node) && isColumnSelectorOpen) {
            isColumnSelectorOpen = false;
        }
        if (downloadMenuRef && !downloadMenuRef.contains(event.target as Node) && isDownloadMenuOpen) {
            isDownloadMenuOpen = false;
        }
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            isColumnSelectorOpen = false;
            isDownloadMenuOpen = false;
        }
    }

    onMount(() => {
        filteredOrders = [...orders];
        updatePagination();
        isLoading = false;
        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
    });

    onDestroy(() => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
    });
</script>

<div class="container mx-auto px-4 py-8">
    <div class="mb-4 flex justify-between items-center">
        <input
            type="text"
            placeholder="Search orders..."
            class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            bind:value={searchTerm}
            on:input={handleSearch}
        />
        <div class="relative ml-4 flex">
            <div class="relative">
                <button on:click={toggleDownloadMenu} class="p-2 rounded-full hover:bg-gray-200 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                </button>
                {#if isDownloadMenuOpen}
                <div bind:this={downloadMenuRef} class="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10">
                    <div class="py-1">
                        <button
                            on:click|stopPropagation={() => handleDownload('csv')}
                            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            CSV
                        </button>
                        
                        <button
                            on:click|stopPropagation={() => handleDownload('excel')}
                            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            EXCEL
                        </button>
                        <button
                            on:click|stopPropagation={() => handleDownload('pdf')}
                            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            PDF
                        </button>
                    </div>
                </div>
            {/if}
            </div>
            <button on:click|stopPropagation={() => {
                isColumnSelectorOpen = !isColumnSelectorOpen;
                if (isColumnSelectorOpen) {
                    tempVisibleColumns = [...visibleColumns];
                }
            }} class="p-2 rounded-full hover:bg-gray-200">
                <Cog size={24} />
            </button>
            {#if isColumnSelectorOpen}
    <div bind:this={columnSelectorRef} class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
        <div class="py-1">
            {#each originalColumnOrder as column}
                <label class="flex items-center px-4 py-2 hover:bg-gray-100">
                    <input
                        type="checkbox"
                        checked={visibleColumns.includes(column)}
                        on:change={() => toggleColumn(column)}
                        disabled={lockedColumns.includes(column)}
                        class="mr-2"
                    />
                    <span class="{lockedColumns.includes(column) ? 'opacity-50 cursor-not-allowed' : ''}">
                        {column.replace('_', ' ')}
                    </span>
                </label>
            {/each}
            <button
                on:click={() => isColumnSelectorOpen = false}
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
                Cancel
            </button>
        </div>
    </div>
{/if}
        </div>
    </div>

    <div class="overflow-x-auto bg-white shadow-md rounded-lg">
        <table class="min-w-full divide-y divide-blue-200">
            <thead class="bg-blue-500">
                <tr>
                    {#each originalColumnOrder as column}
                        {#if visibleColumns.includes(column)}
                            <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">{column.replace('_', ' ')}</th>
                        {/if}
                    {/each}
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-blue-100">
                {#each paginatedOrders as order, index (order.salesorder_id)}
                    <tr 
                        class="hover:bg-blue-50 cursor-pointer transition-colors duration-200 {index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}"
                        on:click={() => handleRowClick(order)}
                        transition:fade
                    >
                        {#each originalColumnOrder as column}
                            {#if visibleColumns.includes(column)}
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {#if column === 'date' || column === 'shipment_date'}
                                    {order[column] ? formatDate(new Date(order[column])) : 'N/A'}
                                {:else if column === 'total'}
                                    {formatCurrency(order[column])}
                                {:else if column === 'status' || column === 'order_status'}
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                {order[column] === 'pending_approval' ? 'bg-red-100 text-red-800' : 
                                order[column] === 'open' ? 'bg-green-100 text-green-800' : 
                                order[column] === 'closed' ? 'bg-gray-100 text-gray-800' : 
                                'bg-yellow-100 text-yellow-800'}">
                                    {order[column] === 'open' ? 'confirmed' : order[column]}
                                </span>
                            {:else if column === 'invoiced_status' || column === 'payment_status'}
                                <div class="relative inline-block group">
                                    {#if order[column] === 'partially_invoiced' || order[column] === 'partially_paid'}
                                        <AlertCircle size={24} class="text-yellow-500" />
                                    {:else if order[column] === 'invoiced' || order[column] === 'paid'}
                                        <CheckCircle size={24} class="text-green-500" />
                                    {:else}
                                        <XCircle size={24} class="text-gray-500" />
                                    {/if}
                                    <div class="absolute z-10 w-auto p-2 m-2 min-w-max rounded-md shadow-md text-white bg-gray-900 text-xs font-bold transition-opacity duration-300 opacity-0 group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2">
                                        {order[column]}
                                        <svg class="absolute text-gray-900 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xml:space="preserve"><polygon class="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                                    </div>
                                </div>
                            {:else if column === 'ops_status'}
                                {order[column] || 'N/A'}
                            {:else}
                                {order[column]}
                                {/if}
                            </td>
                            {/if}
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
    
    <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-blue-200 sm:px-6 mt-4 rounded-lg shadow">
        <div class="flex-1 flex justify-between sm:hidden">
            <button 
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                disabled={currentPage === 1} 
                on:click={() => changePage(currentPage - 1)}
            >
                Previous
            </button> 
            <button 
                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                disabled={currentPage === totalPages} 
                on:click={() => changePage(currentPage + 1)}
            >
                Next
            </button>
        </div> 
         <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between"> 
             <div>
                <p class="text-sm text-gray-700">
                    Showing <span class="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span class="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span class="font-medium">{totalCount}</span> results
                </p>
            </div> 
             <div> 
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination"> 
                    <button 
                        class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        disabled={currentPage === 1} 
                        on:click={() => changePage(currentPage - 1)}
                    >
                        <span class="sr-only">Previous</span>
                        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                    </button> 
                    <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        {currentPage}
                    </span> 
                    <button 
                        class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        disabled={currentPage === totalPages} 
                        on:click={() => changePage(currentPage + 1)}
                    >
                        <span class="sr-only">Next</span>
                        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                        </svg>
                    </button> 
                </nav>
             </div> 
        </div>
    </div>
    
    {#if isLoading}
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
            <div class="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    {/if}
    </div>
    
    <style>
        .bg-blue-50 {
            background-color: #eff6ff;
        }
        .bg-blue-100 {
            background-color: #dbeafe;
        }
        .bg-blue-200 {
            background-color: #bfdbfe;
        }
        .bg-blue-500 {
            background-color: #3b82f6;
        }
        .hover\:bg-blue-50:hover {
            background-color: #eff6ff;
        }
        .divide-blue-100 > :not([hidden]) ~ :not([hidden]) {
            border-color: #dbeafe;
        }
        .divide-blue-200 > :not([hidden]) ~ :not([hidden]) {
            border-color: #bfdbfe;
        }
        input[type="checkbox"]:disabled + span {
            opacity: 0.5;
            cursor: not-allowed;
        }
    </style>

