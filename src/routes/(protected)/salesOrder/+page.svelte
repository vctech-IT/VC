<script lang="ts">
    import '$lib/styles/app.css'
    import type { PageData } from './$types';
    import { goto } from '$app/navigation';
    import SalesOrderTable from '$lib/components/SalesOrderTable.svelte';
    import type { SalesOrder } from '$lib/types';
    import { loading } from '$lib/stores/loading';
    import { onMount } from 'svelte';

    export let data: PageData;

    let orders: SalesOrder[] = [];

    onMount(() => {
        orders = data.orders;
    });

    async function handleNext() {
        loading.set(true);
        const nextPage = data.currentPage + 1;
        await goto(`?page=${nextPage}`);
        orders = data.orders;
        loading.set(false);
    }

    async function handlePrevious() {
        if (data.currentPage > 1) {
            loading.set(true);
            const prevPage = data.currentPage - 1;
            await goto(`?page=${prevPage}`);
            orders = data.orders;
            loading.set(false);
        }
    }
</script>

<SalesOrderTable {orders} />

<div class="pagination">
    <button on:click={handlePrevious} disabled={data.currentPage === 1}>Previous</button>
    <span>Page {data.currentPage}</span>
    <button on:click={handleNext} disabled={!data.hasMore}>Next</button>
</div>

{#if $loading}
    <div class="loading-overlay">
        <div class="loading-spinner"></div>
    </div>
{/if}

<style>
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .loading-spinner {
        width: 50px;
        height: 50px;
        border: 5px solid #f3f3f3;
        border-top: 5px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>