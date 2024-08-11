<!-- components/Modal.svelte -->
<script lang="ts">
import { fade, fly } from 'svelte/transition';
import { createEventDispatcher } from 'svelte'
export let title: string;

const dispatch = createEventDispatcher();

function close() {
  dispatch('close');
}
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 z-50" on:click={close} transition:fade={{duration: 200}}></div>

<div class="fixed inset-0 flex items-center justify-center z-50" transition:fade={{duration: 200}}>
  <div class="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" transition:fly={{y: 200, duration: 200}}>
    <div class="flex justify-between items-center p-4 border-b">
      <h3 class="text-xl font-semibold">{title}</h3>
      <button class="text-gray-500 hover:text-gray-700" on:click={close}>
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    <div class="p-4">
      <slot></slot>
    </div>
  </div>
</div>