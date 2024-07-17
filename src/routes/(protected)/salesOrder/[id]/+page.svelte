<script lang="ts">
 import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import type { PageData } from './$types';
    import '$lib/styles/app.css';
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import StageUpdateModal from '$lib/components/StageUpdateModal.svelte';
    import SalesOrderLogs from '$lib/components/SalesOrderLogs.svelte';
    import { writable } from 'svelte/store';
    import { ArrowLeft, Download, ChevronDown } from 'svelte-lucide';

    export let data: PageData;
    
    $: salesOrder = data.salesOrder;

    $: console.log(data);

    let showStageUpdateModal = false;
    let showDocumentsDropdown = false;

    function toggleStageUpdateModal() {
        showStageUpdateModal = !showStageUpdateModal;
    }

    function toggleDocumentsDropdown() {
        showDocumentsDropdown = !showDocumentsDropdown;
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString('en-GB', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    }

    function getStatusColor(status: string) {
        switch (status.toLowerCase()) {
            case 'open':
                return 'bg-green-100 text-green-800';
            case 'closed':
                return 'bg-gray-100 text-gray-800';
            case 'draft':
                return 'bg-yellow-100 text-yellow-800';
            case 'pending approval':
                return 'bg-blue-100 text-blue-800';
            case 'pending':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-white text-blue-800';
        }
    }

    function goBack() {
        window.history.length > 1 ? window.history.back() : goto('/');
    }

    function downloadDocument(doc: any) {
        // Implement actual download logic here
        console.log(`Downloading ${doc.file_name}`);
        // You might want to use a service or API call to handle the actual download
    }
    let activeTab = 'details';
    function switchTab(tab: any) {
        activeTab = tab;
    }
</script>

<div class="bg-gray-100 min-h-screen py-8 px-4">
    <div class="max-w-6xl mx-auto">
        <div class="bg-white shadow-xl rounded-lg overflow-hidden">
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex flex-col sm:flex-row justify-between items-center">
                <div class="flex items-center mb-4 sm:mb-0">
                    <button 
                        class="mr-4 text-white hover:bg-blue-700 rounded-full p-2 transition duration-300 ease-in-out"
                        on:click={goBack}
                        aria-label="Go back"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 class="text-2xl font-bold text-white">Sales Order: {salesOrder.salesorder_number}</h1>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="px-3 py-1 rounded-full text-sm font-semibold bg-white {getStatusColor(salesOrder.status)}">
                        {salesOrder.status}
                    </span>
                    <button 
                        class="bg-white text-blue-600 hover:bg-blue-50 font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
                        on:click={toggleStageUpdateModal}
                    >
                        Update Status
                    </button>
                </div>
            </div>

            <div class="p-6 space-y-8">
                <!-- Order Summary -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="bg-blue-50 p-4 rounded-lg shadow">
                        <h2 class="text-lg font-semibold text-blue-800 mb-2">From</h2>
                        <p class="font-medium">VC TECHNOSOLUTIONS PRIVATE LIMITED</p>
                        <p>Office No-607, 608 Mayuresh Cosmos,
                            Plot No 37, Sector - 11, CBD Belapur</p>
                        <p>Navi Mumbai, Maharashtra 400614</p>
                        <p>India</p>
                        <p class="mt-2 text-blue-600">GSTIN: 27AAHCV4369B1Z8</p>
                    </div>

                    <div class="bg-blue-50 p-4 rounded-lg shadow">
                        <h2 class="text-lg font-semibold text-blue-800 mb-2">To</h2>
                        <p class="font-medium">{salesOrder.customer_name}</p>
                        <p>{salesOrder.billing_address.address}</p>
                        <p>{salesOrder.billing_address.city}, {salesOrder.billing_address.state} {salesOrder.billing_address.zip}</p>
                        <p>{salesOrder.billing_address.country}</p>
                        <p class="mt-2 text-blue-600">GSTIN: {salesOrder.gst_no || 'N/A'}</p>
                    </div>

                    <div class="bg-blue-50 p-4 rounded-lg shadow">
                        <h2 class="text-lg font-semibold text-blue-800 mb-2">Order Info</h2>
                        <p><strong>SO #:</strong> {salesOrder.salesorder_number}</p>
                        <p><strong>Ref#:</strong> {salesOrder.reference_number}</p>
                        <p><strong>Delivery Method:</strong> {salesOrder.delivery_method || 'N/A'}</p>
                        <p><strong>Place of Supply:</strong> {salesOrder.place_of_supply}</p>
                        <p><strong>Date:</strong> {formatDate(salesOrder.submitted_date)}</p>
                    </div>
                </div>

                <!-- Line Items -->
                <div>
                    <h2 class="text-xl font-semibold text-blue-800 mb-4">Line Items</h2>
                    <div class="bg-white shadow rounded-lg overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN/SAC</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                {#each salesOrder.line_items as item, index}
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                        <td class="px-6 py-4 text-sm text-gray-900">
                                            <div class="font-medium">{item.name}</div>
                                            <div class="text-gray-500">{item.description}</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.hsn_or_sac}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity} {item.unit}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.rate)}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.item_total)}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Order Totals -->
                <div class="bg-white p-4 rounded-lg shadow">
                    <h2 class="text-lg font-semibold text-blue-800 mb-4">Order Totals</h2>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span>Sub Total:</span>
                            <span>{formatCurrency(salesOrder.sub_total)}</span>
                        </div>
                        {#each salesOrder.taxes as tax}
                            <div class="flex justify-between">
                                <span>{tax.tax_name}:</span>
                                <span>{tax.tax_amount_formatted}</span>
                            </div>
                        {/each}
                        <div class="flex justify-between font-semibold text-lg pt-2 border-t border-gray-300">
                            <span>Total:</span>
                            <span>{formatCurrency(salesOrder.total)}</span>
                        </div>
                    </div>
                </div>

                <!-- Additional Information -->
                <div class="bg-white p-4 rounded-lg shadow">
                    <h2 class="text-lg font-semibold text-blue-800 mb-4">Additional Information</h2>
                    <div class="space-y-2">
                        <p><strong>Payment Terms:</strong> {salesOrder.payment_terms}</p>
                        <p><strong>Notes:</strong> {salesOrder.notes}</p>
                        <p><strong>Submitted By:</strong> {salesOrder.submitted_by}</p>
                        <p><strong>Last Modified:</strong> {formatDate(salesOrder.last_modified_time)}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

{#if showStageUpdateModal}
    <StageUpdateModal 
        {salesOrder} 
        {data}
        on:close={toggleStageUpdateModal}
    />
{/if}