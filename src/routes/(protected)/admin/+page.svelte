<script lang="ts">
  import { enhance } from '$app/forms';
  import { fade } from 'svelte/transition';
  import { invalidate } from '$app/navigation';
  import type { PageData } from './$types';
  import { onMount } from 'svelte';

  export let data: PageData;

  $: ({ pendingUsers, approvedUsers, roles } = data);

  let activeTab = 'pending';
  let editingUser: any = null;
  let deleteConfirmUser: any = null;
  let deleteConfirmUsername = '';
  let isLoading = false;

  function formatDate(date: Date) {
    return new Date(date).toLocaleString();
  }

  function startEdit(user: any) {
    editingUser = { ...user };
  }

  function cancelEdit() {
    editingUser = null;
  }

  function startDelete(user: any) {
    deleteConfirmUser = user;
    deleteConfirmUsername = '';
  }

  function cancelDelete() {
    deleteConfirmUser = null;
    deleteConfirmUsername = '';
  }

  async function handleEditSubmit(event: Event) {
    event.preventDefault();
    isLoading = true;
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      await fetch('?/editUser', {
        method: 'POST',
        body: formData
      });
      editingUser = null;
      await invalidate('app:users');
    } finally {
      isLoading = false;
    }
  }

  async function handleDeleteSubmit(event: Event) {
    event.preventDefault();
    isLoading = true;
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      await fetch('?/deleteUser', {
        method: 'POST',
        body: formData
      });
      deleteConfirmUser = null;
      deleteConfirmUsername = '';
      await invalidate('app:users');
    } finally {
      isLoading = false;
    }
  }

  function handleFormSubmit(action: string) {
    return async () => {
      await invalidate('app:users');
    };
  }

  let showNotification = false;

  onMount(() => {
    if (pendingUsers.length > 0) {
      showNotification = true;
    }
  });

  function closeNotification() {
    showNotification = false;
  }

  function toggleTab(tab: string) {
  activeTab = tab;
  if (tab === 'pending' && pendingUsers.length > 0) {
    showNotification = true;
  } else {
    showNotification = false;
  }
}
</script>



<div class="container mx-auto px-4 py-8 bg-gray-100 min-h-screen">
  <h1 class="text-3xl font-semibold mb-8 text-gray-800">User Management Dashboard</h1>

  <div class="mb-6 bg-white shadow-md rounded-lg p-4">
    <div class="flex border-b border-gray-200">

    <button
      class="py-2 px-4 font-medium relative {activeTab === 'pending' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
      on:click={() => toggleTab('pending')}
    >
      Pending Approvals
      {#if pendingUsers.length > 0}
        <span class="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white rounded-full text-xs px-2 py-1">{pendingUsers.length}</span>
      {/if}
    </button>
      <button
        class="py-2 px-4 font-medium ml-4 {activeTab === 'approved' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
        on:click={() => toggleTab('approved')}
      >
        Approved Users
      </button>
    </div>
  </div>

  {#if activeTab === 'pending'}
    {#if pendingUsers.length === 0}
      <p class="text-center text-gray-600 bg-white shadow-md rounded-lg p-4">No pending users to approve.</p>
    {:else}
      <div class="bg-white shadow-md rounded-lg overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile No</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each pendingUsers as user (user.id)}
              <tr transition:fade="{{ duration: 300 }}">
                <td class="px-6 py-4 whitespace-nowrap">{user.username}</td>
                <td class="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td class="px-6 py-4 whitespace-nowrap">{user.phoneNo}</td>
                <td class="px-6 py-4 whitespace-nowrap">{user.role.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">{formatDate(user.createdAt)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">{formatDate(user.updatedAt)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <form method="POST" action="?/approve" use:enhance={handleFormSubmit('approve')} class="inline-block mr-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <button type="submit" class="text-blue-600 hover:text-blue-900" disabled={isLoading}>
                      {#if isLoading}
                        <span class="loader"></span>
                      {:else}
                        Approve
                      {/if}
                    </button>
                  </form>
                  <form method="POST" action="?/decline" use:enhance={handleFormSubmit('decline')} class="inline-block">
                    <input type="hidden" name="userId" value={user.id} />
                    <button type="submit" class="text-red-600 hover:text-red-900" disabled={isLoading}>
                      {#if isLoading}
                        <span class="loader"></span>
                      {:else}
                        Decline
                      {/if}
                    </button>
                  </form>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {:else}
    {#if approvedUsers.length === 0}
      <p class="text-center text-gray-600 bg-white shadow-md rounded-lg p-4">No approved users yet.</p>
    {:else}
      <div class="bg-white shadow-md rounded-lg overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile No</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each approvedUsers as user (user.id)}
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">{user.username}</td>
                <td class="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td class="px-6 py-4 whitespace-nowrap">{user.phoneNo}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {#if editingUser && editingUser.id === user.id}
                    <select bind:value={editingUser.roleId}>
                      {#each roles as role}
                        <option value={role.id}>{role.name}</option>
                      {/each}
                    </select>
                  {:else}
                    {user.role.name}
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">{formatDate(user.createdAt)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">{formatDate(user.updatedAt)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {#if editingUser && editingUser.id === user.id}
                    <form on:submit={handleEditSubmit} class="inline-block mr-2">
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="roleId" value={editingUser.roleId} />
                      <button type="submit" class="text-green-600 hover:text-green-900" disabled={isLoading}>
                        {#if isLoading}
                          <span class="loader"></span>
                        {:else}
                          Save
                        {/if}
                      </button>
                    </form>
                    <button on:click={cancelEdit} class="text-gray-600 hover:text-gray-900" disabled={isLoading}>Cancel</button>
                  {:else}
                    <button on:click={() => startEdit(user)} class="text-blue-600 hover:text-blue-900 mr-2" disabled={isLoading}>
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button on:click={() => startDelete(user)} class="text-red-600 hover:text-red-900" disabled={isLoading}>
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>
{#if deleteConfirmUser}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3 text-center">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Confirm Deletion</h3>
        <div class="mt-2 px-7 py-3">
          <p class="text-sm text-gray-500">
            Type <span class="font-bold">{deleteConfirmUser.username}</span> to confirm deletion.
          </p>
          <input
            type="text"
            bind:value={deleteConfirmUsername}
            class="mt-2 px-3 py-2 border border-gray-300 rounded-md w-full"
            placeholder="Type username here"
          />
        </div>
        <div class="items-center px-4 py-3 flex justify-between">
          <form on:submit={handleDeleteSubmit} class="w-1/2 pr-2">
            <input type="hidden" name="userId" value={deleteConfirmUser.id} />
            <button
              type="submit"
              class="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
              disabled={deleteConfirmUsername !== deleteConfirmUser.username || isLoading}
            >
              {#if isLoading}
                <span class="loader"></span>
              {:else}
                Delete
              {/if}
            </button>
          </form>
          <button
            on:click={cancelDelete}
            class="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-1/2 pl-2 shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .loader {
    border: 2px solid #f3f3f3;
    border-top: 2px solid #3498db;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    animation: spin 1s linear infinite;
    display: inline-block;
    margin-right: 5px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>

