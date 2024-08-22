<!-- routes/verify/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  let email = data.email;
  let otp = '';
  let newEmail = '';
  let showUpdateEmail = false;
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
  <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
    <h1 class="text-2xl font-bold mb-6 text-center">Verify Your Email</h1>
    
    {#if !showUpdateEmail}
      <form method="POST" action="?/verify" use:enhance class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            required 
            bind:value={email}
            readonly
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
          />
        </div>
        
        <div>
          <label for="otp" class="block text-sm font-medium text-gray-700 mb-1">OTP</label>
          <input 
            id="otp" 
            name="otp" 
            type="text" 
            required 
            bind:value={otp}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {#if form?.invalid}
          <p class="text-red-500 text-sm">Invalid email or OTP.</p>
        {/if}

        {#if form?.invalidOtp}
          <p class="text-red-500 text-sm">Invalid or expired OTP.</p>
        {/if}

        {#if form?.userNotFound}
          <p class="text-red-500 text-sm">User not found.</p>
        {/if}

        {#if form?.alreadyVerified}
          <p class="text-green-500 text-sm">This email is already verified. You can now <a href="/login" class="underline">log in</a>.</p>
        {/if}

        <button 
          type="submit" 
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Verify
        </button>
      </form>

      <button 
        on:click={() => showUpdateEmail = true}
        class="mt-4 w-full text-center text-sm text-blue-600 hover:underline"
      >
        Update email address
      </button>
    {:else}
      <form method="POST" action="?/updateEmail" use:enhance class="space-y-4">
        <input type="hidden" name="oldEmail" value={email}>
        <div>
          <label for="newEmail" class="block text-sm font-medium text-gray-700 mb-1">New Email</label>
          <input 
            id="newEmail" 
            name="newEmail" 
            type="email" 
            required 
            bind:value={newEmail}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {#if form?.emailUpdated}
          <p class="text-green-500 text-sm">Email updated successfully. A new OTP has been sent.</p>
        {/if}

        {#if form?.emailError}
          <p class="text-red-500 text-sm">Failed to send OTP to the new email. Please try again.</p>
        {/if}
        {#if form?.emailTaken}
          <p class="text-red-500 text-sm">This email is already in use. Please choose a different email.</p>
        {/if}

        {#if form?.updateError}
          <p class="text-red-500 text-sm">An error occurred while updating your email. Please try again later.</p>
        {/if}

        <button 
          type="submit" 
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Update Email and Send New OTP
        </button>
      </form>

      <button 
        on:click={() => showUpdateEmail = false}
        class="mt-4 w-full text-center text-sm text-blue-600 hover:underline"
      >
        Back to verification
      </button>
    {/if}
  </div>
</div>