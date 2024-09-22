<!--ExportModal.svelte-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { X, Filter, Download } from 'lucide-svelte';
  import Swal from 'sweetalert2';

  export let show = false;

  const dispatch = createEventDispatcher();

  let pmNames = [];
  let orderStatuses = [];
  let categories = [];
  let clientNames = [];

  let selectedPMName = '';
  let selectedOrderStatus = '';
  let selectedCategory = '';
  let selectedClientName = '';

    function resetForm() {
    selectedPMName = '';
    selectedOrderStatus = '';
    selectedCategory = '';
    selectedClientName = '';
  }

    $: if (!show) {
    resetForm();
  }

  onMount(async () => {
    try {
      const response = await fetch('/api/export-options');
      const data = await response.json();
      pmNames = data.pmNames;
      orderStatuses = data.orderStatuses;
      categories = data.categories;
      clientNames = data.clientNames;
    } catch (error) {
      console.error('Error fetching export options:', error);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Failed to load export options. Please try again.',
      });
    }
  });

  function closeModal() {
    resetForm();
    dispatch('close');
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    
    const result = await Swal.fire({
      title: 'Confirm Export',
      text: 'Are you sure you want to export the data with these filters?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, export it!'
    });

    if (result.isConfirmed) {
      const formData = new FormData(event.target as HTMLFormElement);
      dispatch('export', {
        pmName: formData.get('pmName'),
        orderStatus: formData.get('orderStatus'),
        category: formData.get('category'),
        clientName: formData.get('clientName'),
      });

      Swal.fire(
        'Export Started',
        'Your data export has begun. The file will download shortly.',
        'success'
      );
    }
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
    <div class="relative p-5 border w-96 shadow-lg rounded-md bg-white">
      <button on:click={closeModal} class="absolute top-2 right-2 text-gray-600 hover:text-gray-900">
        <X size={24} />
      </button>
      <div class="mt-3">
        <h3 class="text-lg leading-6 font-medium text-gray-900 flex items-center justify-center">
          <Filter class="mr-2" /> Export Data
        </h3>
        <div class="mt-2 px-7 py-3">
        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div>
            <label for="pmName" class="block text-gray-700 text-sm font-bold mb-2">PM Name</label>
            <select id="pmName" name="pmName" bind:value={selectedPMName} class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            <option value="">Select PM Name</option>
            {#each pmNames as pmName}
                <option value={pmName}>{pmName}</option>
            {/each}
            </select>
        </div>
        <div>
            <label for="orderStatus" class="block text-gray-700 text-sm font-bold mb-2">Order Status</label>
            <select id="orderStatus" name="orderStatus" bind:value={selectedOrderStatus} class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            <option value="">Select Order Status</option>
            {#each orderStatuses as status}
                <option value={status}>{status}</option>
            {/each}
            </select>
        </div>
        <div>
            <label for="category" class="block text-gray-700 text-sm font-bold mb-2">Category</label>
            <select id="category" name="category" bind:value={selectedCategory} class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            <option value="">Select Category</option>
            {#each categories as category}
                <option value={category}>{category}</option>
            {/each}
            </select>
        </div>
        <div>
            <label for="clientName" class="block text-gray-700 text-sm font-bold mb-2">Client Name</label>
            <select id="clientName" name="clientName" bind:value={selectedClientName} class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            <option value="">Select Client Name</option>
            {#each clientNames as clientName}
                <option value={clientName}>{clientName}</option>
            {/each}
            </select>
        </div>
            <div class="flex items-center justify-between">
              <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center">
                <Download class="mr-2" size={18} /> Export
              </button>
              <button type="button" on:click={closeModal} class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                Cancel
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
{/if}