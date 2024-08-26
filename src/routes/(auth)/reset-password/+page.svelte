<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  export let form: ActionData;

  let loading = false;
  let password = '';
  let confirmPassword = '';
  let passwordsMatch = true;

  $: passwordsMatch = password === confirmPassword;

  const handleSubmit = () => {
    loading = true;
    return async ({ result }: { result: any }) => {
      loading = false;
    };
  };
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
  <div class="max-w-md w-full space-y-8 bg-white p-6 rounded-xl shadow-md">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Reset Password</h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Enter your new password below.
      </p>
    </div>
    <form class="mt-8 space-y-6" action="?/resetPassword" method="POST" use:enhance={handleSubmit}>
      <input type="hidden" name="token" value={form?.token}>
      <div>
        <label for="password" class="sr-only">New Password</label>
        <input id="password" name="password" type="password" required bind:value={password} class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="New Password">
      </div>
      <div>
        <label for="confirmPassword" class="sr-only">Confirm New Password</label>
        <input id="confirmPassword" name="confirmPassword" type="password" required bind:value={confirmPassword} class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Confirm New Password">
      </div>
      {#if !passwordsMatch}
        <p class="text-red-500 text-sm">Passwords do not match.</p>
      {/if}
      {#if form?.success}
        <p class="text-green-500 text-sm">Your password has been successfully reset.</p>
      {/if}
      {#if form?.error}
        <p class="text-red-500 text-sm">{form.error}</p>
      {/if}
      <div>
        <button type="submit" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" disabled={loading || !passwordsMatch}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </div>
    </form>
  </div>
</div>