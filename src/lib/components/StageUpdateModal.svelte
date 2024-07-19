<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<script lang="ts">
  
  // Imports
  import { createEventDispatcher, onMount } from 'svelte';
  import type { SalesOrder } from '$lib/types';
  import type { PageData } from '../../routes/$types';
  import { slide } from 'svelte/transition';
  import { logStore, type LogEntry } from '../stores/LogStore';

  // Add these properties
  export let username: string;
  export let userRole: string;

  function handleFieldUpdate(fieldName: string, oldValue: string, newValue: string) {
    const logEntry: LogEntry = {
      username: username,
      role: userRole,
      action: `Updated ${fieldName} from "${oldValue}" to "${newValue}"`,
      timestamp: new Date()
    };
    logStore.addLog(salesOrder.salesorder_number, logEntry);
    
    const unsubscribe = logStore.subscribe(logs => logStore.saveLogs(logs));
    unsubscribe();
  }

  let showAddMore = false;

  function toggleAddMore() {
    showAddMore = !showAddMore;
  }


  // Props and event dispatcher
  export let data: PageData;
  export let salesOrder: SalesOrder;
  const dispatch = createEventDispatcher();

  // Interfaces
  interface LineItem {

    SONumber: string;
    isAvailabilityFrozen: any;
	isAvailable: boolean;
    name: string;
    quantity: number;
    unit: string;
    rate: number;
    item_total: number;
    status: string;
  }

  interface DCBox {
  
    SONumber: string;
    customName: string;
  trackingNo: string;
  dispatchedDate: string;
  deliveryDate: string;
  dcAmount: number;
  attachment: File | null;
  lineItemCount: number;
  isSaved: boolean;
  lineItemIndices: number[];
}

  // Stage and form variables
  let currentStage = 0;
  let stageData = [
  { title: 'Stage 0. Site Not Ready', completed: false, visible: true },
  { title: 'Stage 1. Logistics', completed: false, visible: true },
  { title: 'Stage 2. Material to Procure', completed: false, visible: true },
  { title: 'Stage 3. On Going', completed: false, visible: true },
  { title: 'Stage 4. Return Pickup', completed: false, visible: false },
  { title: 'Stage 5. Share with Account', completed: false, visible: true }
];

    let Stage0Data = {
    SONumber: salesOrder.salesorder_number,
    clientName: salesOrder.customer_name,
    SubTotal: salesOrder.sub_total,
    Total: salesOrder.total,
    SOCategory : '',
    projectManagerName : ''
  };
  let Stage3Data={
    SONumber: salesOrder.salesorder_number,
    engName:'',
    ScheduleDate:'',
    MobNo:'',
    VendorName:'',
    Remark:'',
    Report:'',
    Ticketid:''
  };
  let Stage4Data = {
    SONumber: salesOrder.salesorder_number,
    ReturnPickupName : '',
    ReturnPickupMobile : '',
    ReturnPickupRemark : '',
    DCNumber:'',
    CourierTrackNo:'',
    DCAmount:'',
    DispatchDate:'',
    DeliveryDate:'',
    Remark:'',
    Attachment:''
  }

  let soCategory = '';
  let projectManagerName = [];

  let isEditing = true;
  let partialDelivery = false;
  let canAccessNextStage = false;
  let newlyAvailableItems: any[] = [];
  let notAvailableItems: LineItem[] = [];
   // Map line items with status
  let lineItemsWithStatus: LineItem[] = salesOrder.line_items.map(item => ({
    ...item,
    status: '',
    isAvailable: false,
    isAvailabilityFrozen: false,
    SONumber: salesOrder.salesorder_number
  }));

  let dcOrderTotal = { subtotal: 0, igst: 0, total: 0 };
  let frozenLineItems: { [key: number]: boolean } = {};
  // Initialize dcBoxes array
  let dcBoxes: DCBox[] = [{
    customName: '',
    trackingNo: '', 
    dispatchedDate: '', 
    deliveryDate: '', 
    dcAmount: 0, 
    attachment: null, 
    lineItemCount: 0, 
    isSaved: false,
	  lineItemIndices: [],
    SONumber: salesOrder.salesorder_number
  }];
  let dcCounter = 1;

  // Reactive declarations
  $: allStatusesFilled = lineItemsWithStatus.every(item => item.status !== '');
  $: partialDelivery = lineItemsWithStatus.some(item => item.status === 'not_available');
    projectManagerName = [
      'PRIYA',
      'SHUBHAM22',
      'RASHMI'
  ]
  

  // Lifecycle hooks
  onMount(() => {
    stageStartTimes[0] = getCurrentDateTime();
  });

  // Stage navigation functions
  function closeModal() {
    dispatch('close');
  }

  function goToNextStage() {
  if (currentStage < stageData.length - 1) {
    do {
      currentStage++;
    } while (currentStage < stageData.length && !stageData[currentStage].visible);
  }
}

