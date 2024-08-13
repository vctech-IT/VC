<script lang="ts">
    import '$lib/styles/app.css'
    import type { PageData } from './$types';
    import { goto } from '$app/navigation';
	import type { SalesOrder } from '$lib/types';
    import  SalesOrderTableRef from '$lib/components/SalesOrderTableRef.svelte';

    export let data: PageData;

    function handlePageChange(event: CustomEvent<number>) {
        goto(`?page=${event.detail}`);
    }

    function handleOrderClick(event: CustomEvent<SalesOrder>) {
        const order = event.detail;
        console.log('Order clicked:', order);
    }
</script>

<SalesOrderTableRef 
    orders={data.orders} 
    on:pageChange={handlePageChange}
    on:orderClick={handleOrderClick}
/>