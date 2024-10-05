<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';
  import { page } from '$app/stores';
  import { fade } from 'svelte/transition';
  import Swal from 'sweetalert2';

  export let form: ActionData;
  let loading = false;
  let showPassword = false;
  let showConfirmPassword = false;

  $: token = $page.url.searchParams.get('token');

  const handleSubmit = () => {
    loading = true;
    return async ({ result }) => {
      loading = false;
      
      if (result.type === 'success') {
        await Swal.fire({
          title: 'Password Reset Successful!',
          text: 'Your password has been successfully reset. You can now login with your new password.',
          icon: 'success',
          confirmButtonText: 'Go to Login'
        });
        window.location.href = '/login';
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

  const validatePasswords = (event) => {
    const form = event.target as HTMLFormElement;
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (password !== confirmPassword) {
      Swal.fire({
        title: 'Error',
        text: 'Passwords do not match!',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return false;
    }

    if (password.length < 8) {
      Swal.fire({
        title: 'Error',
        text: 'Password must be at least 8 characters long.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return false;
    }

    return true;
  };
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
  <div class="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md p-8">
    <div class="text-center mb-8">
      <img src="/vc2-Photoroom.png" alt="Company Logo" class="h-16 mx-auto mb-4">
      <h1 class="text-3xl font-bold text-gray-900">Reset Password</h1>
      <p class="text-gray-600 mt-2">Enter your new password</p>
    </div>

    <form 
      action="?/resetPassword" 
      method="POST" 
      use:enhance={handleSubmit}
      on:submit|preventDefault={(e) => validatePasswords(e) && e.target.submit()}
      class="space-y-6"
    >
      <input type="hidden" name="token" value={token}>
      
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
        <div class="relative">
          <input 
            id="password" 
            name="password" 
            type={showPassword ? 'text' : 'password'}
            required 
            minlength="8"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Enter new password"
          />
          <button 
            type="button" 
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
            on:click={() => showPassword = !showPassword}
          >
            <!-- Eye icon SVG -->
          </button>
        </div>
      </div>

      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
        <div class="relative">
          <input 
            id="confirmPassword" 
            name="confirmPassword" 
            type={showConfirmPassword ? 'text' : 'password'}
            required 
            minlength="8"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="Confirm new password"
          />
          <button 
            type="button" 
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
            on:click={() => showConfirmPassword = !showConfirmPassword}
          >
            <!-- Eye icon SVG -->
          </button>
        </div>
      </div>

      <button 
        type="submit" 
        class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
        disabled={loading}
      >
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  </div>
</div>

{#if loading}
  <div transition:fade="{{ duration: 200 }}" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
    <div class="loader-container p-8 bg-white rounded-lg shadow-xl">
      <div class="loader"></div>
      <p class="mt-4 text-gray-700 font-semibold">Resetting password...</p>
    </div>
  </div>
{/if}