function goToPreviousStage() {
  if (currentStage > 0) {
    do {
      currentStage--;
    } while (currentStage > 0 && !stageData[currentStage].visible);
  }
}

  function editStage() {
    isEditing = true;
  }

  // Form submission and validation
  function handleSubmit(event: Event) {
    event.preventDefault();
    if (currentStage === (stageData[4].visible ? 5 : 4)) {
      // Share with Account stage
      const allItemsHaveStatus = [...shipments, ...returnPickups]
        .filter(item => item.isSaved)
        .every(item => item.accountStatus && item.accountRemark.trim());
      
      if (allItemsHaveStatus) {
        showConfirmationPopup = true;
      } else {
        alert("Please select a status and fill up the remark for all items.");
      }
    } else {
      showConfirmationPopup = true;
    }
  }

  async function confirmSubmit() {
    showConfirmationPopup = false;
    lastSubmittedTimes[currentStage] = getCurrentDateTime();
    // Set the start time for the next stage
    if (currentStage < stageData.length - 1) {
      stageStartTimes[currentStage + 1] = getCurrentDateTime();
    }
    
    switch (currentStage) {
    case 0:
      if (!Stage0Data.SOCategory || !Stage0Data.projectManagerName) {
        alert('Please fill in SO Category and Project Manager Name.');
        return;
      }
              else{
          try {
            await fetch(`/submit-stage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: currentStage, data: Stage0Data })});
          }
          catch (error) {
          console.error('Error:', error);
        }}
      break;
    case 1:
      if (!allStatusesFilled) {
        alert('Please select a status for all line items before submitting.');
        return;
      }
      else if (!isCurrentDCFilled()) {
        alert('Please fill all fields in the current DC before submitting.');
        return;
      }
              else{
          try {
            await fetch(`/submit-stage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: currentStage, 
              data: {
              lineItems: lineItemsWithStatus,
              dcBoxes: dcBoxes
            } })});
          }catch (error) {
          console.error('Error:', error);
          }
        }
      updateDCAmount(dcBoxes.length - 1);
      updateDCOrderTotal();
      saveCurrentState();
      alert('Logistics stage completed successfully.');
      break;
    case 2:
      alert('Material to Procure stage completed successfully.');
      break;
    case 3:
        try {
          await fetch(`/submit-stage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: currentStage, data: Stage3Data })});
        }
        catch (error) {
          console.error('Error:', error);
        }
      alert("Ongoing stage has completed");
      break;
      case 4:
    if (stageData[4].visible) {
      if (returnPickups.every(pickup => pickup.isSaved)) {
        alert("Return Pickup details submitted successfully.");
        stageData[4].completed = true;
        currentStage = 5; // Move to Share with Account stage
      } else {
        alert("Please save all Return Pickup details before submitting.");
        return;
      }
    } else {
      // Handle the case when Return Pickup is not visible (skipped)
      alert("Moving to Share with Account stage.");
      currentStage = 5;
    }
    break;
    case (stageData[4].visible ? 5 : 4):
    const approvedItems = [...shipments, ...returnPickups]
      .filter(item => item.isSaved && item.accountStatus === 'approved')
      .map(item => item.name || `Shipment ${item.index + 1}`);
    const rejectedItems = [...shipments, ...returnPickups]
      .filter(item => item.isSaved && item.accountStatus === 'rejected')
      .map(item => item.name || `Shipment ${item.index + 1}`);
    
    if (approvedItems.length > 0) {
      alert(`Approved items: ${approvedItems.join(', ')}`);
    }
    if (rejectedItems.length > 0) {
      alert(`Rejected items: ${rejectedItems.join(', ')}`);
      showRejectionAlert = true;
    }
    break;
    }

    stageData[currentStage].completed = true;
    // Automatically move to the next stage
    goToNextStage();
  }

  // Helper functions
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }



  // DC box related functions
  function calculateDCAmount(dcIndex: number) {
    return lineItemsWithStatus
      .filter((item, index) => 
        (item.status === 'available' || item.status === 'need_to_purchase') && 
        !frozenLineItems[index] &&
        index >= (dcIndex > 0 ? dcBoxes[dcIndex - 1].lineItemCount : 0)
      )
      .reduce((sum, item) => sum + item.item_total, 0);
  }

  function updateDCOrderTotal() {
    dcOrderTotal.subtotal = lineItemsWithStatus
      .filter(item => item.status === 'available' || item.status === 'need_to_purchase')
      .reduce((sum, item) => sum + item.item_total, 0);
  }

  function saveCurrentState() {
    console.log('Saving current state:', {
      lineItems: lineItemsWithStatus,
      dcOrderTotal,
      partialDelivery,
      dcBoxes
    });
    // Implement actual saving logic here
  }

  function handleSave() {
    if (!allStatusesFilled) {
      alert('Please select a status for all line items before saving.');
      return;
    }

    if (!isCurrentDCFilled()) {
      alert('Please fill all fields in the current DC before saving.');
      return;
    }
    
    lastSavedTimes[currentStage] = getCurrentDateTime();

    const currentDCIndex = dcBoxes.length - 1;
  const currentDC = dcBoxes[currentDCIndex];

  // Associate newly available or purchasable items with the current DC
  lineItemsWithStatus.forEach((item, index) => {
    if ((item.status === 'available' || item.status === 'need_to_purchase') && !frozenLineItems[index]) {
      frozenLineItems[index] = true;
      currentDC.lineItemIndices.push(index);
    }
  });

  notAvailableItems = lineItemsWithStatus.filter(item => item.status === 'not_available');


  currentDC.isSaved = true;
  dcBoxes = dcBoxes; // Trigger reactivity

  updateDCAmount(currentDCIndex);
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

  // Function to add more DC
  function addMoreDC() {
  if (!isCurrentDCFilled()) {
    alert('Fill up and save the current DC before adding a new one.');
    return;
  }

  dcCounter++;
  dcBoxes.push({
        customName: '',
        trackingNo: '', 
        dispatchedDate: '', 
        deliveryDate: '', 
        dcAmount: 0, 
        attachment: null, 
        lineItemCount: 0, 
        lineItemIndices: [],
        isSaved: false, 
        SONumber: salesOrder.salesorder_number
  });
  dcBoxes = dcBoxes; // Trigger reactivity
}

  // Function to check if current DC is filled  
  function isCurrentDCFilled() {
    const currentDC = dcBoxes[dcBoxes.length - 1];
    return currentDC.customName.trim() &&  currentDC.trackingNo && currentDC.dispatchedDate && currentDC.deliveryDate && (currentDC.attachment || fileName || filePreviewUrl);
  }

// Function to update DC amount
function updateDCAmount(dcIndex: number) {
  const dc = dcBoxes[dcIndex];
  dc.dcAmount = dc.lineItemIndices.reduce((sum, index) => {
    const item = lineItemsWithStatus[index];
    return sum + item.item_total;
  }, 0);
  dcBoxes = dcBoxes; // Trigger reactivity
}

  // File handling functions
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
  async function handleFileChange(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
      if (file) {
        try{
          const base64String = await convertFileToBase64(file);
          dcBoxes[index] = {
        ...dcBoxes[index],
        attachment: base64String
        };filePreviewUrl = URL.createObjectURL(file);
          fileName = file.name;
        }catch (error) {
          console.error('Error converting file to base64:', error);}
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
    console.error('No file available for download');
  }
}

  // Function to go to next page
  function goToNextPage() {
    if (currentStage < stageData.length - 1) {
      currentStage++;
    }
  }

  // Stage 2 related functions
  let showSaveButton = false;
let showLogisticsAlert = false;


function handleAvailabilityChange(index: any) {
  showSaveButton = notAvailableItems.some(item => item.isAvailable && !item.isAvailabilityFrozen);
}

function handleSaveMaterialToProcure() {
  const itemsToMarkAvailable = notAvailableItems.filter(item => item.isAvailable && !item.isAvailabilityFrozen);
  
  if (itemsToMarkAvailable.length > 0) {
    const itemNames = itemsToMarkAvailable.map(item => item.name).join(", ");
    if (confirm(`Are you sure you want to mark the following items as Available?\n\n${itemNames}`)) {
      newlyAvailableItems = itemsToMarkAvailable.map(item => item.name);
      
      itemsToMarkAvailable.forEach(item => {
        item.isAvailabilityFrozen = true;
        const index = lineItemsWithStatus.findIndex(lineItem => lineItem.name === item.name);
        if (index !== -1) {
          lineItemsWithStatus[index].status = 'available';
        }
      });
      
      notAvailableItems = notAvailableItems.filter(item => !item.isAvailable);
      showSaveButton = false;
      showLogisticsAlert = true;
      
      // Update the reactive variables
      lineItemsWithStatus = [...lineItemsWithStatus];
      notAvailableItems = [...notAvailableItems];
      
      alert("Items have been marked as Available. Please complete the order in the Logistics stage.");
    }
  }
}

  // Stage 3 related functions
  let shipments: any[] = [{ isSaved: false, activeTab: 'installation', rejected: false, rejectionRemark: '' }];

  function validateMobileNumber(number: string): boolean {
    const regex = /^\d{10}$/;
    return regex.test(number);
  }

  function saveShipment(index: number) {
  const shipment = shipments[index];
  if (isShipmentValid(shipment)) {
    shipment.isSaved = true;
    shipments = [...shipments];
    shipment.accountStatus = '';
    shipment.accountRemark = '';
    shipment.isEditing = false;
    alert(`${shipment.activeTab === 'installation' ? 'Installation' : 'Service'} details saved successfully.`);
  } else {
    alert(`Please fill up all the ${shipment.activeTab === 'installation' ? 'installation' : 'service'} details before saving.`);
  }
  lastSavedTimes[currentStage] = getCurrentDateTime();
}

  function isShipmentValid(shipment: any): boolean {
    if (shipment.activeTab === 'installation') {  
      return Boolean(Stage3Data.engName && Stage3Data.ScheduleDate && 
             Stage3Data.MobNo && Stage3Data.MobNo.length === 10 &&
             Stage3Data.VendorName && Stage3Data.Remark && Stage3Data.Report);
    } else {
      return Boolean( Stage3Data.engName && Stage3Data.ScheduleDate && 
             Stage3Data.MobNo && Stage3Data.MobNo.length === 10 &&
             Stage3Data.VendorName && Stage3Data.Remark && Stage3Data.Report && Stage3Data.Ticketid);
    }
  }

  async function handleStage3FileChange(event: Event, type: 'installation' | 'service', index: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
      if (file && !shipments[index].isSaved) {
        try {
          const base64String = await convertFileToBase64(file);
          if (type === 'installation') {
            Stage3Data.Report = base64String;
         }else {
            Stage3Data.Report = base64String;
          }
        shipments = [...shipments]; // Trigger reactivity
        }catch (error) {
          console.error('Error converting file to base64:', error);}
    } lastSavedTimes[currentStage] = getCurrentDateTime();
  }

  function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
 }

  // Return pickup related functions

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
  const oldValue = input.value;
  const newValue = oldValue.replace(/\D/g, '').slice(0, 10);

  
  
  if (oldValue !== newValue) {
    input.value = newValue;
    alert("Please enter only digits. The mobile number should be 10 digits long.");
  }
}

 
  let returnPickups: Array<{
    name: string;
    mobile: string;
    remark: string;
    file: File | null;
    fileName: string;
    filePreviewUrl: string | null;
    isSaved: boolean;
    accountStatus?: string;
    accountRemark?: any;
    isEditing?: boolean;
    isDataSaved: boolean;
    rejected: boolean;
    rejectionRemark: any;
    dcNumber: any;
    trackingNo: any;
    dcAmount: string;
    dispatchedDate: any;
    deliveryDate: any;
    dcaccountRemark?: any;
  }> = [
    // Initial returnPickups object...
    {
    name: '',
    mobile: '',
    remark: '',
    file: null,
    fileName: '',
    filePreviewUrl: null,
    isSaved: false,
    isDataSaved: false,
    rejected: false,
    rejectionRemark: '',
    dcNumber: '',
    trackingNo: '',
    dcAmount: '',
    dispatchedDate: '',
    deliveryDate: ''
  }
  ];

  let returnPickupRequested = false;
  let showReturnPickupConfirmation = false;
  let returnPickupName = '';
  let returnPickupMobile = '';
  let returnPickupRemark = '';
  let showConfirmationPopup = false;
  let returnPickupDetailsSaved = false;

  function toggleReturnPickup() {
  if (returnPickupRequested) {
    // If cancelling, just reset the state
    returnPickupRequested = false;
    resetReturnPickupFields();
  } else {
    // If requesting, show the details form
    returnPickupRequested = true;
  }
}

function saveReturnPickupDetails() {
  if (Stage4Data.ReturnPickupName && Stage4Data.ReturnPickupMobile.length === 10 && Stage4Data.ReturnPickupRemark) {
    showReturnPickupConfirmation = true;
  } else {
    alert("Please fill in all fields correctly before saving.");
  }
}

async function confirmReturnPickup() {
  showReturnPickupConfirmation = false;
  returnPickupDetailsSaved = true;
  try {
    await fetch(`/submit-stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage: currentStage, data: Stage4Data })});
    alert("Return Pickup request confirmed. Details have been saved.");
  }
  catch (error) {
    console.error('Error:', error);
  }
  
}



function handleReturnPickupMobileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const oldValue = input.value;
  const newValue = oldValue.replace(/\D/g, '').slice(0, 10);
  
  if (oldValue !== newValue) {
       Stage4Data.ReturnPickupMobile = newValue;
    alert("Please enter only digits. The mobile number should be 10 digits long.");
  }
}

  async function handleReturnPickupFileChange(event: Event, index: number) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
    if (file) {
      try {
        const base64String = await convertFileToBase64(file);
        Stage4Data.Attachment = base64String;
    }catch (error) {
          console.error('Error converting file to base64:', error);}
    } lastSavedTimes[currentStage] = getCurrentDateTime();
}

//   function saveReturnPickup() {
//   if (isReturnPickupComplete(returnPickups)) {
//     returnPickups.isSaved = true;
//     returnPickups.accountStatus = '';
//     returnPickups.accountRemark = '';
//     returnPickups.isEditing = false;

//     alert("Return Pickup details saved successfully. You can no longer edit this entry.");
//   } else {
//     alert("Please fill up all the Return Pickup details.");
//   }
// }

function isReturnPickupComplete(Stage4Data:any): boolean {
  return (
    Stage4Data.ReturnPickupName.trim() !== '' &&
    Stage4Data.ReturnPickupMobile.length === 10 &&
    Stage4Data.ReturnPickupRemark.trim() !== '' &&
    Stage4Data.Attachment !== null &&
    Stage4Data.DCNumber.trim() !== '' &&
    Stage4Data.CourierTrackNo.trim() !== '' &&
    Stage4Data.DCAmount.trim() !== '' &&
    Stage4Data.DispatchDate !== '' &&
    Stage4Data.DeliveryDate !== '' &&
    Stage4Data.Remark.trim() !== ''
  );
}

  function formatAmountreturn(event: Event, index: number) {
  const input = event.target as HTMLInputElement;
  let value = input.value.replace(/[^\d.]/g, '');
  
  // Allow only one decimal point
  const parts = value.split('.');
  if (parts.length > 2) {
    parts.pop();
    value = parts.join('.');
  }
  
  // Format with commas for thousands
  const [wholePart, decimalPart] = value.split('.');
  let formattedWholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  // Combine whole part and decimal part (if exists)
  let formatted = formattedWholePart;
  if (decimalPart !== undefined) {
    formatted += '.' + decimalPart;
  }

  // Update the input value and the returnPickups array
  input.value = formatted;
  returnPickups[index].dcAmount = formatted;
  returnPickups = [...returnPickups];
}


