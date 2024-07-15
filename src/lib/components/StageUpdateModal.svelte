<script lang="ts">
  // Import necessary Svelte and custom modules
  import { createEventDispatcher } from 'svelte';
  import type { SalesOrder } from '$lib/types';
  import type { PageData } from '../../routes/$types';

  // Define props and create event dispatcher
  export let data: PageData;
  export let salesOrder: SalesOrder;
  const dispatch = createEventDispatcher();

  // Define LineItem interface
  interface LineItem {
    name: string;
    quantity: number;
    unit: string;
    rate: number;
    item_total: number;
    status: string;
  }

  // Initialize stage data
  let currentStage = 0;
  let stageData = [
    { title: 'Stage 0. Site Not Ready', completed: false },
    { title: 'Stage 1. Logistics', completed: false },
    { title: 'Stage 2. Material to Procure', completed: false },
    { title: 'Stage 3. On Going', completed: false },
    { title: 'Stage 4. Return Pickup', completed: false, visible: false },
  { title: 'Stage 5. Share with Account', completed: false }
];

  // Initialize form variables
  let soCategory = '';
  let projectManagerName = '';
  let isEditing = true;
  let partialDelivery = false;
  let canAccessNextStage = false;

  let notAvailableItems: LineItem[] = [];

  // Map line items with status
  let lineItemsWithStatus: LineItem[] = salesOrder.line_items.map(item => ({
    ...item,
    status: ''
  }));
  
  // Reactive declarations
  $: allStatusesFilled = lineItemsWithStatus.every(item => item.status !== '');
  $: partialDelivery = lineItemsWithStatus.some(item => item.status === 'not_available');

  let dcOrderTotal = { subtotal: 0, igst: 0, total: 0 };

  let frozenLineItems: { [key: number]: boolean } = {};

  // Define DCBox interface
  interface DCBox {
    trackingNo: string;
    dispatchedDate: string;
    deliveryDate: string;
    dcAmount: number;
    attachment: File | null;
    lineItemCount: number;
    isSaved: boolean;
  }

  // Initialize dcBoxes array
  let dcBoxes: DCBox[] = [{ 
    trackingNo: '', 
    dispatchedDate: '', 
    deliveryDate: '', 
    dcAmount: 0, 
    attachment: null, 
    lineItemCount: 0, 
    isSaved: false 
  }];
  let dcCounter = 1;

  // Function to close the modal
  function closeModal() {
    dispatch('close');
  }

  // Get project managers from data
  $: projectManagers = data.user;

  // Function to calculate DC amount
  function calculateDCAmount(dcIndex: number) {
    return lineItemsWithStatus
      .filter((item, index) => 
        (item.status === 'available' || item.status === 'need_to_purchase') && 
        !frozenLineItems[index] &&
        index >= (dcIndex > 0 ? dcBoxes[dcIndex - 1].lineItemCount : 0)
      )
      .reduce((sum, item) => sum + item.item_total, 0);
  }


  let returnPickupRequested = false;
let showConfirmationPopup = false;
let showReturnPickupConfirmation = false;

$: {
  if (returnPickupRequested) {
    stageData[4].visible = true;
  } else {
    stageData[4].visible = false;
  }
}

  // Function to handle form submission
  function handleSubmit(event: Event) {
  event.preventDefault();
  showConfirmationPopup = true;
}

