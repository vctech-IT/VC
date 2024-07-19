<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from '../../$types';
  import { fade } from 'svelte/transition';
  import emailjs from '@emailjs/browser';

  export let form: ActionData;

  let email = '';
  let verificationCode = '';
  let newPassword = '';
  let confirmPassword = '';
  let step = 1;
  let loading = false;

  const sendVerificationCode = async () => {
    loading = true;
    try {
      const result = await emailjs.send(
        'service_qqk36ij',
        'template_4ivvz52',
        { to_email: email, verification_code: verificationCode },
        '2PTrHzMTB76ipBSTU'
      );
      console.log('Email sent:', result.text);
      step = 2;
    } catch (error) {
      console.error('Error sending email:', error);
      // Handle error (e.g., show error message to user)
    }
    loading = false;
  };

  const handleSubmit = () => {
    loading = true;
    return async ({ result }: { result: any }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      loading = false;
      if (result.type === 'success') {
        step = 3;
      }
    };
  };
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
  <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
    <h1 class="text-2xl font-bold mb-6 text-center">Forgot Password</h1>

    {#if step === 1}
      <form on:submit|preventDefault={sendVerificationCode} class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            id="email"
            bind:value={email}
            required
            class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          class="w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Verification Code'}
        </button>
      </form>
    {:else if step === 2}
      <form
        action="?/resetPassword"
        method="POST"
        use:enhance={handleSubmit}
        class="space-y-4"
      >
        <input type="hidden" name="email" value={email} />
        <div>
          <label for="verificationCode" class="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
          <input
            type="text"
            id="verificationCode"
            name="verificationCode"
            bind:value={verificationCode}
            required
            class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            bind:value={newPassword}
            required
            class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            bind:value={confirmPassword}
            required
            class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          class="w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    {:else if step === 3}
      <p class="text-center text-green-600">Password reset successful. You can now <a href="/login" class="text-blue-600 hover:underline">login</a> with your new password.</p>
    {/if}

  </div>
</div>

{#if loading}
  <div transition:fade="{{ duration: 200 }}" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
    <div class="loader-container p-8 bg-white rounded-lg shadow-xl">
      <div class="loader"></div>
      <p class="mt-4 text-gray-700 font-semibold">Processing...</p>
    </div>
  </div>
{/if}

<style>
  .loader {
    border: 6px solid #f3f3f3;
    border-top: 6px solid #3498db;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>