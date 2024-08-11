<!-- components/KPICard.svelte -->
<script lang="ts">
import { createEventDispatcher } from 'svelte';

export let title: string;
export let value: string | number;
export let icon: string;
export let color: string = 'bg-blue-500';

const dispatch = createEventDispatcher();

function handleClick() {
  dispatch('click', { title, value });
}
</script>

<div class="bg-white rounded-lg shadow p-4 flex items-center cursor-pointer hover:bg-gray-50 transition-colors" on:click={handleClick}>
  <div class="mr-4 {color} text-white p-3 rounded-full">
    <i class="fas fa-{icon} text-2xl"></i>
  </div>
  <div>
    <h3 class="text-lg font-semibold">{title}</h3>
    <p class="text-2xl font-bold">{value}</p>
  </div>
</div>