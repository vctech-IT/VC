<script lang="ts">
  import { onMount } from 'svelte';

  interface Invoice {
	branch_name: any;
	balance: any;
	total: any;
	reference_number: any;
    date: string;
    invoice_number: string;
    order_number: string;
    customer_name: string;
    status: string;
    due_date: string;
    amount: string;
    balance_due: string;
    branch: string;
  }

  let invoices: Invoice[] = [];
  let error: string | null = null;

  onMount(async () => {
    try {
      const response = await fetch('/api/zoho-invoices');
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const data = await response.json();
      invoices = data.invoices;
    } catch (e:any) {
      error = e.message;
    }
  });
</script>

{#if error}
  <p class="text-red-500">{error}</p>
{:else if invoices.length === 0}
  <p>Loading invoices...</p>
{:else}
  <div class="overflow-x-auto">
    <table class="min-w-full text-sm text-left text-gray-500">
      <thead class="text-xs text-gray-700 uppercase bg-gray-50">
        <tr>
          <th scope="col" class="px-6 py-3">Date</th>
          <th scope="col" class="px-6 py-3">Invoice#</th>
          <th scope="col" class="px-6 py-3">Order Number</th>
          <th scope="col" class="px-6 py-3">Customer Name</th>
          <th scope="col" class="px-6 py-3">Status</th>
          <th scope="col" class="px-6 py-3">Due Date</th>
          <th scope="col" class="px-6 py-3">Amount</th>
          <th scope="col" class="px-6 py-3">Balance Due</th>
          <th scope="col" class="px-6 py-3">Branch</th>
        </tr>
      </thead>
      <tbody>
        {#each invoices as invoice}
          <tr class="bg-white border-b">
            <td class="px-6 py-4">{invoice.date}</td>
            <td class="px-6 py-4">{invoice.invoice_number}</td>
            <td class="px-6 py-4">{invoice.reference_number}</td>
            <td class="px-6 py-4">{invoice.customer_name}</td>
            <td class="px-6 py-4">{invoice.status}</td>
            <td class="px-6 py-4">{invoice.due_date}</td>
            <td class="px-6 py-4">{invoice.total}</td>
            <td class="px-6 py-4">{invoice.balance}</td>
            <td class="px-6 py-4">{invoice.branch_name}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}