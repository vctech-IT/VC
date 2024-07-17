<script lang="ts">
  import '../styles/app.css'
  import { Bell, LogOut, User as UserIcon, ArrowLeft } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { enhance, applyAction } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { goto } from '$app/navigation';

  interface Notification {
    id: number;
    title: string;
    message: string;
    time: string;
  }

  let showNotifications = false;
  let showUserMenu = false;
  let notifications: Notification[] = [];
  let notificationCount = 0;

  $: user = $page.data.user;

  onMount(async () => {
    notifications = await fetchNotifications();
    notificationCount = notifications.length;
  });

  function toggleNotifications() {
    showNotifications = !showNotifications;
    if (showUserMenu) showUserMenu = false;
  }

  function toggleUserMenu() {
    showUserMenu = !showUserMenu;
    if (showNotifications) showNotifications = false;
  }

  function viewProfile() {
    showUserMenu = false;
    goto('/profile');
  }

  // Placeholder function. Replace with your actual API call
  async function fetchNotifications(): Promise<Notification[]> {
    return [
      { id: 1, title: 'New Task Assigned', message: 'You have been assigned a new task: Project X Review', time: '2 hours ago' },
      { id: 2, title: 'Meeting Reminder', message: 'Team standup in 15 minutes', time: '10 minutes ago' },
      { id: 3, title: 'Document Update', message: 'John Doe updated the Project Y specifications', time: '1 day ago' },
      { id: 4, title: 'New Comment', message: 'Sarah left a comment on your report', time: '2 days ago' },
      { id: 5, title: 'Approval Required', message: 'Your leave request is pending approval', time: '3 days ago' },
    ];
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-menu') && !target.closest('.user-menu')) {
      closeAllMenus();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeAllMenus();
    }
  }

  function closeAllMenus() {
    showNotifications = false;
    showUserMenu = false;
  }
</script>

<svelte:window on:click={handleClickOutside} on:keydown={handleKeydown} />

<header class="bg-gray-300 shadow-sm z-10">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-14">
      <div class="flex items-center">
        <div class="relative">
          <input type="text" placeholder="Search" class="bg-gray-100 rounded-full py-1.5 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm">
          <svg class="absolute left-3 top-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      <div class="flex items-center">
        <div class="relative notification-menu">
          <button on:click={toggleNotifications} type="button" class="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300">
            <span class="sr-only">View notifications</span>
            <Bell class="h-5 w-5" />
            {#if notificationCount > 0}
              <span class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">{notificationCount}</span>
            {/if}
          </button>
          {#if showNotifications}
            <div class="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg overflow-hidden z-20">
              <div class="p-4 bg-gray-100 border-b">
                <h3 class="text-lg font-semibold">Notifications</h3>
              </div>
              <div class="max-h-96 overflow-y-auto">
                {#each notifications as notification (notification.id)}
                  <div class="p-4 border-b hover:bg-gray-50 transition duration-150 ease-in-out">
                    <h4 class="text-sm font-semibold text-gray-900">{notification.title}</h4>
                    <p class="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p class="text-xs text-gray-400 mt-2">{notification.time}</p>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
        <div class="ml-3 relative user-menu">
          <button on:click={toggleUserMenu} type="button" class="flex items-center max-w-xs rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300">
            <span class="sr-only">Open user menu</span>
            <img class="h-8 w-8 rounded-full" src={user?.image || "https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg"} alt="User profile">
          </button>
          {#if showUserMenu}
            <div class="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg overflow-hidden z-20">
              <div class="p-4 bg-gray-100 border-b flex items-center">
                <img class="h-10 w-10 rounded-full mr-3" src={user?.image || "https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg"} alt="User profile">
                <h3 class="text-lg font-semibold">Hello, {user?.name || 'User'}</h3>
              </div>
              <div class="py-1">
                <button on:click={viewProfile} class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <UserIcon class="inline-block h-4 w-4 mr-2" />
                  View Profile
                </button>
                {#if user}
                  <form action="/logout" method="POST" use:enhance={() => {
                    return async ({result}) => {
                      invalidateAll()
                      await applyAction(result)
                    }
                  }}>
                    <button type="submit" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <LogOut class="inline-block h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </form>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</header>

<slot />