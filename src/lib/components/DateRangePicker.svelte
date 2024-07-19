<script lang="ts">
import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

let startDate: string;
let endDate: string;

function handleChange() {
  dispatch('change', { start: startDate, end: endDate });
}
</script>

<div class="flex items-center space-x-4 mb-6">
  <input type="date" bind:value={startDate} on:change={handleChange} class="border rounded p-2">
  <span>to</span>
  <input type="date" bind:value={endDate} on:change={handleChange} class="border rounded p-2">
</div>