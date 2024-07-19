<!-- components/KPICard.svelte -->
<script lang="ts">
import { createEventDispatcher } from 'svelte';

export let title: string;
export let value: string | number;
export let icon: string;

const dispatch = createEventDispatcher();

function handleClick() {
  dispatch('click', { title, value });
}
</script>

<div class="bg-white rounded-lg shadow p-6 flex items-center cursor-pointer hover:bg-gray-50 transition-colors" on:click={handleClick}>
  <div class="mr-4">
    <i class="fas fa-{icon} text-3xl text-blue-500"></i>
  </div>
  <div>
    <h2 class="text-xl font-semibold mb-2">{title}</h2>
    <p class="text-3xl font-bold">{value}</p>
  </div>
</div>