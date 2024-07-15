<script lang="ts">
  import type { LogEntry } from '$lib/types'  // Adjust the import path as needed

  export let logs: LogEntry[];

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }
</script>

<div class="bg-white shadow overflow-hidden sm:rounded-lg mt-8">
  <div class="px-4 py-5 sm:px-6">
    <h3 class="text-lg leading-6 font-medium text-gray-900">
      Sales Order Activity Log
    </h3>
  </div>
  <div class="border-t border-gray-200">
    <ul class="divide-y divide-gray-200">
      {#each logs as log}
        <li class="px-4 py-4 sm:px-6">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-indigo-600 truncate">
              {log.user} - {log.role}
            </p>
            <div class="ml-2 flex-shrink-0 flex">
              <p class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                {formatDate(log.timestamp)}
              </p>
            </div>
          </div>
          <div class="mt-2 text-sm text-gray-500">
            <span class="font-semibold">Action:</span> {log.action}
          </div>
          <div class="mt-1 text-sm text-gray-500">
            <span class="font-semibold">Details:</span> {JSON.stringify(log.details)}
          </div>
        </li>
      {/each}
    </ul>
  </div>
</div>