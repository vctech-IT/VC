<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';
  import { fade } from 'svelte/transition';
  import Swal from 'sweetalert2';

  export let form: ActionData;
  let loading = false;

  const handleSubmit = () => {
    loading = true;
    return async ({ result }) => {
      loading = false;
      
      if (result.type === 'success') {
        await Swal.fire({
          title: 'Reset Link Sent!',
          text: 'Please check your email for password reset instructions.',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } else if (result.type === 'failure') {
        await Swal.fire({
          title: 'Error',
          text: result.data?.error || 'An error occurred. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    };
  };
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
  <div class="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md p-8">
    <div class="text-center mb-8">
      <img src="/vc2-Photoroom.png" alt="Company Logo" class="h-16 mx-auto mb-4">
      <h1 class="text-3xl font-bold text-gray-900">Forgot Password</h1>
      <p class="text-gray-600 mt-2">Enter your email to reset your password</p>
    </div>

    <form 
      action="?/forgotPassword" 
      method="POST" 
      use:enhance={handleSubmit}
      class="space-y-6"
    >
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input 
          id="email" 
          name="email" 
          type="email" 
          required 
          class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          placeholder="Enter your email"
        />
      </div>

      <button 
        type="submit" 
        class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-gray-600">
      Remember your password? 
      <a href="/login" class="font-medium text-blue-600 hover:text-blue-500">Sign in</a>
    </p>
  </div>
</div>

{#if loading}
  <div transition:fade="{{ duration: 200 }}" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
    <div class="loader-container p-8 bg-white rounded-lg shadow-xl">
      <div class="loader"></div>
      <p class="mt-4 text-gray-700 font-semibold">Sending link</p>
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