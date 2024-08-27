<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let title: string;
  export let subtitle: string;
  export let value: string | number;
  export let icon: string;
  export let color: string = 'bg-blue-600';
  const dispatch = createEventDispatcher();
  
  function handleClick() {
    dispatch('click', { title, value });
  }
</script>

<div
  class="bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1 h-32"
  on:click={handleClick}
>
  <div class="p-4 flex flex-col h-full justify-between">
    <div class="flex items-center mb-2">
      <div class="{color} rounded-md p-2 mr-3">
        <i class="fas fa-{icon} text-white text-lg"></i>
      </div>
      <div class="flex-grow">
        <p class="text-sm font-medium text-gray-900">{title}</p>
        <p class="text-xs text-gray-500 truncate" title={subtitle}>{subtitle}</p>
      </div>
    </div>
    <p class="text-2xl font-semibold text-gray-900 text-center">{value}</p>
  </div>
</div>

<style>
  .truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>