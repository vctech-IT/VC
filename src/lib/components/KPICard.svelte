<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let title: string;
  export let title2: string;
  export let value: string | number;
  export let icon: string;
  export let color: string = 'bg-blue-600';
  const dispatch = createEventDispatcher();
  function handleClick() {
    dispatch('click', { title, value });
  }
</script>

<div
  class="bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1"
  on:click={handleClick}
>
  <div class="p-4 sm:p-5">
    <div class="flex flex-col sm:flex-row items-center">
      <div class="{color} rounded-md p-2 sm:p-3 mb-2 sm:mb-0 sm:mr-4">
        <i class="fas fa-{icon} text-white text-xl sm:text-2xl"></i>
      </div>
      <div class="text-center sm:text-left">
        <p class="text-xs sm:text-sm font-medium text-gray-500 truncate">{title}</p>
        {#if title2}
          <p class="text-xs sm:text-sm font-medium text-gray-500 truncate">{title2}</p>
        {/if}
        <p class="mt-1 text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
</div>