function getCurrentDateTime(): string {
  return new Date().toLocaleString();
}

function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

function updateDeliveryDateMin(index: number) {
  const pickup = returnPickups[index];
  if (pickup.dispatchedDate > pickup.deliveryDate) {
    pickup.deliveryDate = pickup.dispatchedDate;
  }
  returnPickups = [...returnPickups];
}

  // Share with account related variables
  let accountStatus = '';
  let accountRemark = '';
  let showRejectionAlert = false;
  let canEditOngoing = false;
  let canEditReturnPickup = false;

  // Reactive statements
  $: {
    if (returnPickupRequested) {
      stageData[4].visible = true;
    } else {
      stageData[4].visible = false;
    }
  }

  $: {
    partialDelivery = lineItemsWithStatus.some(item => item.status === 'not_available');
    updateDCOrderTotal();
  }

  $: {
    if (showRejectionAlert) {
      canEditOngoing = true;
      canEditReturnPickup = true;
    }
  }

  $: {
  if (partialDelivery) {
    stageData[2].visible = true;
  } else {
    stageData[2].visible = false;
  }
}

  // Time tracking
  let stageStartTimes: { [key: number]: string } = {};
  let lastSavedTimes: { [key: number]: string } = {};
  let lastSubmittedTimes: { [key: number]: string } = {};
</script>


