<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { ArrowLeft, Upload, User, Mail, Phone, Shield, Calendar } from 'lucide-svelte';
  import type { ActionResult } from '@sveltejs/kit';

  export let data;
  let { user } = data;
  $: ({ user } = data);

  let profilePhotoFile: File | null = null;
  let profilePhotoPreview: string | null = null;
  let error: string | null = null;

  function handleSubmit() {
    return async ({ result }: { result: ActionResult }) => {
      if (result.type === 'success') {
        const data = result.data as { success: boolean; user: typeof user; error?: string };
        if (data.success) {
          user = data.user;
          profilePhotoFile = null;
          profilePhotoPreview = null;
          error = null;
          await invalidateAll();
        } else {
          error = data.error || 'An unknown error occurred';
        }
      }
    };
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      profilePhotoFile = target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        profilePhotoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(profilePhotoFile);
    }
  }

  function cancelPhotoUpload() {
    profilePhotoFile = null;
    profilePhotoPreview = null;
  }
</script>

<div class="max-w-2xl mx-auto mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold text-indigo-800">Profile</h1>
    <a href="/" class="flex items-center text-indigo-600 hover:text-indigo-800 transition duration-300">
      <ArrowLeft size={20} class="mr-1" />
    </a>
  </div>

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
      <span class="block sm:inline">{error}</span>
    </div>
  {/if}

  <form method="POST" action="?/updateProfile" use:enhance={handleSubmit} enctype="multipart/form-data" class="space-y-6">
    <div class="flex items-center space-x-6 mb-6">
      <div class="relative">
        <img src={profilePhotoPreview || user.image || 'https://th.bing.com/th/id/OIP.-BS8Y2nH1k93GJiitUVBCAHaHa?rs=1&pid=ImgDetMain'} alt="Profile" class="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
        <label class="absolute bottom-0 right-0 cursor-pointer bg-indigo-600 text-white p-1.5 rounded-full hover:bg-indigo-700 transition duration-300">
          <input type="file" name="profilePhoto" accept="image/*" class="hidden" on:change={handleFileSelect} />
          <Upload size={16} />
        </label>
      </div>
      <div>
        <h2 class="text-2xl font-semibold text-gray-800">{user.username}</h2>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <Mail class="mr-2" size={16} />
            Email
          </label>
          <input id="email" type="email" value={user.email} disabled 
            class="w-full p-2 bg-gray-100 rounded-lg text-gray-700 focus:outline-none" />
        </div>

        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <Phone class="mr-2" size={16} />
            Phone
          </label>
          <input id="phone" type="tel" value={user.phoneNo} disabled 
            class="w-full p-2 bg-gray-100 rounded-lg text-gray-700 focus:outline-none" />
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label for="role" class="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <Shield class="mr-2" size={16} />
            Role
          </label>
          <input id="role" type="text" value={user.role.name} disabled 
            class="w-full p-2 bg-gray-100 rounded-lg text-gray-700 focus:outline-none" />
        </div>

        <div>
          <label for="createdAt" class="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <Calendar class="mr-2" size={16} />
            Joined
          </label>
          <input id="createdAt" type="text" value={new Date(user.createdAt).toLocaleDateString()} disabled 
            class="w-full p-2 bg-gray-100 rounded-lg text-gray-700 focus:outline-none" />
        </div>
      </div>
    </div>

    {#if profilePhotoFile}
      <div class="mt-4">
        <p class="text-sm text-indigo-600">New photo selected: {profilePhotoFile.name}</p>
        <div class="mt-2 flex space-x-2">
          <button type="submit" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300">
            Save Photo
          </button>
          <button type="button" on:click={cancelPhotoUpload} class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300">
            Cancel
          </button>
        </div>
      </div>
    {/if}
  </form>
</div>