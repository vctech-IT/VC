<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  export let form: ActionData;

  let loading = false;
  let showPassword = false;

  const handleSubmit = () => {
    loading = true;
    return async ({ result }: { result: any }) => {
      loading = false;
    };
  };
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
  <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Reset Password</h2>
    </div>
    <form class="mt-8 space-y-6" action="?/resetPassword" method="POST" use:enhance={handleSubmit}>
      <input type="hidden" name="token" value={new URL(window.location.href).searchParams.get('token') || ''}>
      <div>
        <label for="password" class="sr-only">New Password</label>
        <div class="relative">
          <input 
            id="password" 
            name="password" 
            type={showPassword ? 'text' : 'password'} 
            required 
            class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" 
            placeholder="New Password"
          >
          <button 
            type="button" 
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
            on:click={() => showPassword = !showPassword}
          >
            {#if showPassword}
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            {:else}
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            {/if}
          </button>
        </div>
      </div>
      {#if form?.success}
        <p class="text-green-500 text-sm">Password has been reset successfully.</p>
      {/if}
      {#if form?.error}
        <p class="text-red-500 text-sm">{form.error}</p>
      {/if}
      <div>
        <button type="submit" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </div>
    </form>
  </div>
</div>