<div   role="dialog"
  aria-labelledby="modal-title" 
  class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" on:click|self={closeModal}>
  <div class="relative top-20 mx-auto p-8 border w-11/12 max-w-4xl shadow-lg rounded-lg bg-white">
    <button 
      on:click={closeModal}
      class="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      aria-label="Close modal"
    >
      <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <h2 id="modal-title" class="text-3xl font-bold mb-6 text-gray-800">Stages</h2>
    
    <!-- Stage navigation -->
    <div class="mb-8 flex flex-wrap justify-center gap-3">
      {#each stageData as stage, index}
        {#if stage.visible !== false}
          <button
            class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 {
              stage.completed ? 'bg-green-500 text-white hover:bg-green-600' : 
              currentStage === index ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } {(!stage.completed && index > currentStage) ? 'opacity-50 cursor-not-allowed' : ''}"
            on:click={() => {
              if (stage.completed || index === currentStage) {
                currentStage = index;
              }
            }}
            disabled={!stage.completed && index > currentStage}
          >
            {stage.title}
          </button>
        {/if}
      {/each}
    </div>

    <div class="bg-white p-6 rounded-lg shadow-md">
      <form on:submit|preventDefault={handleSubmit}>
    <!-- Stage header -->
      <h3 class="text-2xl font-bold mb-6 text-gray-800">{stageData[currentStage].title}</h3>

      {#if currentStage === 0}
        <!-- API data fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
  <div class="mb-4 grid grid-cols-2 gap-4 form-card">
    <div>
      <label class="block text-gray-700 text-sm font-bold mb-2" for="so_category">
        SO Category *
      </label>
      <select 
        id="so_category" 
        bind:value={Stage0Data.SOCategory} 
        on:change={(e) => handleFieldUpdate("SO Category", soCategory, e.target.value)}
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
        on:change={(e) => handleFieldUpdate("Project Manager", projectManagerName, e.target.value)}
        bind:value={Stage0Data.projectManagerName} 
        class="w-full px-3 py-2 border rounded-md" 
        disabled={!isEditing} 
        required
      >
        <option value="">Select Project Manager</option>
        {#each projectManagerName as name}
          <option value={name}>{name}</option>
        {/each}
      </select>
    </div>
    
  </div>
   
        
        {:else if currentStage === 1}
          <!-- Logistics stage content -->
          {#if showLogisticsAlert}
          <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 relative form-card" role="alert">
            <p class="font-bold">The following items are now available:</p>
            <ul class="list-disc list-inside mt-2">
              {#each newlyAvailableItems as item}
                <li>{item}</li>
              {/each}
            </ul>
            <p class="mt-2">Please complete the order for these items in the Logistics stage.</p>
            <button 
              class="absolute top-0 right-0 mt-2 mr-2 text-yellow-700 hover:text-yellow-900"
              on:click={() => {
                showLogisticsAlert = false;
                newlyAvailableItems = [];
              }}
            >
              ×
            </button>
          </div>
        {/if}
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

<div class="mt-4 form-card">
  <h4 class="text-lg font-bold mb-2 inline-block mr-2">Total Amount:</h4>
  <p class="inline-block">{formatCurrency(dcOrderTotal.subtotal)}</p>
</div>

        <!-- Collapsible "Add More" section -->
        <div class="mt-6">
          <button
            type="button"
            class="w-full py-2 px-4 bg-gray-100 text-left text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200"
            on:click={() => showAddMore = !showAddMore}
          >
            {showAddMore ? '- Hide "DC Section" ' : '+ Show "DC Section" '}
          </button>
          {#if showAddMore}
            <div class="mt-4 p-4 bg-gray-50 rounded-lg" transition:slide>
                <!-- DC Boxes -->
              {#each dcBoxes as dc, index}
              <div class="bg-white bg-opacity-50 p-6 rounded-lg shadow-md mb-8 relative form-card">
                {#if !dc.isSaved && index !== 0}
                  <button
                    type="button"
                    class="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xl font-bold"
                    on:click={() => removeDC(index)}
                  >
                    ×
                  </button>
                {/if}
                <div class="flex items-center mb-4 ">
                  <span class="text-xl font-semibold mr-2">{dcOrderTotal.subtotal >= 50000 ? 'E-way:' : 'DC:'}</span>
                  <input 
                    type="text" 
                    bind:value={dc.customName} 
                    placeholder={dcOrderTotal.subtotal >= 50000 ? "Enter E-way number" : "Enter DC number"}
                    class="border-b-2 border-gray-300 focus:border-blue-500 outline-1 px-2 py-1"
                    required disabled={dc.isSaved}
                  >
                </div>
                <div class="flex justify-center mb-8">
                  <div class="bill-type-buttons flex gap-6">
                    <button
                      class="px-8 py-3 border rounded-lg shadow-md {dcOrderTotal.subtotal < 50000 ? 'bg-green-500 text-white border-green-500' : 'bg-white border-gray-300 text-gray-700'}"
                    >
                      DC Bill
                    </button>
                    <button
                      class="px-8 py-3 border rounded-lg shadow-md {dcOrderTotal.subtotal >= 50000 ? 'bg-green-500 text-white border-green-500' : 'bg-white border-gray-300 text-gray-700'}"
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
                      <label for="dc-amount-{index}" class="block text-sm font-medium text-gray-700">{dcOrderTotal.subtotal >= 50000 ? 'E-way Bill Amount:' : 'DC Amount:'}</label>
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

                <!-- Line Items Table -->
                  <!-- Line Items Table -->
              {#if dc.isSaved}
              <div class="mt-6">
                <h4 class="text-lg font-bold mb-2">Line Items in this {dcOrderTotal.subtotal >= 50000 ? 'E-way Bill' : 'DC'}</h4>
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
                      {#each dc.lineItemIndices as itemIndex, i}
                        {@const item = lineItemsWithStatus[itemIndex]}
                        <tr>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{i + 1}</td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity} {item.unit}</td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.rate)}</td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.item_total)}</td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.status === 'need_to_purchase' ? 'Need to purchase locally' : 'Available'}
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              </div>
              {/if}
                </div>
              </div>
              {/each}
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
            </div>
          {/if}
        </div>






  
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

  </div>
</div>
{:else if currentStage === 2}
<!-- Material to Procure stage content -->
<div class="mb-4">
  <h4 class="text-xl font-bold mb-4 text-center">Not Available Items</h4>
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
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
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
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <input 
                  type="checkbox" 
                  bind:checked={item.isAvailable} 
                  on:change={() => handleAvailabilityChange(index)}
                  disabled={item.isAvailabilityFrozen}
                >
                {#if item.isAvailable}
                  <span class="ml-2 text-green-500">✓</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <p class="text-center">No items marked as not available.</p>
  {/if}
</div>

{#if showSaveButton}
  <div class="flex justify-end mt-4">
    <button 
      type="button" 
      on:click={handleSaveMaterialToProcure}
      class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
    >
      Save
    </button>
  </div>
{/if}
 
  {:else if currentStage === 3}
   <!-- On Going stage content -->
   <div class="relative pb-16 ">
    
   <div class="mb-4">
    {#each shipments as shipment, index}
        <div class="mb-8 p-4 border rounded-lg relative form-card">
          {#if shipment.rejected}
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong class="font-bold">Rejected:</strong>
              <span class="block sm:inline"> {shipment.rejectionRemark}</span>
            </div>
          {/if}
          
          <!-- Dynamic header based on active tab -->
          <h5 class="text-lg font-semibold mb-4">
            {shipment.activeTab === 'installation' ? 'Installation Report' : 'Service Report'} 
          </h5>

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
                <input type="text" id="engineer-name-{index}" bind:value={Stage3Data.engName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={shipment.isSaved}>
              </div>
              <div>
                <label for="schedule-date-{index}" class="block text-sm font-medium text-gray-700">Schedule date:</label>
                <input 
                  type="date" 
                  id="schedule-date-{index}" 
                  bind:value={Stage3Data.ScheduleDate} 
                  min={new Date().toISOString().split('T')[0]} 
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
                  required 
                  disabled={shipment.isSaved}
                >
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="mobile-number-{index}" class="block text-sm font-medium text-gray-700">Mobile number:</label>
                <input 
                  type="tel" 
                  id="mobile-number-{index}" 
                  bind:value={Stage3Data.MobNo} 
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
                <input type="text" id="vendor-name-{index}" bind:value={Stage3Data.VendorName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={shipment.isSaved}>
              </div>
            </div>
            <div>
              <label for="installation-remarks-{index}" class="block text-sm font-medium text-gray-700">Installation remarks:</label>
              <textarea id="installation-remarks-{index}" bind:value={Stage3Data.Remark} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" rows="3" disabled={shipment.isSaved}></textarea>
            </div>
            <div>
              <label for="installation-report-{index}" class="block text-sm font-medium text-gray-700">Installation report attachment:</label>
              <input type="file" id="installation-report-{index}" on:change={(e) => handleStage3FileChange(e, 'installation', index)} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" class="mt-1 block w-full" required disabled={shipment.isSaved}>
              {#if Stage3Data.Report}
                <div class="mt-2">
                  <button 
                    type="button" 
                    on:click={() => previewFile(Stage3Data.Report)}
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
                <input type="text" id="service-engineer-name-{index}" bind:value={Stage3Data.engName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={shipment.isSaved}>
              </div>
              <div>
                <label for="service-schedule-date-{index}" class="block text-sm font-medium text-gray-700">Schedule date:</label>
                <input 
                  type="date" 
                  id="service-schedule-date-{index}" 
                  bind:value={Stage3Data.ScheduleDate} 
                  min={new Date().toISOString().split('T')[0]} 
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
                  required 
                  disabled={shipment.isSaved}
                >
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="service-mobile-number-{index}" class="block text-sm font-medium text-gray-700">Mobile number:</label>
                <input 
                    type="tel" 
                    id="service-mobile-number-{index}" 
                    bind:value={Stage3Data.MobNo} 
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
                <input type="text" id="service-vendor-name-{index}" bind:value={Stage3Data.VendorName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={shipment.isSaved}>
              </div>
            </div>
            <div>
              <label for="service-remarks-{index}" class="block text-sm font-medium text-gray-700">Service remarks:</label>
              <textarea id="service-remarks-{index}" bind:value={Stage3Data.Remark} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" rows="3" disabled={shipment.isSaved}></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="service-report-{index}" class="block text-sm font-medium text-gray-700">Service report attachment:</label>
                <input type="file" id="service-report-{index}" on:change={(e) => handleStage3FileChange(e, 'service', index)} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" class="mt-1 block w-full" required disabled={shipment.isSaved}>
                {#if Stage3Data.Report}
                  <div class="mt-2">
                    <button 
                      type="button" 
                      on:click={() => previewFile(Stage3Data.Report)}
                      class="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      Preview
                    </button>
                    <button 
                      type="button" 
                      on:click={() => downloadFile(Stage3Data.Report)}
                      class="text-green-600 hover:text-green-800"
                    >
                      Download
                    </button>
                  </div>
                {/if}
              </div>
              <div>
                <label for="service-ticket-id-{index}" class="block text-sm font-medium text-gray-700">Service ticket Id:</label>
                <input type="text" id="service-ticket-id-{index}" bind:value={Stage3Data.Ticketid} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required disabled={shipment.isSaved}>
              </div>
            </div>
          </div>
        {/if}

        {#if !shipment.isSaved}
          <button 
            type="button" 
            on:click={() => saveShipment(index)}
            class="mt-14 absolute down-2 right-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Save 
          </button>
        {/if}
      </div>
    {/each}

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
          on:click={toggleReturnPickup}
          class="mt-4 mb-4 px-4 py-2 {returnPickupRequested ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded absolute bottom-2 left-2"
          disabled={returnPickupDetailsSaved} 
        >
          {returnPickupRequested ? 'Cancel Return Pickup' : 'Request Return Pickup'}
        </button>

       <!-- Return Pickup Details box -->
       {#if returnPickupRequested && !showReturnPickupConfirmation}
       <div class="mb-8 p-4 border rounded-lg relative">
         <h4 class="text-lg font-bold mb-4">Return Pickup Details</h4>
         <div class="space-y-4">
           <div class="flex space-x-4">
             <div class="flex-1">
               <label for="return-pickup-name" class="block text-sm font-medium text-gray-700">Name:</label>
               <input 
                 type="text" 
                 id="return-pickup-name" 
                 bind:value={Stage4Data.ReturnPickupName} 
                 class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
                 required
                 disabled={returnPickupDetailsSaved}
               >
             </div>
             <div class="flex-1">
               <label for="return-pickup-mobile" class="block text-sm font-medium text-gray-700">Mobile Number:</label>
               <input 
                 type="tel" 
                 id="return-pickup-mobile" 
                 bind:value={Stage4Data.ReturnPickupMobile} 
                 on:input={handleReturnPickupMobileInput}
                 class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
                 pattern="[0-9]{10}"
                 maxlength="10"
                 required
                 disabled={returnPickupDetailsSaved}
               >
             </div>
           </div>
           <div>
             <label for="return-pickup-remark" class="block text-sm font-medium text-gray-700">Project Manager's Remark:</label>
             <textarea 
               id="return-pickup-remark" 
               bind:value={Stage4Data.ReturnPickupRemark} 
               class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
               rows="3" 
               required
               disabled={returnPickupDetailsSaved}
             ></textarea>
           </div>
           {#if !returnPickupDetailsSaved}
             <button 
               type="button" 
               on:click={saveReturnPickupDetails}
               class="mt-4 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 absolute down-2 right-2"
             >
               Save
             </button>
           {/if}
         </div>
       </div>
     {/if}

 {#if showReturnPickupConfirmation}
 <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
   <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
     <h3 class="text-lg font-bold mb-4">Confirmation</h3>
     <p class="mb-4">Are you sure you want to request a Return Pickup?</p>
     <div class="flex justify-end">
       <button 
         on:click={() => showReturnPickupConfirmation = false}
         class="mr-2 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
       >
         Cancel
       </button>
       <button 
         on:click={confirmReturnPickup}
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
   <!-- Return Pickup Stage -->
{#each returnPickups as pickup, index}
<div class="mb-8 p-4 border rounded-lg relative">
  {#if pickup.rejected}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
      <strong class="font-bold">Rejected:</strong>
      <span class="block sm:inline"> {pickup.rejectionRemark}</span>
    </div>
  {/if}
  <h4 class="text-lg font-bold mb-4">Return Pickup Report</h4>

  <div class="space-y-4">
    <div class="flex space-x-4">
      <div class="flex-1">
        <label for="return-pickup-name-{index}" class="block text-sm font-medium text-gray-700">Name:</label>
        <input 
          type="text" 
          id="return-pickup-name-{index}" 
          value={Stage4Data.ReturnPickupName} readonly
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
          required
          disabled={pickup.isSaved}
        >
      </div>
      <div class="flex-1">
        <label for="return-pickup-mobile-{index}" class="block text-sm font-medium text-gray-700">Mobile Number:</label>
        <input 
          type="tel" 
          id="return-pickup-mobile-{index}" 
          value={Stage4Data.ReturnPickupMobile} readonly 
          on:input={(e) => handleReturnPickupMobileInput(e)}
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
          pattern="[0-9]{10}"
          maxlength="10"
          required
          disabled={pickup.isSaved}
        >
      </div>
    </div>

    <div>
      <label for="return-pickup-remark-{index}" class="block text-sm font-medium text-gray-700">Project Manager's Remark:</label>
      <textarea 
        id="return-pickup-remark-{index}" 
        value={Stage4Data.ReturnPickupRemark} readonly
        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
        rows="3" 
        required
        disabled={pickup.isSaved}
      ></textarea>
    </div>
  </div>

  <!-- Additional fields -->
  <div class="flex space-x-4 mt-4">
    <div class="flex-1">
      <label for="dc-number-{index}" class="block text-sm font-medium text-gray-700">DC Number:</label>
      <input 
        type="text" 
        id="dc-number-{index}" 
        bind:value={Stage4Data.DCNumber}
        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
        required
        disabled={pickup.isSaved}
      >
    </div>
    <div class="flex-1">
      <label for="tracking-no-{index}" class="block text-sm font-medium text-gray-700">Courier's tracking no.:</label>
      <input 
        type="text" 
        id="tracking-no-{index}" 
        bind:value={Stage4Data.CourierTrackNo} 
        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
        required
        disabled={pickup.isSaved}
      >
    </div>
    <div class="flex-1">
      <label for="dc-amount-{index}" class="block text-sm font-medium text-gray-700">DC Amount:</label>
      <input 
        type="text" 
        id="dc-amount-{index}" 
        bind:value={Stage4Data.DCAmount} 
        on:input={(e) => formatAmountreturn(e, index)}
        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
        required
        disabled={pickup.isSaved}
      >
    </div>
  </div>
  <div class="flex space-x-4 mt-4">
    <div class="flex-1">
      <label for="dispatched-date-{index}" class="block text-sm font-medium text-gray-700">Dispatched date:</label>
      <input 
        type="date" 
        id="dispatched-date-{index}" 
        bind:value={Stage4Data.DispatchDate} 
        on:change={() => updateDeliveryDateMin(index)}
        max={getCurrentDate()}
        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
        required
        disabled={pickup.isSaved}
      >
    </div>
    <div class="flex-1">
      <label for="delivery-date-{index}" class="block text-sm font-medium text-gray-700">Delivery date:</label>
      <input 
        type="date" 
        id="delivery-date-{index}" 
       bind:value={Stage4Data.DeliveryDate} 
        min={pickup.dispatchedDate}
        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
        required
        disabled={pickup.isSaved}
      >
    </div>
  </div>
  <div class="mt-4">
    <label for="return-pickup-remark-{index}" class="block text-sm font-medium text-gray-700">Remark:</label>
    <textarea 
      id="return-pickup-remark-{index}" 
      bind:value={Stage4Data.Remark} 
      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
      rows="3" 
      required
      disabled={pickup.isSaved}
    ></textarea>
  </div>
  <div class="mt-4">
    <label for="attachment-{index}" class="block text-sm font-medium text-gray-700">Attachment:</label>
    <input 
      type="file" 
      id="attachment-{index}" 
      on:change={(e) => handleReturnPickupFileChange(e, index)}
      class="mt-1 block w-full" 
      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      required
      disabled={pickup.isSaved}
    >
    {#if pickup.file}
      <div class="mt-2">
        <button 
          type="button" 
          on:click={() => previewFile(Stage4Data.Attachment)}
          class="text-blue-600 hover:text-blue-800 mr-2"
        >
          Preview
        </button>
        <button 
          type="button" 
          on:click={() => downloadFile(Stage4Data.Attachment)}
          class="text-green-600 hover:text-green-800"
        >
          Download
        </button>
      </div>
    {/if}
  </div>

  {#if !pickup.isSaved}
    <button 
      type="button" 
      on:click={() => saveReturnPickup}
      class="mt-4 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 absolute bottom-2 right-2"
    >
      Save
    </button>
  {/if}
</div>
{/each}

<!-- File Preview Modal -->
<div id="filePreviewModal" class="modal" style="display: none;">
<div class="modal-content">
  <span class="close" on:click={closeFilePreviewModal}>&times;</span>
  <iframe id="filePreviewFrame" style="width: 100%; height: 500px;"></iframe>
</div>
</div>



  {:else if currentStage === (stageData[4].visible ? 5 : 4)}
  <!-- Share with Account stage content -->
  <h4 class="text-lg font-bold mb-2">Installation or Service Report</h4>
  <!-- Ongoing Shipments -->
  {#each shipments.filter(s => s.isSaved) as shipment, index}
    <div class="mb-6 p-4 border rounded-lg relative">
      <!-- New fields -->
      <div>
        <label for="installation-remarks-{index}" class="block text-sm font-medium text-gray-700">Installation remarks:</label>
        <textarea id="installation-remarks-{index}" bind:value={shipment.installationRemarks} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" rows="3" disabled={shipment.isDataSaved}></textarea>
      </div>
      <div>
        <label for="installation-report-{index}" class="block text-sm font-medium text-gray-700">Installation report attachment:</label>
        <input type="file" id="installation-report-{index}" on:change={(e) => handleStage3FileChange(e, 'installation', index)} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" class="mt-1 block w-full" required disabled={shipment.isDataSaved}>
        
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

          
      <!-- Approval/Rejection toggle buttons -->
      <div class="flex justify-center space-x-4 mb-4">
        <button
          type="button"
          class="px-3 py-1 {shipment.accountStatus === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-200'} rounded"
          on:click={() => {
            if (shipment.accountStatus === 'rejected') {
              shipment.rejected = false;
              shipment.rejectionRemark = '';
            }
            shipment.accountStatus = 'approved';
            shipment.accountRemark = '';
          }}
          disabled={shipment.isDataSaved}
        >
          Approved
        </button>
        <button
          type="button"
          class="px-3 py-1 {shipment.accountStatus === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-200'} rounded"
          on:click={() => {
            shipment.accountStatus = 'rejected';
            shipment.accountRemark = '';
            shipment.rejected = true;
            shipment.rejectionRemark = '';
          }}
          disabled={shipment.isDataSaved}
        >
          Rejected
        </button>
      </div>

      <!-- Remark field -->
      <div class="mb-2">
        <label for="shipment-remark-{index}" class="block text-sm font-medium text-gray-700">Remark:</label>
        <textarea 
          id="shipment-remark-{index}" 
          bind:value={shipment.accountRemark} 
          on:input={() => {
            if (shipment.accountStatus === 'rejected') {
              shipment.rejectionRemark = shipment.accountRemark;
            }
          }}
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
          rows="3" 
          required
          disabled={shipment.isDataSaved}
        ></textarea>
      </div>

      <!-- Save/Edit button -->
      <button 
        type="button" 
        on:click={() => {
          if (shipment.isDataSaved) {
            // Enter edit mode
            shipment.isDataSaved = false;
            shipment.isEditing = true;
          } else {
            // Validate before saving
            if (!shipment.accountStatus || !shipment.accountRemark || shipment.accountRemark.trim() === '') {
              alert("Please fill up the details before saving");
              return;
            }
            // Save changes
            shipment.isDataSaved = true;
            shipment.isEditing = false;
            // Add any additional save logic here
          }
        }}
        class="absolute down-2 right-2 px-2 py-1 {shipment.isDataSaved ? 'bg-blue-500' : 'bg-green-500'} text-white rounded text-sm"
      >
        {shipment.isDataSaved ? 'Edit' : 'Save'}
      </button>
    </div>
  {/each}

  <h4 class="text-lg font-bold mb-2">Return Pickups Report</h4>

  <!-- Return Pickups -->
  {#each returnPickups.filter(p => p.isSaved) as pickup, index}
    <div class="mb-6 p-4 border rounded-lg relative">
       <!-- New fields -->
       <div class="mt-4">
        <label for="return-pickup-remark-{index}" class="block text-sm font-medium text-gray-700">Return pickup report remarks:</label>
        <textarea 
          id="return-pickup-remark-{index}" 
          bind:value={pickup.dcaccountRemark} 
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
          rows="3" 
          required
          disabled={pickup.isSaved}
        ></textarea>
      </div>
      <div class="mt-4">
        <label for="attachment-{index}" class="block text-sm font-medium text-gray-700">Return pickup report attachment:</label>
        <input 
          type="file" 
          id="attachment-{index}" 
          on:change={(e) => handleReturnPickupFileChange(e, index)}
          class="mt-1 block w-full" 
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          required
          disabled={pickup.isSaved}
        >
        {#if pickup.file}
          <div class="mt-2">
            <button 
              type="button" 
              on:click={() => previewFile(pickup.file)}
              class="text-blue-600 hover:text-blue-800 mr-2"
            >
              Preview
            </button>
            <button 
              type="button" 
              on:click={() => downloadFile(pickup.file)}
              class="text-green-600 hover:text-green-800"
            >
              Download
            </button>
          </div>
        {/if}
      </div>
    
      {#if !pickup.isSaved}
        <button 
          type="button" 
          on:click={() => saveReturnPickup(index)}
          class="mt-4 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 absolute bottom-2 right-2"
        >
          Save
        </button>
      {/if}
   
      
      <!-- Approval/Rejection toggle buttons -->
      <div class="flex justify-center space-x-4 mb-4">
        <button
          type="button"
          class="px-3 py-1 {pickup.accountStatus === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-200'} rounded"
          on:click={() => {
            if (pickup.accountStatus === 'rejected') {
              pickup.rejected = false;
              pickup.rejectionRemark = '';
            }
            pickup.accountStatus = 'approved';
            pickup.accountRemark = '';
          }}
          disabled={pickup.isDataSaved}
        >
          Approved
        </button>
        <button
          type="button"
          class="px-3 py-1 {pickup.accountStatus === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-200'} rounded"
          on:click={() => {
            pickup.accountStatus = 'rejected';
            pickup.accountRemark = '';
            pickup.rejected = true;
            pickup.rejectionRemark = '';
          }}
          disabled={pickup.isDataSaved}
        >
          Rejected
        </button>
      </div>

      <!-- Remark field -->
      <div class="mb-2">
        <label for="pickup-remark-{index}" class="block text-sm font-medium text-gray-700">Remark:</label>
        <textarea 
          id="pickup-remark-{index}" 
          bind:value={pickup.accountRemark} 
          on:input={() => {
            if (pickup.accountStatus === 'rejected') {
              pickup.rejectionRemark = pickup.accountRemark;
            }
          }}
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
          rows="3" 
          required
          disabled={pickup.isDataSaved}
        ></textarea>
      </div>

      <!-- Save/Edit button -->
      <button 
        type="button" 
        on:click={() => {
          if (pickup.isDataSaved) {
            // Enter edit mode
            pickup.isDataSaved = false;
            pickup.isEditing = true;
          } else {
            // Validate before saving
            if (!pickup.accountStatus || !pickup.accountRemark || pickup.accountRemark.trim() === '') {
              alert("Please fill up the details before saving");
              return;
            }
            // Save changes
            pickup.isDataSaved = true;
            pickup.isEditing = false;
            // Add any additional save logic here
          }
        }}
        class="absolute down-2 right-2 px-2 py-1 {pickup.isDataSaved ? 'bg-blue-500' : 'bg-green-500'} text-white rounded text-sm"
      >
        {pickup.isDataSaved ? 'Edit' : 'Save'}
      </button>
    </div>
  {/each}
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

        <!-- Submit and navigation buttons -->
        <div class="flex justify-between items-center mt-8">
          <button 
            type="button" 
            on:click={goToPreviousStage}
            class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
          >
            Previous Stage
          </button>

          <div class="space-x-4">
            {#if stageData[currentStage].completed}
              <button 
                type="button" 
                on:click={editStage} 
                class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors duration-200"
              >
                Edit
              </button>
            {/if}
            <button 
              type="submit" 
              class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
            >
              Submit
            </button>
          </div>

          <button 
            type="button" 
            on:click={goToNextStage}
            class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
          >
            Next Stage
          </button>
        </div>
      </form>
    </div>


    <!-- Time information -->
    <footer class="bg-gray-100 p-4 text-sm text-gray-600">
      <div class="flex justify-between">
        {#if stageStartTimes[currentStage]}
          <p>Started on: {stageStartTimes[currentStage]}</p>
        {/if}
        {#if lastSavedTimes[currentStage] && !lastSubmittedTimes[currentStage]}
          <p>Last saved on: {lastSavedTimes[currentStage]}</p>
        {:else if lastSubmittedTimes[currentStage]}
          <p>Last submitted on: {lastSubmittedTimes[currentStage]}</p>
        {/if}
      </div>
    </footer>
  </div>
</div>

<style>
  /* Custom scrollbar styles */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  /* Smooth transitions */
  .transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }

  /* Custom focus styles */
  .focus\:outline-none:focus {
    outline: 2px solid transparent;
    outline-offset: 2px;
  }

  .focus\:ring-2:focus {
    --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
    --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
    box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
  }

  /* Gradient background for header */
  .bg-gradient-to-r {
    background-image: linear-gradient(to right, var(--tw-gradient-stops));
  }

  .from-blue-500 {
    --tw-gradient-from: #3B82F6;
    --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgb(59 130 246 / 0));
  }

  .to-purple-600 {
    --tw-gradient-to: #7C3AED;
  }

  /* Custom animation for collapsible section */
  @keyframes slideDown {
    from { max-height: 0; opacity: 0; }
    to { max-height: 1000px; opacity: 1; }
  }

  @keyframes slideUp {
    from { max-height: 1000px; opacity: 1; }
    to { max-height: 0; opacity: 0; }
  }

  .slide-enter-active {
    animation: slideDown 0.3s ease-out;
  }

  .slide-exit-active {
    animation: slideUp 0.3s ease-in;
  }
</style>

<!-- <style>
  :root {
  --primary-color: #4a90e2;
  --secondary-color: #50e3c2;
  --background-color: #f5f7fa;
  --card-background: #ffffff;
  --text-color: #333333;
  --border-color: #e0e0e0;
  --success-color: #27ae60;
  --warning-color: #f39c12;
  --danger-color: #e74c3c;
}

.modal {
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
}

.modal-content {
  background-color: var(--card-background);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-width: 900px;
  width: 95%;
  margin: 2rem auto;
  padding: 2rem;
}

/* Typography */
h2, h3, h4, h5 {
  color: var(--primary-color);
  margin-bottom: 1.5rem;
}

h2 {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2.5rem;
}

/* Form Card */
.form-card {
  background-color: var(--card-background);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
  transition: all 0.3s ease;
}

.form-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

/* Form elements */
input[type="text"],
input[type="tel"],
input[type="date"],
input[type="file"],
select,
textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

input[type="text"]:focus,
input[type="tel"]:focus,
input[type="date"]:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

/* Buttons */
button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-success {
  background-color: var(--success-color);
  color: white;
}

.btn-warning {
  background-color: var(--warning-color);
  color: white;
}

.btn-danger {
  background-color: var(--danger-color);
  color: white;
}

/* Tables */
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background-color: var(--card-background);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

th {
  background-color: var(--primary-color);
  color: white;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
}

/* Modern Stages Progress Bar */
.stages-progress {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  position: relative;
}

.stages-progress::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 4px;
  background-color: var(--border-color);
  transform: translateY(-50%);
  z-index: 1;
}

.stage-item {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stage-bullet {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: var(--card-background);
  border: 4px solid var(--border-color);
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  color: var(--text-color);
  transition: all 0.3s ease;
}

.stage-title {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-color);
  text-align: center;
}

.stage-item.active .stage-bullet {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.stage-item.completed .stage-bullet {
  background-color: var(--success-color);
  border-color: var(--success-color);
  color: white;
}

/* Responsive design */
@media (max-width: 768px) {
  .modal-content {
    padding: 1.5rem;
  }

  .stages-progress {
    flex-wrap: wrap;
  }

  .stage-item {
    flex-basis: 50%;
    margin-bottom: 1rem;
  }
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  animation: fadeIn 0.3s ease;
}
</style> -->