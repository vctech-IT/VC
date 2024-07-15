<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import type { PageData } from './$types';

    export let data: PageData;
    
    $: order = data.salesOrder;

    function goBack() {
        window.history.length > 1 ? window.history.back() : goto('/');
    }
</script>

<div class="sales-order">
    <div class="header">
        <button class="back-button" on:click={goBack} aria-label="Go back">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
        </button>
        <h1>Sales Order</h1>
        <div class="order-number">{order.salesorder_number}</div>
        <div class="status-tags">
            <span class="tag confirmed">confirmed</span>
            <span class="tag ops-status">OPS STATUS</span>
        </div>
    </div>

    {#if order}
        <div class="order-details">
            <div class="info-columns">
                <div class="column">
                    <h3>Customer Information</h3>
                    <p><strong>Name:</strong> {order.customer_name}</p>
                    <p><strong>Contact:</strong> {order.contact_person}</p>
                    <p><strong>Phone:</strong> {order.phone}</p>
                    <p><strong>GSTIN:</strong> {order.gstin || 'undefined'}</p>
                </div>
                <div class="column">
                    <h3>Order Information</h3>
                    <p><strong>Date:</strong> {new Date(order.date).toLocaleDateString()}</p>
                    <p><strong>Reference:</strong> {order.reference_number}</p>
                    <p><strong>Delivery Method:</strong> {order.delivery_method}</p>
                    <p><strong>Salesperson:</strong> {order.salesperson_name}</p>
                </div>
            </div>
            
            <div class="shipping-address">
                <h3>Shipping Address</h3>
                <p>{order.shipping_address}</p>
            </div>
            
            <h3>Line Items</h3>
            <table>
                <thead>
                    <tr>
                        <th>DESCRIPTION</th>
                        <th>HSN/SAC</th>
                        <th>QTY</th>
                        <th>RATE</th>
                        <th>AMOUNT</th>
                    </tr>
                </thead>
                <tbody>
                    {#each order.line_items as item}
                        <tr>
                            <td>{item.name}</td>
                            <td>{item.hsn_or_sac}</td>
                            <td>{item.quantity}</td>
                            <td>{item.rate}</td>
                            <td>{item.item_total}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
            
            <div class="order-summary">
                <h3>Order Summary</h3>
                <p><span>Sub Total:</span> <span>{order.sub_total}</span></p>
                <p><span>IGST 18%:</span> <span>{order.igst}</span></p>
                <p class="total"><span>Total:</span> <span>{order.total}</span></p>
            </div>
            
            <div class="additional-notes">
                <h3>Additional Notes</h3>
                <p>SO Requested Date: {order.so_requested_date}</p>
                <p>SO Date: {order.so_date}</p>
                <p>SO Requested By: {order.so_requested_by}</p>
            </div>
        </div>
    {:else}
        <p>Loading order...</p>
    {/if}
</div>

<style>
    .sales-order {
        font-family: Arial, sans-serif;
        max-width: 1000px;
        margin: 0 auto;
        background-color: #f0f0f0;
        font-size: 16px;
        border-radius: 10px;
        overflow: hidden;
    }
    
    .header {
        background-color: #4285f4;
        color: white;
        padding: 15px 20px;
        display: flex;
        align-items: center;
        height: 70px;
    }

    .back-button {
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        width: 40px;
        height: 40px;
        margin-right: 15px;
        transition: background-color 0.3s ease;
        border-radius: 50%;
    }

    .back-button:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .back-button svg {
        width: 24px;
        height: 24px;
    }

    h1 {
        margin: 0;
        flex-grow: 1;
    }

    .order-number {
        font-size: 0.9em;
        margin-right: 20px;
    }

    .status-tags {
        display: flex;
        gap: 10px;
    }
    
    .tag {
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 0.8em;
    }
    
    .confirmed {
        background-color: #e8f5e9;
        color: #4caf50;
    }
    
    .ops-status {
        background-color: #e3f2fd;
        color: #2196f3;
    }
    
    .order-details {
        background-color: white;
        padding: 30px;
        border-radius: 0 0 10px 10px;
    }
    
    .info-columns {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
    }
    
    .column {
        flex: 1;
    }
    
    h3 {
        color: #4285f4;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 8px;
        font-size: 1.1em;
        margin-bottom: 15px;
    }
    
    p {
        margin: 8px 0;
        font-size: 1em;
    }

    .shipping-address {
        margin-bottom: 20px;
    }
    
    table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin-bottom: 25px;
        font-size: 1em;
    }
    
    th, td {
        border: 1px solid #e0e0e0;
        padding: 10px;
        text-align: left;
    }
    
    th {
        background-color: #f5f5f5;
    }
    
    th:first-child {
        border-top-left-radius: 8px;
    }
    
    th:last-child {
        border-top-right-radius: 8px;
    }
    
    tr:last-child td:first-child {
        border-bottom-left-radius: 8px;
    }
    
    tr:last-child td:last-child {
        border-bottom-right-radius: 8px;
    }
    
    .order-summary {
        background-color: #f5f5f5;
        padding: 15px;
        border-radius: 8px;
        margin-top: 20px;
    }

    .order-summary p {
        display: flex;
        justify-content: space-between;
    }

    .total {
        font-weight: bold;
        color: #4285f4;
    }

    .additional-notes {
        margin-top: 25px;
        font-size: 1em;
    }
</style>