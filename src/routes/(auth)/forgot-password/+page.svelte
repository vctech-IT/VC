<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  export let form: ActionData;

  let loading = false;

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
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Forgot Password</h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Enter your email address and we'll send you a password reset link.
      </p>
    </div>
    <form class="mt-8 space-y-6" action="?/forgotPassword" method="POST" use:enhance={handleSubmit}>
      <div>
        <label for="email" class="sr-only">Email address</label>
        <input id="email" name="email" type="email" required class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Email address">
      </div>
      {#if form?.success}
        <p class="text-green-500 text-sm">If an account exists for that email, we have sent a password reset link.</p>
      {/if}
      {#if form?.error}
        <p class="text-red-500 text-sm">{form.error}</p>
      {/if}
      <div>
        <button type="submit" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </div>
    </form>
    <div class="text-sm text-center">
      <a href="/login" class="font-medium text-blue-600 hover:text-blue-500">
        Back to login
      </a>
    </div>
  </div>
</div>