function confirmSubmit() {
  showConfirmationPopup = false;
  
  switch (currentStage) {
    case 0:
      if (!soCategory || !projectManagerName) {
        alert('Please fill in SO Category and Project Manager Name.');
        return;
      }
      break;
    case 1:
      if (!allStatusesFilled) {
        alert('Please select a status for all line items before submitting.');
        return;
      }
      if (!isCurrentDCFilled()) {
        alert('Please fill all fields in the current DC before submitting.');
        return;
      }
      updateDCAmount(dcBoxes.length - 1);
      updateDCOrderTotal();
      saveCurrentState();
      alert('Logistics stage completed successfully.');
      break;
    case 2:
      // Add any specific checks for Material to Procure stage
      alert('Material to Procure stage completed successfully.');
      break;
      case 3:
      alert("Ongoing stage has completed");
      goToNextStage();
      break;
    case 4:
    if (stageData[4].visible) {
        if (isReturnPickupComplete()) {
          alert("Return Pickup details submitted successfully.");
          stageData[4].completed = true;
          currentStage = 5; // Move to Share with Account stage
        } else {
          alert("Please fill up all the Return Pickup details. Ensure the mobile number is 10 digits long.");
          return;
        }
      } else {
        // Handle the case when Return Pickup is not visible (skipped)
        alert("Moving to Share with Account stage.");
        currentStage = 5;
      }
      break;
    case 5:
      alert("Share with Account stage completed successfully.");
      break;
  }

  stageData[currentStage].completed = true;
  
}

  // Function to edit stage
  function editStage() {
    isEditing = true;
  }

  // Function to format currency
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Function to update DC order total
  function updateDCOrderTotal() {
    dcOrderTotal.subtotal = lineItemsWithStatus
      .filter(item => item.status === 'available' || item.status === 'need_to_purchase')
      .reduce((sum, item) => sum + item.item_total, 0);
  }

  // Function to save current state
  function saveCurrentState() {
    console.log('Saving current state:', {
      lineItems: lineItemsWithStatus,
      dcOrderTotal,
      partialDelivery,
      dcBoxes
    });
    // Implement actual saving logic here
  }

  // Function to handle save action
  function handleSave() {
    if (!allStatusesFilled) {
      alert('Please select a status for all line items before saving.');
      return;
    }

    if (!isCurrentDCFilled()) {
      alert('Please fill all fields in the current DC before saving.');
      return;
    }

    // Mark only the current DC as saved
    dcBoxes[dcBoxes.length - 1].isSaved = true;
    dcBoxes = dcBoxes; // Trigger reactivity

    // Freeze the status of items marked as "Available" or "Need to purchase locally"
    lineItemsWithStatus.forEach((item, index) => {
      if (item.status === 'available' || item.status === 'need_to_purchase' ||  item.status === 'not_required') {
        frozenLineItems[index] = true;
      }
    });

    notAvailableItems = lineItemsWithStatus.filter(item => item.status === 'not_available');

    updateDCAmount(dcBoxes.length - 1);
    saveCurrentState();
    canAccessNextStage = true;
    alert('Progress saved. You can now access the next stage or add more DCs.');
  }

  // Function to remove DC
  function removeDC(index: number) {
    if (index > 0 && !dcBoxes[index].isSaved) {
      dcBoxes.splice(index, 1);
      dcBoxes = dcBoxes; // Trigger reactivity
    }
  }

  // Functions for stage navigation
  function canMoveToPreviousStage(currentStage: number): boolean {
    return currentStage === 2;  // Only allow moving back from Stage 2 to Stage 1
  }

  function canMoveToNextStage(currentStage: number): boolean {
    return false;  // Disable moving to next stage via button
  }

  function moveToPreviousStage() {
    if (canMoveToPreviousStage(currentStage)) {
      currentStage--;
    }
  }

  // Function to add more DC
  function addMoreDC() {
    if (!isCurrentDCFilled()) {
      alert('Fill up and save the current DC before adding a new one.');
      return;
    }

    dcCounter++;
    dcBoxes.push({ 
      trackingNo: '', 
      dispatchedDate: '', 
      deliveryDate: '', 
      dcAmount: 0, 
      attachment: null, 
      lineItemCount: 0, 
      isSaved: false 
    });
    dcBoxes = dcBoxes; // Trigger reactivity
  }

  // Function to check if current DC is filled
  function isCurrentDCFilled() {
    const currentDC = dcBoxes[dcBoxes.length - 1];
    return currentDC.trackingNo && currentDC.dispatchedDate && currentDC.deliveryDate && (currentDC.attachment || fileName || filePreviewUrl);
  }

  // Function to update DC amount
  function updateDCAmount(dcIndex: number) {
    dcBoxes[dcIndex].dcAmount = calculateDCAmount(dcIndex);
    dcBoxes[dcIndex].lineItemCount = lineItemsWithStatus.filter((item, index) => frozenLineItems[index]).length;
    dcBoxes = dcBoxes; // Trigger reactivity
  }

  // Reactive statement for partial delivery and DC order total
  $: {
    partialDelivery = lineItemsWithStatus.some(item => item.status === 'not_available');
    updateDCOrderTotal();
  }

  // Function to set max dispatch date
  function setMaxDispatchDate() {
    const dispatchedDateInput = document.getElementById('dispatched-date') as HTMLInputElement;
    if (dispatchedDateInput) {
      dispatchedDateInput.max = new Date().toISOString().split('T')[0];
    }
  }

  // Function to update min delivery date
  function updateMinDeliveryDate() {
    const dispatchedDateInput = document.getElementById('dispatched-date') as HTMLInputElement;
    const deliveryDateInput = document.getElementById('delivery-date') as HTMLInputElement;
    
    if (dispatchedDateInput && deliveryDateInput) {
      deliveryDateInput.min = dispatchedDateInput.value;
      
      // If the current delivery date is before the new min date, reset it
      if (deliveryDateInput.value && deliveryDateInput.value < deliveryDateInput.min) {
        deliveryDateInput.value = '';
      }
    }
  }

  // Function to validate file input
  function validateFileInput(input: HTMLInputElement) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
    const file = input.files?.[0];
    
    if (file && !allowedTypes.includes(file.type)) {
      alert('Please select a PDF or image file.');
      input.value = ''; // Clear the input
    }
  }

  // Function to setup event listeners
  function setupEventListeners() {
    const dispatchedDateInput = document.getElementById('dispatched-date') as HTMLInputElement;
    const attachmentInput = document.getElementById('attachment') as HTMLInputElement;
    
    if (dispatchedDateInput) {
      dispatchedDateInput.addEventListener('change', updateMinDeliveryDate);
    }
    
    if (attachmentInput) {
      attachmentInput.addEventListener('change', () => validateFileInput(attachmentInput));
    }
  }
    
  // Variables for date handling
  let dispatchedDate: string = '';
  let deliveryDate: string = '';

  // Reactive statement for date validation
  $: if (dispatchedDate) {
    // Ensure delivery date is not before dispatched date
    if (deliveryDate && deliveryDate < dispatchedDate) {
      deliveryDate = '';
    }
  }

  // Variables for file handling
  let filePreviewUrl: string | null = null;
  let fileName: string = '';

  // Function to handle file change
  function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      fileName = file.name;
      filePreviewUrl = URL.createObjectURL(file);
    } else {
      fileName = '';
      filePreviewUrl = null;
    }
  }


  // Function to open preview modal
  function openPreviewModal() {
    if (filePreviewUrl) {
      const modal = document.getElementById('previewModal');
      const previewImage = document.getElementById('previewImage') as HTMLImageElement;
      const previewIframe = document.getElementById('previewIframe') as HTMLIFrameElement;
      
      if (modal && previewImage && previewIframe) {
        modal.style.display = 'block';
        if (fileName.toLowerCase().endsWith('.pdf')) {
          previewIframe.src = filePreviewUrl;
          previewIframe.style.display = 'block';
          previewImage.style.display = 'none';
        } else {
          previewImage.src = filePreviewUrl;
          previewImage.style.display = 'block';
          previewIframe.style.display = 'none';
        }
      }
    }
  }
  // Function to close preview modal
  function closePreviewModal() {
    const modal = document.getElementById('previewModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

 
  // For downloading from a URL (Stage 1)
function downloadFileFromUrl(url: string | null, fileName: string) {
  if (url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    console.error('No file URL available for download');
    // Optionally, you can show an alert to the user
    // alert('No file available for download');
  }
}

  // Function to go to next page
  function goToNextPage() {
    if (currentStage < stageData.length - 1) {
      currentStage++;
    }
  }

    // Stage 3 variables
    let shipments: any[] = [{ isSaved: false, activeTab: 'installation' }];
    $: console.log('Shipments:', shipments);


function validateMobileNumber(number: string): boolean {
  const regex = /^\d{10}$/;
  return regex.test(number);
}


function saveShipment(index: number) {
  const shipment = shipments[index];
  if (isShipmentValid(shipment)) {
    shipment.isSaved = true;
    shipments = [...shipments];
    alert(`${shipment.activeTab === 'installation' ? 'Installation' : 'Service'} details saved successfully.`);
  } else {
    alert(`Please fill up all the ${shipment.activeTab === 'installation' ? 'installation' : 'service'} details before saving.`);
  }
}

function isShipmentValid(shipment: any): boolean {
  if (shipment.activeTab === 'installation') {
    return shipment.engineerName && shipment.scheduleDate && 
           shipment.mobileNumber && shipment.mobileNumber.length === 10 &&
           shipment.vendorName && shipment.installationRemarks && shipment.installationFile;
  } else {
    return shipment.serviceEngineerName && shipment.serviceScheduleDate && 
           shipment.serviceMobileNumber && shipment.serviceMobileNumber.length === 10 &&
           shipment.serviceVendorName && shipment.serviceRemarks && 
           shipment.serviceFile && shipment.serviceTicketId;
  }
}

function addMoreShipment() {
  if (shipments[shipments.length - 1].isSaved) {
    shipments = [...shipments, { isSaved: false, activeTab: 'installation' }];
  } else {
    alert("Please fill up and save the details of the current shipment before adding a new one.");
  }
}

function removeShipment(index: number) {
  if (index > 0 && !shipments[index].isSaved) {
    shipments = shipments.filter((_, i) => i !== index);
  }
}


function handleStage3FileChange(event: Event, type: 'installation' | 'service', index: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file && !shipments[index].isSaved) {
      if (type === 'installation') {
        shipments[index].installationFile = file;
      } else {
        shipments[index].serviceFile = file;
      }
      shipments = [...shipments]; // Trigger reactivity
    }
  }

  function previewFile(file: File | string | null) {
  if (!file) return;

  const fileUrl = typeof file === 'string' ? file : URL.createObjectURL(file);
  const fileName = typeof file === 'string' ? 'file' : file.name;
  
  const modal = document.getElementById('filePreviewModal');
  const iframe = document.getElementById('filePreviewFrame') as HTMLIFrameElement;

  if (modal && iframe) {
    iframe.src = fileUrl;
    modal.style.display = 'block';
  }
}

function downloadFile(file: File | string | null) {
  if (!file) return;

  const fileUrl = typeof file === 'string' ? file : URL.createObjectURL(file);
  const fileName = typeof file === 'string' ? 'file' : file.name;

  const a = document.createElement('a');
  a.href = fileUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (typeof file !== 'string') {
    URL.revokeObjectURL(fileUrl);
  }
}

function closeFilePreviewModal() {
  const modal = document.getElementById('filePreviewModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function handleMobileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').slice(0, 10);
  }

  function goToPreviousStage() {
  if (currentStage > 0) {
    currentStage--;
  }
}

function goToNextStage() {
  if (currentStage < stageData.length - 1) {
    if (currentStage === 3 && returnPickupRequested) {
      currentStage = 4;
    } else if (currentStage === 3 && !returnPickupRequested) {
      currentStage = 5;
    } else {
      currentStage++;
    }
  }
}

let returnPickupName = '';
let returnPickupMobile = '';
let returnPickupRemark = '';
let returnPickupFile: File | null = null;
let returnPickupFileName = '';
let returnPickupFilePreviewUrl: string | null = null;

function handleReturnPickupMobileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  returnPickupMobile = input.value.replace(/\D/g, '').slice(0, 10);
}

function handleReturnPickupFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (file) {
    returnPickupFile = file;
    returnPickupFileName = file.name;
    returnPickupFilePreviewUrl = URL.createObjectURL(file);
  } else {
    returnPickupFile = null;
    returnPickupFileName = '';
    returnPickupFilePreviewUrl = null;
  }
}

function isReturnPickupComplete() {
  return (
    returnPickupName.trim() !== '' &&
    returnPickupMobile.length === 10 &&
    returnPickupRemark.trim() !== '' &&
    returnPickupFile !== null
  );
}


</script>
<style>
  .modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0,0,0,0.4);
  }

  .modal-content {
    background-color: #fefefe;
    margin: 15% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
    max-width: 800px;
  }

  .close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
  }

  .close:hover,
  .close:focus {
    color: black;
    text-decoration: none;
    cursor: pointer;
  }
</style>

<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" on:click|self={closeModal}>
  <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
    <h2 class="text-2xl font-bold mb-4">Update Stage</h2>
    
    <!-- Stage navigation -->
    <div class="mb-4 flex space-x-2">
      {#each stageData as stage, index}
      {#if index !== 4 || stage.visible}
      <button
        class="px-3 py-1 rounded {currentStage === index ? 'bg-blue-500 text-white' : 'bg-gray-200'}"
        on:click={() => currentStage = index}
        disabled={!stage.completed && index !== currentStage}
      >
        {stage.title}
      </button>
    {/if}
      {/each}
    </div>
    <form on:submit={handleSubmit}>
      <!-- Stage header -->
      <h3 class="text-xl font-bold mb-4">{stageData[currentStage].title}</h3>

      {#if currentStage === 0}
        <!-- API data fields -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" for="so_number">
              SO Number
            </label>
            <input id="so_number" type="text" value={salesOrder.salesorder_number} readonly class="w-full px-3 py-2 border rounded-md bg-gray-100">
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" for="so_date">
              SO Date
            </label>
            <input id="so_date" type="text" value={new Date(salesOrder.date).toLocaleDateString()} readonly class="w-full px-3 py-2 border rounded-md bg-gray-100">
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" for="client_name">
              Client Name
            </label>
            <input id="client_name" type="text" value={salesOrder.customer_name} readonly class="w-full px-3 py-2 border rounded-md bg-gray-100">
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" for="purchase_order">
              Purchase Order
            </label>
            <input id="purchase_order" type="text" value={salesOrder.reference_number} readonly class="w-full px-3 py-2 border rounded-md bg-gray-100">
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" for="so_subtotal">
              SO Subtotal
            </label>
            <input id="so_subtotal" type="text" value={formatCurrency(salesOrder.sub_total)} readonly class="w-full px-3 py-2 border rounded-md bg-gray-100">
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" for="so_total">
              SO Total
            </label>
            <input id="so_total" type="text" value={formatCurrency(salesOrder.total)} readonly class="w-full px-3 py-2 border rounded-md bg-gray-100">
          </div>
        </div>

        <!-- Stage-specific fields -->
  <div class="mb-4 grid grid-cols-2 gap-4">
    <div>
      <label class="block text-gray-700 text-sm font-bold mb-2" for="so_category">
        SO Category *
      </label>
      <select 
        id="so_category" 
        bind:value={soCategory} 
        class="w-full px-3 py-2 border rounded-md" 
        disabled={!isEditing} 
        required
      >
        <option value="">Select SO Category</option>
        <option value="CAPEX Project">CAPEX Project</option>
        <option value="OPEX Project">OPEX Project</option>
        <option value="CAPEX Project ABSW">CAPEX Project ABSW</option>
        <option value="OPEX Project ABSW">OPEX Project ABSW</option>
        <option value="Replacement under Warranty">Replacement under Warranty</option>
        <option value="CAPEX Service">CAPEX Service</option>
        <option value="CAPEX Service - ABSW">CAPEX Service - ABSW</option>
        <option value="FOC-POC">FOC-POC</option>
        <option value="OPEX Service">OPEX Service</option>
        <option value="CAMC">CAMC</option>
      </select>
    </div>
    <div>
      <label class="block text-gray-700 text-sm font-bold mb-2" for="project_manager">
        Project Manager Name *
      </label>
      <select 
        id="project_manager" 
        bind:value={projectManagerName} 
        class="w-full px-3 py-2 border rounded-md" 
        disabled={!isEditing} 
        required
      >
        <option value="">Select Project Manager</option>
        {#each data.user.name as name}
          <option value={name}>{name}</option>
        {/each}
      </select>
    </div>
    
  </div>
   
        
        {:else if currentStage === 1}
          <!-- Logistics stage content -->
          <div class="mb-4">
            <h4 class="text-lg font-bold mb-2">Line Items</h4>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each lineItemsWithStatus as item, index}
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity} {item.unit}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.rate)}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.item_total)}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <select bind:value={lineItemsWithStatus[index].status} class=" w-32 px-2 py-1 border rounded-md" disabled={frozenLineItems[index]} >
                          <option value="">Select status</option>
                          <option value="available">Available</option>
                          <option value="not_available">Not Available</option>
                          <option value="need_to_purchase">Need to purchase locally</option>
                          <option value="not_required">Not Required</option>
                        </select>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        <!-- Partial Delivery toggle -->
  {#if lineItemsWithStatus.some(item => item.status === 'not_available')}
  <div class="mt-4">
    <label class="inline-flex items-center">
      <input type="checkbox" bind:checked={partialDelivery} class="form-checkbox">
      <span class="ml-2">Partial Delivery</span>
    </label>
  </div>
{/if}


<!-- DC Order Total section -->

<div class="mt-4">
  <h4 class="text-lg font-bold mb-2 inline-block mr-2">DC Amount:</h4>
  <p class="inline-block">{formatCurrency(dcOrderTotal.subtotal)}</p>
</div>

<!-- Add More DC Button -->
{#if partialDelivery}
<button 
  type="button" 
  on:click={addMoreDC} 
  class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
>
  Add more +
</button>
{/if}

<!-- DC Boxes -->
{#each dcBoxes as dc, index}
<div class="bg-white bg-opacity-50 p-6 rounded-lg shadow-md mb-8 relative">
  {#if !dc.isSaved && index !== 0}
    <button
      type="button"
      class="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
      on:click={() => removeDC(index)}
    >
      ×
    </button>
  {/if}
  <h3 class="text-xl font-semibold mb-4">DC {index + 1}</h3>
  <div class="flex justify-center mb-8">
    <div class="bill-type-buttons flex gap-6">
      <button
        class="px-8 py-3 border rounded-lg shadow-md {dc.dcAmount < 50000 ? 'bg-green-500 text-white border-green-500' : 'bg-white border-gray-300 text-gray-700'}"
      >
        DC Bill
      </button>
      <button
        class="px-8 py-3 border rounded-lg shadow-md {dc.dcAmount >= 50000 ? 'bg-green-500 text-white border-green-500' : 'bg-white border-gray-300 text-gray-700'}"
      >
        E-way Bill
      </button>
    </div>
  </div>

  <div class="space-y-4">
    <div class="flex space-x-4">
      <div class="flex-1">
        <label for="tracking-no-{index}" class="block text-sm font-medium text-gray-700">Courier's tracking no.:</label>
        <input type="text" id="tracking-no-{index}" bind:value={dc.trackingNo} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={dc.isSaved}>
      </div>

      <div class="flex-1">
        <label for="dispatched-date-{index}" class="block text-sm font-medium text-gray-700">Dispatched date:</label>
        <input type="date" id="dispatched-date-{index}" bind:value={dc.dispatchedDate} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" max={new Date().toISOString().split('T')[0]} required disabled={dc.isSaved}>
      </div>

      <div class="flex-1">
        <label for="delivery-date-{index}" class="block text-sm font-medium text-gray-700">Delivery date:</label>
        <input type="date" id="delivery-date-{index}" bind:value={dc.deliveryDate} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" min={dc.dispatchedDate} required disabled={dc.isSaved}>
      </div>

      <div class="flex-1">
        <label for="dc-amount-{index}" class="block text-sm font-medium text-gray-700">DC Amount:</label>
        <p id="dc-amount-{index}" class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-gray-100 rounded-md shadow-sm" >{formatCurrency(dcOrderTotal.subtotal)}</p>
      </div>
    </div>

    <div class="flex-1">
      <label for="attachment" class="block text-sm font-medium text-gray-700">Attachment:</label>
      <input 
        type="file" 
        id="attachment" 
        on:change={handleFileChange}
        class="mt-1 block w-full" 
        accept="application/pdf,image/*" 
        required 
        disabled={dcBoxes[dcBoxes.length - 1].isSaved}
      >
      {#if filePreviewUrl}
        <div class="mt-2">
          <button 
            type="button" 
            on:click={openPreviewModal}
            class="text-blue-600 hover:text-blue-800 mr-2"
          >
            Preview {fileName}
          </button>
          <button 
          type="button" 
          on:click={() => downloadFileFromUrl(filePreviewUrl, fileName)}
          class="text-green-600 hover:text-green-800"
        >
          Download
        </button>
        </div>
      {/if}
    </div>
    
    <!-- Preview Modal -->
    <div id="previewModal" class="modal" style="display:none; position:fixed; z-index:1; left:0; top:0; width:100%; height:100%; overflow:auto; background-color:rgba(0,0,0,0.4);">
      <div class="modal-content" style="background-color:#fefefe; margin:15% auto; padding:20px; border:1px solid #888; width:80%;">
        <span class="close" on:click={closePreviewModal} style="color:#aaa; float:right; font-size:28px; font-weight:bold; cursor:pointer;">&times;</span>
        <img id="previewImage" alt="File preview" style="max-width:100%; max-height:70vh; display:none;">
        <iframe id="previewIframe" style="width:100%; height:70vh; display:none;"></iframe>
      </div>
    </div>
  </div>
</div>

{/each}



  
  <div class="flex justify-between mt-4">
  <div class="space-x-2">
    <button 
      type="button" 
      on:click={handleSave} 
      class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      disabled={!allStatusesFilled}
    >
      Save
    </button>
    <!-- <button 
      type="submit" 
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      disabled={!allStatusesFilled}
    >
      Submit
    </button> -->
  </div>
</div>
        {:else if currentStage === 2}
          <!-- Material to Procure stage content -->
  <div class="mb-4">
    <h4 class="text-lg font-bold mb-2">Not Available Items</h4>
    {#if notAvailableItems.length > 0}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each notAvailableItems as item, index}
      <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity} {item.unit}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.rate)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.item_total)}</td>
      </tr>
    {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p>No items marked as not available.</p>
    {/if}
  </div>

 
  {:else if currentStage === 3}
   <!-- On Going stage content -->
   <div class="relative pb-16">
   <div class="mb-4">
    <h4 class="text-lg font-bold mb-2">On Going</h4>
    {#each shipments as shipment, index}
      <div class="mb-8 p-4 border rounded-lg relative">
        <h5 class="text-lg font-semibold mb-4">Shipment {index + 1}</h5>
        
        {#if index > 0 && !shipment.isSaved}
          <button 
            type="button" 
            on:click={() => removeShipment(index)}
            class="absolute top-2 right-2 text-red-500 font-bold text-xl"
          >
            ×
          </button>
        {/if}

        <!-- Toggle buttons for Installation and Service -->
        <div class="flex justify-center mb-4">
          <button
            class="px-4 py-2 {shipment.activeTab === 'installation' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-l"
            on:click={() => {
              if (!shipment.isSaved) {
                shipment.activeTab = 'installation';
                shipments = [...shipments];
              }
            }}
            disabled={shipment.isSaved}
          >
            Installation
          </button>
          <button
            class="px-4 py-2 {shipment.activeTab === 'service' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-r"
            on:click={() => {
              if (!shipment.isSaved) {
                shipment.activeTab = 'service';
                shipments = [...shipments];
              }
            }}
            disabled={shipment.isSaved}
          >
            Service
          </button>
        </div>

        {#if shipment.activeTab === 'installation'}
          <!-- Installation fields -->
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="engineer-name-{index}" class="block text-sm font-medium text-gray-700">Engineer name:</label>
                <input type="text" id="engineer-name-{index}" bind:value={shipment.engineerName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={shipment.isSaved}>
              </div>
              <div>
                <label for="schedule-date-{index}" class="block text-sm font-medium text-gray-700">Schedule date:</label>
                <input type="date" id="schedule-date-{index}" bind:value={shipment.scheduleDate} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={shipment.isSaved}>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="mobile-number-{index}" class="block text-sm font-medium text-gray-700">Mobile number:</label>
                <input 
                  type="tel" 
                  id="mobile-number-{index}" 
                  bind:value={shipment.mobileNumber} 
                  on:input={handleMobileInput}
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
                  pattern="[0-9]{10}"
                  maxlength="10"
                  required
                  disabled={shipment.isSaved}
                >
              </div>
              <div>
                <label for="vendor-name-{index}" class="block text-sm font-medium text-gray-700">Vendor name:</label>
                <input type="text" id="vendor-name-{index}" bind:value={shipment.vendorName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={shipment.isSaved}>
              </div>
            </div>
            <div>
              <label for="installation-remarks-{index}" class="block text-sm font-medium text-gray-700">Installation remarks:</label>
              <textarea id="installation-remarks-{index}" bind:value={shipment.installationRemarks} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" rows="3" disabled={shipment.isSaved}></textarea>
            </div>
            <div>
              <label for="installation-report-{index}" class="block text-sm font-medium text-gray-700">Installation report attachment:</label>
              <input type="file" id="installation-report-{index}" on:change={(e) => handleStage3FileChange(e, 'installation', index)} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" class="mt-1 block w-full" required disabled={shipment.isSaved}>
              {#if shipment.installationFile}
                <div class="mt-2">
                  <button 
                    type="button" 
                    on:click={() => previewFile(shipment.installationFile)}
                    class="text-blue-600 hover:text-blue-800 mr-2"
                  >
                    Preview
                  </button>
                  <button 
                    type="button" 
                    on:click={() => downloadFile(shipment.installationFile)}
                    class="text-green-600 hover:text-green-800"
                  >
                    Download
                  </button>
                </div>
              {/if}
            </div>
          </div>
        {:else}
          <!-- Service fields -->
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="service-engineer-name-{index}" class="block text-sm font-medium text-gray-700">Engineer name:</label>
                <input type="text" id="service-engineer-name-{index}" bind:value={shipment.serviceEngineerName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={shipment.isSaved}>
              </div>
              <div>
                <label for="service-schedule-date-{index}" class="block text-sm font-medium text-gray-700">Schedule date:</label>
                <input type="date" id="service-schedule-date-{index}" bind:value={shipment.serviceScheduleDate} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={shipment.isSaved}>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="service-mobile-number-{index}" class="block text-sm font-medium text-gray-700">Mobile number:</label>
                <input 
                  type="tel" 
                  id="service-mobile-number-{index}" 
                  bind:value={shipment.serviceMobileNumber} 
                  on:input={handleMobileInput}
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
                  pattern="[0-9]{10}"
                  maxlength="10"
                  required
                  disabled={shipment.isSaved}
                >
              </div>
              <div>
                <label for="service-vendor-name-{index}" class="block text-sm font-medium text-gray-700">Vendor name:</label>
                <input type="text" id="service-vendor-name-{index}" bind:value={shipment.serviceVendorName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={shipment.isSaved}>
              </div>
            </div>
            <div>
              <label for="service-remarks-{index}" class="block text-sm font-medium text-gray-700">Service remarks:</label>
              <textarea id="service-remarks-{index}" bind:value={shipment.serviceRemarks} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" rows="3" disabled={shipment.isSaved}></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="service-report-{index}" class="block text-sm font-medium text-gray-700">Service report attachment:</label>
                <input type="file" id="service-report-{index}" on:change={(e) => handleStage3FileChange(e, 'service', index)} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" class="mt-1 block w-full" required disabled={shipment.isSaved}>
                {#if shipment.serviceFile}
                  <div class="mt-2">
                    <button 
                      type="button" 
                      on:click={() => previewFile(shipment.serviceFile)}
                      class="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      Preview
                    </button>
                    <button 
                      type="button" 
                      on:click={() => downloadFile(shipment.serviceFile)}
                      class="text-green-600 hover:text-green-800"
                    >
                      Download
                    </button>
                  </div>
                {/if}
              </div>
              <div>
                <label for="service-ticket-id-{index}" class="block text-sm font-medium text-gray-700">Service ticket Id:</label>
                <input type="text" id="service-ticket-id-{index}" bind:value={shipment.serviceTicketId} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={shipment.isSaved}>
              </div>
            </div>
          </div>
        {/if}

        {#if !shipment.isSaved}
          <button 
            type="button" 
            on:click={() => saveShipment(index)}
            class="mt-4 absolute down-2 right-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Save 
          </button>
        {/if}
      </div>
    {/each}

    {#if partialDelivery && shipments[shipments.length - 1].isSaved}
      <button 
        type="button" 
        on:click={addMoreShipment}
        class="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add more +
      </button>
    {/if}
  </div>
  
  <!-- File Preview Modal -->
  <div id="filePreviewModal" class="modal" style="display: none;">
    <div class="modal-content">
      <span class="close" on:click={closeFilePreviewModal}>&times;</span>
      <iframe id="filePreviewFrame" style="width: 100%; height: 500px;"></iframe>
    </div>
  </div>
        
        <!-- Return Pickup toggle button -->
        <button 
        type="button" 
        on:click={() => showReturnPickupConfirmation = true}
        class="mt-4 mb-4 px-4 py-2 {returnPickupRequested ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded absolute bottom-2 left-2"
      >
        {returnPickupRequested ? 'Cancel Return Pickup' : 'Request Return Pickup'}
      </button>


{#if showReturnPickupConfirmation}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <h3 class="text-lg font-bold mb-4">Confirmation</h3>
      <p class="mb-4">Are you sure you want to {returnPickupRequested ? 'cancel' : 'add'} Return Pickup details?</p>
      <div class="flex justify-end">
        <button 
          on:click={() => showReturnPickupConfirmation = false}
          class="mr-2 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button 
          on:click={() => {
            returnPickupRequested = !returnPickupRequested;
            showReturnPickupConfirmation = false;
            if (returnPickupRequested) {
              alert("For Return Pickup details, move to the next stage.");
            }
          }}
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
{/if}

   </div>

   
        {:else if currentStage === 4 && stageData[4].visible}
        <div class="space-y-4">
          <h4 class="text-lg font-bold mb-2">Return Pickup</h4>
          
          <div class="flex space-x-4">
            <div class="flex-1">
              <label for="return-pickup-name" class="block text-sm font-medium text-gray-700">Name:</label>
              <input 
                type="text" 
                id="return-pickup-name" 
                bind:value={returnPickupName} 
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
                required
              >
            </div>
            <div class="flex-1">
              <label for="return-pickup-mobile" class="block text-sm font-medium text-gray-700">Mobile Number:</label>
              <input 
                type="tel" 
                id="return-pickup-mobile" 
                bind:value={returnPickupMobile} 
                on:input={handleReturnPickupMobileInput}
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
                maxlength="10"
                required
              >
            </div>
          </div>
      
          <div>
            <label for="return-pickup-remark" class="block text-sm font-medium text-gray-700">Remark:</label>
            <textarea 
              id="return-pickup-remark" 
              bind:value={returnPickupRemark} 
              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
              rows="3" 
              required
            ></textarea>
          </div>
      
          <div>
            <label for="return-pickup-attachment" class="block text-sm font-medium text-gray-700">Attachment:</label>
            <input 
              type="file" 
              id="return-pickup-attachment" 
              on:change={handleReturnPickupFileChange} 
              accept=".pdf,.jpg,.jpeg,.png" 
              class="mt-1 block w-full" 
              required
            >
            {#if returnPickupFilePreviewUrl}
              <div class="mt-2">
                <button 
                  type="button" 
                  on:click={() => previewFile(returnPickupFile)}
                  class="text-blue-600 hover:text-blue-800 mr-2"
                >
                  Preview {returnPickupFileName}
                </button>
                <button 
                  type="button" 
                  on:click={() => downloadFile(returnPickupFile)}
                  class="text-green-600 hover:text-green-800"
                >
                  Download
                </button>
              </div>
            {/if}
          </div>
        </div>

          {:else if currentStage === (stageData[4].visible ? 5 : 4)}
          <!-- Share with Account stage content -->
          <h4 class="text-lg font-bold mb-2">Share with Account</h4>
        {/if}

        {#if showConfirmationPopup}
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 class="text-lg font-bold mb-4">Confirmation</h3>
            <p class="mb-4">Are you sure you want to submit {stageData[currentStage].title}?</p>
            <div class="flex justify-end">
              <button 
                on:click={() => showConfirmationPopup = false}
                class="mr-2 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button 
                on:click={confirmSubmit}
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      {/if}

       <!-- Submit and Edit buttons -->
       <div class="flex justify-end mt-4 space-x-2">
        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Submit
        </button>
         <!-- Previous Stage button -->
      <button 
      type="button" 
      on:click={goToPreviousStage}
      class="mt-4 mb-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded absolute bottom-2 left-3"
      >
      Previous Stage
      </button>

        <!-- Next Stage button -->
        <button 
        type="button" 
        on:click={goToNextStage}
        class="mt-4 mb-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded absolute bottom-2 left-40"
        >
        Next Stage
        </button>
        {#if stageData[currentStage].completed}
          <button type="button" on:click={editStage} class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">
            Edit
          </button>
        {/if}
      </div>
    </form>
  </div>
</div>