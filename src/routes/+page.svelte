<script>
    import '$lib/styles/app.css'

    // Department boxes data
    const departments = [
      { name: 'Accountant', value: '₹1.2M', change: '+8.1%' },
      { name: 'Logistics', value: '320', change: '-2.5%' },
      { name: 'Material to Procure', value: '₹450K', change: '+12.3%' },
      { name: 'Warehouse', value: '85%', change: '+0.5%' },
    ];
  
    // Table data
    const employeeData = [
      { id: 1, name: 'Ashlesha Nakti', email: 'ashley@gmail.com', role: 'Manager' },
      { id: 2, name: 'Shruti Lokhande', email: 'shruti@gmail.com', role: 'Developer' },
      { id: 3, name: 'Sony Dubey', email: 'soni@gmail.com', role: 'Designer' },
    ];
  
    // Log data
    let logs = [
      { timestamp: '2023-07-10 10:30:15', action: 'User logged in', user: 'ashley@gmail.com' },
      { timestamp: '2023-07-10 11:15:22', action: 'Report generated', user: 'shruti@gmail.com' },
      { timestamp: '2023-07-10 12:05:48', action: 'New item added to inventory', user: 'soni@gmail.com' },
    ];
  </script>
  
  <main class="bg-gray-100 min-h-screen">
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>
    </header>
      
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Department Boxes -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {#each departments as dept}
          <div class="bg-white overflow-hidden shadow rounded-lg transition duration-300 ease-in-out hover:shadow-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      {dept.name}
                    </dt>
                    <dd>
                      <div class="text-lg font-medium text-gray-900">
                        {dept.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-5 py-3">
              <div class="text-sm">
                <span class={dept.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                  {dept.change}
                </span>
                <span class="text-gray-500 ml-2">from last month</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Data Table -->
      <div class="mb-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            Employee Data
          </h3>
        </div>
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each employeeData as row}
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.id}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{row.name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{row.email}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.role}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      <!-- Log Container -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            Activity Log
          </h3>
        </div>
        <div class="px-4 py-5 sm:p-6">
          <div class="space-y-4">
            {#each logs as log}
              <div class="flex space-x-3">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-gray-900">
                    {log.action}
                  </p>
                  <p class="text-sm text-gray-500">
                    {log.user} - {log.timestamp}
                  </p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </main>
  
  <style global>
    @import 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
  </style>