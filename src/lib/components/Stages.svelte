<script lang="ts">
  // Import statements
  import { derived } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import '$lib/styles/app.css'
  import { writable } from 'svelte/store';

  // Interface definitions
  interface LineItem {
     // ... (LineItem properties)
    id: number;
    description: string;
    hsnSac: string;
    qty: string;
    rate: number;
    amount: number;
    status: string | null;
  }
  
  interface OrderTotals {
     // ... (OrderTotals properties)
    subTotal: number;
    igst: number;
    total: number;
  }
  
  interface StageData {
     // ... (StageData properties)
    [key: string]: {
      submissionTime: Date;
      data: any;
    };
  }
  
  // Store declarations
  const isDropped: Writable<boolean> = writable(false);
  const isMonitoring: Writable<boolean> = writable(false);
  const soCategory: Writable<string> = writable('');
  const submissionTime: Writable<Date | null> = writable(null);
  const isPartiallyDeliver: Writable<boolean> = writable(false);
  const courierTrackingNo: Writable<string> = writable('');
  const deliveryDate: Writable<string> = writable('');
  const dispatchedDate: Writable<string> = writable('');
  const attachment: Writable<File | null> = writable(null);
  const stageData: Writable<StageData> = writable({});
  const partialSaved: Writable<boolean> = writable(false);
  const editingStage: Writable<string | null> = writable(null);
  const isEditMode: Writable<boolean> = writable(false);
  const completedStages: Writable<Set<string>> = writable(new Set());
  const showDroppedPopup = writable(false);
  const showMonitoringPopup = writable(false);
  const droppedRemarks = writable('');
  const monitoringRemarks = writable('');
  const showUndoDroppedPopup = writable(false);
  const showUndoMonitoringPopup = writable(false);
  const deliveryCount: Writable<number> = writable(1);
    
  // On Going stage state
  const isInstallation: Writable<boolean> = writable(true);
  const engineerName: Writable<string> = writable('');
  const scheduleDate: Writable<string> = writable('');
  const mobileNumber: Writable<string> = writable('');
  const vendorName: Writable<string> = writable('');
  const remarks: Writable<string> = writable('');
  const reportAttachment: Writable<File | null> = writable(null);
  const serviceTicketId: Writable<string> = writable('');
  const isBillable: Writable<boolean> = writable(false);
  const billableAttachment: Writable<File | null> = writable(null);
  
  // Share with Account stage state
  const isApproved: Writable<boolean> = writable(true);
  const accountRemarks: Writable<string> = writable('');
  
  // Return Pickup stage state
  const isReturnAvailable: Writable<boolean> = writable(true);
  const returnRemarks: Writable<string> = writable('');
  const dcDeliveryDate: Writable<string> = writable('');
  
  // Rejection alert state
  const rejectionAlert: Writable<string> = writable('');
  
    // Constants
  const stages = [
    'Site Not Ready',
    'Material to Procure',
    'Logistics',
    'On Going',
    'Share with Account',
    'Return Pickup'
  ];
  
  const soCategoryOptions = [
     // ... (SO category options)
    'CAPEX Project',
    'OPEX Project',
    'CAPEX Project ABSW',
    'OPEX Project ABSW',
    'Replacement under Warranty',
    'CAPEX Service',
    'CAPEX Service - ABSW',
    'FOC-POC',
    'OPEX Service',
    'CAMC'
  ];
  
  // Initial data
  const lineItems: Writable<LineItem[]> = writable([
    // ... (initial line items)
    { id: 1, description: "NVR - Hikvision 32-Channel K4-SATA", hsnSac: "85211012", qty: "1 Nos.", rate: 27500.00, amount: 27500.00, status: null },
    { id: 2, description: "Video Analytics Device", hsnSac: "84762110", qty: "1 Nos.", rate: 150000.00, amount: 150000.00, status: null },
    { id: 3, description: "Patch Cord CAT6 - 2 Meters", hsnSac: "85441110", qty: "3 Nos.", rate: 275.00, amount: 825.00, status: null },
    { id: 4, description: "Installation Charges", hsnSac: "995461", qty: "1 Lot", rate: 1500.00, amount: 1500.00, status: null },
    { id: 5, description: "Transportation Charges", hsnSac: "996791", qty: "1 pcs", rate: 2875.00, amount: 2875.00, status: null },
  ]);
  
  const orderTotals: OrderTotals = {
      // ... (initial order totals)
    subTotal: 182700.00,
    igst: 32886.00,
    total: 215586.00
  };
  
  // Utility functions

  function validateMobileNumber(number: string): boolean {
    // ... (mobile number validation logic)
  const regex = /^\d{10}$/;
  return regex.test(number);
}
  
  // Event handlers
  async function submitData(data: any) {
      const response = await fetch('http://localhost:5173/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    }
  


  function handleSubmit(stage: string): void {
     // ... (submission logic for each stage)

    if (stage === 'Site Not Ready') {
      if (!$soCategory)
      alert('Please select an SO Category before submitting.');
      else 
      submitData(soCategory);
    }
    let isValid = true;
    let errorMessage = '';
  
    switch (stage) {
      case 'Material to Procure':
        if ($isPartiallyDeliver && !$partialSaved) {
          alert('Please save the partial delivery before submitting.');
          return;
        }
        const hasNotAvailableItems = $lineItems.some(item => item.status === 'Not Available');
        if (!hasNotAvailableItems) {
          isPartiallyDeliver.set(false);
        }
        break;
      case 'On Going':
        if (!$engineerName || !$scheduleDate || !$mobileNumber || !validateMobileNumber($mobileNumber) || !$vendorName || !$remarks || !$reportAttachment) {
          isValid = false;
          errorMessage = 'Please fill all required fields with valid information for On Going stage.';
        }
        if (!$isInstallation && (!$serviceTicketId || ($isBillable && !$billableAttachment))) {
          isValid = false;
          errorMessage = 'Please fill all required fields for Service.';
        }
        break;
      case 'Share with Account':
        if (!$accountRemarks) {
          isValid = false;
          errorMessage = 'Please fill the remarks field.';
          console.log('Share with Account submitted:', $isApproved, $accountRemarks);

        }
        break;
        
      case 'Return Pickup':
        if ($isReturnAvailable && (!$dcDeliveryDate || !$returnRemarks)) {
          isValid = false;
          errorMessage = 'Please fill all required fields for Return Pickup.';
        }
        break;
      default:
        break;
    }
  
    if (!isValid) {
      alert(errorMessage);
      return;
    }
  
    const newSubmissionTime = new Date();
    submissionTime.set(newSubmissionTime);
    
    let stageDataToSave = getStageData(stage);
  
    if (stage === 'Material to Procure') {
    if ($lineItems.some(item => item.status === null || item.status === undefined)) {
      alert('Please select a status for all line items before submitting.');
      return;
    }
    if ($lineItems.some(item => item.status === 'Not Available')) {
      alert('Cannot submit when any item is marked as Not Available.');
      return;
    }
    if ($isPartiallyDeliver && !$partialSaved) {
      alert('Please save the partial delivery before submitting.');
      return;
    }
  }

  if (stage === 'Share with Account') {
    if (!$isApproved) {
      stageData.update(sd => {
        const updatedData = {
          ...sd,
          'On Going': {
            ...sd['On Going'],
            data: {
              ...(sd['On Going']?.data || {}),
              rejectionAlert: $accountRemarks
            }
          }
        };
        console.log('Updated stageData after rejection:', updatedData);
        return updatedData;
      });
    } else {
      stageData.update(sd => {
        const updatedData = {
          ...sd,
          'On Going': {
            ...sd['On Going'],
            data: {
              ...(sd['On Going']?.data || {}),
              rejectionAlert: null
            }
          }
        };
        console.log('Updated stageData after approval:', updatedData);
        return updatedData;
      });
    }
  }
  
    stageData.update(sd => ({
      ...sd,
      [stage]: {
        submissionTime: newSubmissionTime,
        data: stageDataToSave
      }
    }));
  
    completedStages.update(cs => {
      cs.add(stage);
      return cs;
    });
    isEditMode.set(false);
    editingStage.set(null);
  }
  

  function getStageData(stage: string): any {
    // ... (get data for each stage)

    switch (stage) {
      case 'Site Not Ready':
        return { soCategory: $soCategory };
      case 'Material to Procure':
        return { lineItems: $lineItems, isPartiallyDeliver: $isPartiallyDeliver, orderTotals };
      case 'Logistics':
        return { 
          courierTrackingNo: $courierTrackingNo, 
          deliveryDate: $deliveryDate, 
          dispatchedDate: $dispatchedDate, 
          attachment: $attachment ? $attachment.name : null,
          billType: orderTotals.subTotal < 50000 ? 'DC Bill' : 'E-way Bill'
        };
      case 'On Going':
        return {
          isInstallation: $isInstallation,
          engineerName: $engineerName,
          scheduleDate: $scheduleDate,
          mobileNumber: $mobileNumber,
          vendorName: $vendorName,
          remarks: $remarks,
          reportAttachment: $reportAttachment ? $reportAttachment.name : null,
          serviceTicketId: $isInstallation ? null : $serviceTicketId,
          isBillable: $isInstallation ? null : $isBillable,
          billableAttachment: $isInstallation || !$isBillable ? null : ($billableAttachment ? $billableAttachment.name : null)
        };
      case 'Share with Account':
        return { isApproved: $isApproved, accountRemarks: $accountRemarks };
      case 'Return Pickup':
        return { isReturnAvailable: $isReturnAvailable, returnRemarks: $returnRemarks, dcDeliveryDate: $dcDeliveryDate };
      default:
        return {};
    }
  }
  
  // ... (clear data for On Going stage)

  function clearOnGoingData(): void {
    engineerName.set('');
    scheduleDate.set('');
    mobileNumber.set('');
    vendorName.set('');
    remarks.set('');
    reportAttachment.set(null);
    serviceTicketId.set('');
    isBillable.set(false);
    billableAttachment.set(null);
  }
  
    // Modified toggle functions
    function handleDroppedToggle(): void {
    showDroppedPopup.set(true);
  }

  function handleMonitoringToggle(): void {
    showMonitoringPopup.set(true);
  }

  // New submit functions for pop-ups
  function submitDropped(): void {
    isDropped.set(true);
    isMonitoring.set(false);
    submissionTime.set(new Date());
    showDroppedPopup.set(false);
  }

  function submitMonitoring(): void {
    isMonitoring.set(true);
    isDropped.set(false);
    submissionTime.set(new Date());
    showMonitoringPopup.set(false);
  }

  // Drop or Moni Bill Undo functions
function handleUndoDroppedToggle(): void {
  showUndoDroppedPopup.set(true);
}

function handleUndoMonitoringToggle(): void {
  showUndoMonitoringPopup.set(true);
}

function confirmUndoDropped(): void {
  isDropped.set(false);
  droppedRemarks.set('');
  showUndoDroppedPopup.set(false);
  submissionTime.set(new Date());
}

function confirmUndoMonitoring(): void {
  isMonitoring.set(false);
  monitoringRemarks.set('');
  showUndoMonitoringPopup.set(false);
  submissionTime.set(new Date());
}
  
   // ... (change status of line items)

  function handleStatusChange(id: number, status: string | null): void {
    lineItems.update(items => 
      items.map(item => 
        item.id === id ? { ...item, status: status || null } : item
      )
    );
    isEditMode.set(true);
  }
   
  // ... (submission disable logic)
  const isSubmitDisabled = derived(
  [lineItems, isPartiallyDeliver, partialSaved],
  ([$lineItems, $isPartiallyDeliver, $partialSaved]) => {
    const allItemsHaveStatus = !$lineItems.some(item => item.status === null || item.status === undefined);
    const hasNotAvailableItems = $lineItems.some(item => item.status === 'Not Available');
    return !allItemsHaveStatus || hasNotAvailableItems;
  }
);
  
   // ... (save partial delivery data)

   function handleSave(): void {
  const partialData = {
    lineItems: $lineItems,
    isPartiallyDeliver: $isPartiallyDeliver,
    orderTotals
  };
  console.log('Saved partial delivery', partialData);
  partialSaved.set(true);
  stageData.update(sd => ({
    ...sd,
    'Material to Procure': {
      submissionTime: new Date(),
      data: partialData
    }
  }));
  completedStages.update(cs => {
    cs.add('Material to Procure');
    return cs;
  });
  isEditMode.set(false);
}
  
  // ... (handle file attachment changes)

  function handleAttachmentChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      const file = target.files[0];
      if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
        attachment.set(file);
      } else {
        alert('Please upload only PDF or image files.');
      }
    }
  }
  // ... (handle file attachments)
  function handleFileAttachment(event: Event, setter: Writable<File | null>): void {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      const file = target.files[0];
      if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
        setter.set(file);
      } else {
        alert('Please upload only PDF or image files.');
      }
    }
  }
  
   // ... (submit logistics data)
   function handleLogisticsSubmit(): void {
  if (!$courierTrackingNo || !$deliveryDate || !$dispatchedDate || !$attachment) {
    alert('Please fill all fields and attach a document.');
    return;
  }
  handleSubmit('Logistics');
}
  
  // ... (edit stage data)

  function handleEdit(stage: string): void {
    editingStage.set(stage);
    isEditMode.set(true);
    if (stage === 'On Going') {
    // stageData.update(sd => ({
    //   ...sd,
    //   'On Going': {
    //     ...sd['On Going'],
    //     rejectionAlert: null
    //   }
    // }));
  }
  
    const savedData = $stageData[stage]?.data;
    if (savedData) {
      switch (stage) {
        case 'Site Not Ready':
          soCategory.set(savedData.soCategory);
          break;
        case 'Material to Procure':
          
          if ($isPartiallyDeliver && !$partialSaved) {
            alert('Please save the partial delivery before submitting.');
            return;
          }
          partialSaved.set(false);
          lineItems.set(savedData.lineItems);
          isPartiallyDeliver.set(savedData.isPartiallyDeliver);
          break;
        case 'Logistics':
          courierTrackingNo.set(savedData.courierTrackingNo);
          deliveryDate.set(savedData.deliveryDate);
          dispatchedDate.set(savedData.dispatchedDate);
          break;
        case 'On Going':
          isInstallation.set(savedData.isInstallation);
          engineerName.set(savedData.engineerName);
          scheduleDate.set(savedData.scheduleDate);
          mobileNumber.set(savedData.mobileNumber);
          vendorName.set(savedData.vendorName);
          remarks.set(savedData.remarks);
          serviceTicketId.set(savedData.serviceTicketId);
          isBillable.set(savedData.isBillable);
          break;
        case 'Share with Account':
          isApproved.set(savedData.isApproved);
          accountRemarks.set(savedData.accountRemarks);
          break;
        case 'Return Pickup':
          isReturnAvailable.set(savedData.isReturnAvailable);
          returnRemarks.set(savedData.returnRemarks);
          dcDeliveryDate.set(savedData.dcDeliveryDate);
          break;
        default:
          break;
      }
    }
  }
  
  const maxDate = new Date().toISOString().split('T')[0];
  $: {
  console.log('Current stageData:', $stageData);
}
</script>
  
  <!-- // HTML template
  // ... (The entire HTML template with Svelte directives) -->

  <div class="stage-page bg-gray-100 font-sans w-full mx-auto p-4 text-gray-800">
    <div class="stage-page bg-gray-100 font-sans max-w-7xl mx-auto p-8 text-gray-800">
      <div class="toggle-buttons-container flex justify-center mb-12">
        <div class="toggle-buttons flex gap-6">
          <button 
            class="toggle-button"
            style="padding: 12px 25px; background-color: {$isDropped ? '#4CAF50' : '#ffffff'}; color: {$isDropped ? 'white' : '#555'}; border: 1px solid {$isDropped ? '#4CAF50' : '#e0e0e0'}; border-radius: 5px; cursor: pointer; transition: all 0.3s ease; font-weight: 500;"
            on:click={$isDropped ? handleUndoDroppedToggle : handleDroppedToggle}
          >
            {$isDropped ? 'Undo Dropped' : 'Dropped (Void)'}
          </button>
          <button 
            class="toggle-button"
            style="padding: 12px 25px; background-color: {$isMonitoring ? '#4CAF50' : '#ffffff'}; color: {$isMonitoring ? 'white' : '#555'}; border: 1px solid {$isMonitoring ? '#4CAF50' : '#e0e0e0'}; border-radius: 5px; cursor: pointer; transition: all 0.3s ease; font-weight: 500;"
            on:click={$isMonitoring ? handleUndoMonitoringToggle : handleMonitoringToggle}
          >
            {$isMonitoring ? 'Undo Monitoring' : 'Monitoring Billing'}
          </button>
        </div>
      </div>
  
      {#if $isDropped || $isMonitoring}
        <div class="status-box bg-yellow-100 border border-yellow-200 rounded-lg p-6 mb-12 text-center font-medium text-lg shadow-md">
          <p>{$isDropped ? "SO is dropped" : "Bill is getting monitored"}</p>
          <p class="mt-2 text-sm">{$isDropped ? $droppedRemarks : $monitoringRemarks}</p>
        </div>
      {/if}
  
      {#if !$isDropped && !$isMonitoring}
        <div class="stage-tracker flex justify-between mb-12 bg-white p-6 rounded-lg shadow-lg">
          {#each stages as stage, index}
            <div class="tracker-item flex-1 text-center p-4 bg-gray-100 border border-gray-300 relative font-medium text-sm {$completedStages.has(stage) ? 'bg-green-500 text-white border-green-500' : ''} rounded-lg transition-all duration-300">
              {stage}
              {#if index < stages.length - 1}
                <div class="absolute top-1/2 right-0 w-6 h-0.5 bg-gray-300 transform translate-x-full"></div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
  
      {#if !$isDropped && !$isMonitoring}
        <div class="stages-container flex flex-col gap-12">
          {#each stages as stage, index}
          {@const isCompleted = $completedStages.has(stage)}
          {@const isAccessible = index === 0 || $completedStages.has(stages[index - 1]) || (stage === 'On Going' && $stageData['Share with Account']?.data?.isApproved === false)}
          
          
        
          <div class="stage-box bg-white border border-gray-300 rounded-lg p-8 shadow-lg {!isAccessible ? 'opacity-60 pointer-events-none' : ''}">
            <h2 class="text-2xl font-semibold mb-6 pb-3 border-b-2 border-green-500">Stage {index + 1}: {stage}</h2>
            <div class="stage-content">
              {#if isCompleted && $editingStage !== stage}
                <div class="submitted-data bg-green-50 p-6 rounded-lg mb-6 shadow-md">
                  {#if stage === 'Site Not Ready'}
                    <p class="text-lg">SO Category: {($stageData[stage]?.data ?? {}).soCategory}</p>
                  {:else if stage === 'Material to Procure'}
                    <h4 class="font-semibold mb-4 text-lg">Submitted Line Items</h4>
                    <div class="overflow-x-auto">
                      <table class="w-full mb-6">
                        <thead>
                          <tr class="bg-gray-200">
                            <th class="text-left p-3">#</th>
                            <th class="text-left p-3">Description</th>
                            <th class="text-left p-3">HSN/SAC</th>
                            <th class="text-left p-3">Qty</th>
                            <th class="text-left p-3">Rate</th>
                            <th class="text-left p-3">Amount</th>
                            <th class="text-left p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {#each ($stageData[stage]?.data?.lineItems ?? []) as item}
                            <tr class="border-b">
                              <td class="p-3">{item.id}</td>
                              <td class="p-3">{item.description}</td>
                              <td class="p-3">{item.hsnSac}</td>
                              <td class="p-3">{item.qty}</td>
                              <td class="p-3">₹{item.rate.toFixed(2)}</td>
                              <td class="p-3">₹{item.amount.toFixed(2)}</td>
                              <td class="p-3">{item.status}</td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                    <div class="order-totals bg-green-100 p-4 rounded-lg shadow-inner">
                      <h4 class="font-semibold mb-3 text-lg">Order Totals</h4>
                      <p class="mb-2">Sub Total: ₹{orderTotals.subTotal.toFixed(2)}</p>
                      <p class="mb-2">IGST18 (18%): ₹{orderTotals.igst.toFixed(2)}</p>
                      <p class="font-medium">Total: ₹{orderTotals.total.toFixed(2)}</p>
                    </div>
                    {#if ($stageData[stage]?.data ?? {}).isPartiallyDeliver}
                      <p class="mt-4 text-lg font-medium">Partial Delivery: Yes</p>
                    {/if}
                  {:else if stage === 'Logistics'}
                    <p class="mb-3 text-lg">Type Of Bill: {($stageData[stage]?.data ?? {}).billType}</p>
                    <p class="mb-3 text-lg">Courier's tracking no.: {($stageData[stage]?.data ?? {}).courierTrackingNo}</p>
                    <p class="mb-3 text-lg">Delivery date: {($stageData[stage]?.data ?? {}).deliveryDate}</p>
                    <p class="mb-3 text-lg">Dispatched date: {($stageData[stage]?.data ?? {}).dispatchedDate}</p>
                    <p class="mb-3 text-lg">Attachment: {($stageData[stage]?.data ?? {}).attachment}</p>
                  {:else if stage === 'On Going'}
                    {#if ($stageData['On Going']?.data ?? {}).rejectionAlert}
                      <div class="rejection-alert bg-red-100 border border-red-200 text-red-700 p-4 rounded-lg mb-4 shadow-md">
                        <p class="font-medium text-lg">Rejected: {($stageData['On Going']?.data ?? {}).rejectionAlert}</p>
                      </div>
                    {/if}
                    <p class="mb-3 text-lg">Type: {($stageData[stage]?.data ?? {}).isInstallation ? 'Installation' : 'Service'}</p>
                    <p class="mb-3 text-lg">Engineer name: {($stageData[stage]?.data ?? {}).engineerName}</p>
                    <p class="mb-3 text-lg">Schedule date: {($stageData[stage]?.data ?? {}).scheduleDate}</p>
                    <p class="mb-3 text-lg">Mobile number: {($stageData[stage]?.data ?? {}).mobileNumber}</p>
                    <p class="mb-3 text-lg">Vendor name: {($stageData[stage]?.data ?? {}).vendorName}</p>
                    <p class="mb-3 text-lg">Remarks: {($stageData[stage]?.data ?? {}).remarks}</p>
                    <p class="mb-3 text-lg">{($stageData[stage]?.data ?? {}).isInstallation ? 'Installation' : 'Service'} report: {($stageData[stage]?.data ?? {}).reportAttachment}</p>
                    {#if !($stageData[stage]?.data ?? {}).isInstallation}
                      <p class="mb-3 text-lg">Service ticket id: {($stageData[stage]?.data ?? {}).serviceTicketId}</p>
                      <p class="mb-3 text-lg">Billable: {($stageData[stage]?.data ?? {}).isBillable ? 'Yes' : 'No'}</p>
                      {#if ($stageData[stage]?.data ?? {}).isBillable}
                        <p class="mb-3 text-lg">Billable attachment: {($stageData[stage]?.data ?? {}).billableAttachment}</p>
                      {/if}
                    {/if}
                  {:else if stage === 'Share with Account'}
                    <p class="mb-3 text-lg font-medium">{($stageData[stage]?.data ?? {}).isApproved ? 'Approved' : 'Rejected'}</p>
                    <p class="mb-3 text-lg">Remarks: {($stageData[stage]?.data ?? {}).accountRemarks}</p>
                  {:else if stage === 'Return Pickup'}
                    <p class="mb-3 text-lg font-medium">{($stageData[stage]?.data ?? {}).isReturnAvailable ? 'Available' : 'Not Available'}</p>
                    {#if ($stageData[stage]?.data ?? {}).isReturnAvailable}
                      <p class="mb-3 text-lg">DC Delivery Date: {($stageData[stage]?.data ?? {}).dcDeliveryDate}</p>
                      <p class="mb-3 text-lg">Remarks: {($stageData[stage]?.data ?? {}).returnRemarks}</p>
                    {/if}
                  {/if}
                  <p class="text-sm text-gray-500 mt-4">Submitted on: {($stageData[stage]?.submissionTime ?? new Date()).toLocaleString()}</p>
                  <button on:click={() => handleEdit(stage)} class="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md">Edit</button>
                </div>
              {:else if isAccessible && ($editingStage === stage || !isCompleted)}
              {#if stage === 'Site Not Ready'}
              <div class="site-not-ready">
                <div class="flex justify-between items-center">
                  <div class="so-category flex items-center">
                    <label for="soCategory" class="font-medium text-lg mr-4">SO Category:</label>
                    <select 
                      id="soCategory" 
                      bind:value={$soCategory}
                      class="w-64 p-3 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                      <option value="">Select a category</option>
                      {#each soCategoryOptions as option}
                        <option value={option}>{option}</option>
                      {/each}
                    </select>
                  </div>
                  <button 
                    on:click={() => handleSubmit('Site Not Ready')} 
                    class="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md"
                  >
                    Submit
                  </button>
                </div>
              </div>
                    {:else if stage === 'Material to Procure'}
                  <div class="material-to-procure">
                    <h3 class="text-xl font-semibold mb-4">Line Items</h3>
                    <div class="overflow-x-auto">
                      <table class="w-full mb-8">
                        <thead>
                          <tr class="bg-gray-200">
                            <th class="text-left p-3">#</th>
                            <th class="text-left p-3">Description</th>
                            <th class="text-left p-3">HSN/SAC</th>
                            <th class="text-left p-3">Qty</th>
                            <th class="text-left p-3">Rate</th>
                            <th class="text-left p-3">Amount</th>
                            <th class="text-center p-3">Available</th>
                            <th class="text-center p-3">Not Available</th>
                            <th class="text-center p-3">Need to purchase locally</th>
                            <th class="text-center p-3">Not Required</th>
                          </tr>
                        </thead>
                        <tbody>
                          {#each $lineItems as item}
                            <tr class="border-b">
                              <td class="p-3">{item.id}</td>
                              <td class="p-3">{item.description}</td>
                              <td class="p-3">{item.hsnSac}</td>
                              <td class="p-3">{item.qty}</td>
                              <td class="p-3">₹{item.rate.toFixed(2)}</td>
                              <td class="p-3">₹{item.amount.toFixed(2)}</td>
                              {#each ['Available', 'Not Available', 'Need to purchase locally', 'Not Required'] as status}
                                <td class="text-center p-3">
                                  <input
                                    type="checkbox"
                                    checked={item.status === status}
                                    on:change={() => handleStatusChange(item.id, status)}
                                    class="form-checkbox h-5 w-5 text-blue-600"
                                  />
                                </td>
                              {/each}
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                    
                    <div class="order-totals bg-green-100 p-6 rounded-lg shadow-inner mb-6">
                      <h4 class="font-semibold mb-3 text-lg">Order Totals</h4>
                      <p class="mb-2 text-lg">Sub Total: ₹{orderTotals.subTotal.toFixed(2)}</p>
                      <p class="mb-2 text-lg">IGST18 (18%): ₹{orderTotals.igst.toFixed(2)}</p>
                      <p class="font-medium text-lg">Total: ₹{orderTotals.total.toFixed(2)}</p>
                    </div>

                    {#if $lineItems.some(item => item.status === null || item.status === undefined)}
                      <p class="text-red-500 mt-4">Please select a status for all line items before submitting.</p>
                    {/if}
                    
                    {#if $lineItems.some(item => item.status === 'Not Available')}
                      <p class="text-red-500 mt-4">Cannot submit when any item is marked as Not Available. Please use the Partial Delivery option.</p>
                    {/if}

                    <div class="flex items-center justify-between mt-6">
                      <div class="toggle-buttons">
                        <button 
                          class="toggle-button"
                          style="padding: 12px 25px; background-color: {$isPartiallyDeliver ? '#4CAF50' : '#ffffff'}; color: {$isPartiallyDeliver ? 'white' : '#555'}; border: 1px solid {$isPartiallyDeliver ? '#4CAF50' : '#e0e0e0'}; border-radius: 5px; cursor: pointer; transition: all 0.3s ease; font-weight: 500;"
                          on:click={() => isPartiallyDeliver.update(v => !v)}
                        >
                          Partial Delivery
                        </button>
                      </div>
                      <button 
                        on:click={() => handleSubmit('Material to Procure')} 
                        class="px-8 py-3 text-white rounded-lg transition-colors shadow-md {$isSubmitDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}"
                        disabled={$isSubmitDisabled}
                      >
                        Submit
                      </button>
                      {#if $isPartiallyDeliver}
                        <button 
                          on:click={handleSave} 
                          class="px-8 py-3 text-white rounded-lg transition-colors shadow-md {$partialSaved ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}"
                        >
                          {$partialSaved ? 'Saved' : 'Save'}
                        </button>
                    {/if}
                  </div>
                </div>
                {:else if stage === 'Logistics'}
                  
                  <div class="logistics">
                    <div class="flex justify-center mb-8">
                      <div class="bill-type-buttons flex gap-6">
                        <button 
                          class="px-8 py-3 border rounded-lg shadow-md {orderTotals.subTotal < 50000 ? 'bg-green-500 text-white border-green-500' : 'bg-white border-gray-300 text-gray-700'}"
                        >
                          DC Bill
                        </button>
                        
                        <button 
                          class="px-8 py-3 border rounded-lg shadow-md {orderTotals.subTotal >= 50000 ? 'bg-green-500 text-white border-green-500' : 'bg-white border-gray-300 text-gray-700'}"
                        >
                          E-way Bill
                        </button>
                      </div>
                    </div>
                    
                    <div class="logistics-form space-y-6">
                      <div class="flex space-x-8">
                        <div class="flex-1">
                          <label class="block">
                            <span class="text-gray-700 text-lg">Courier's tracking no.:</span>
                            <input
                              type="text"
                              bind:value={$courierTrackingNo}
                              required
                              class="mt-1 block w-full rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            />
                          </label>
                        </div>
                        <div class="flex-1">
                          <label class="block">
                            <span class="text-gray-700 text-lg">Delivery date:</span>
                            <input
                              type="date"
                              max={maxDate}
                              bind:value={$deliveryDate}
                              required
                              class="mt-1 block w-full rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            />
                          </label>
                        </div>
                      </div>
                      
                      <div class="flex space-x-8">
                        <div class="flex-1">
                          <label class="block">
                            <span class="text-gray-700 text-lg">Dispatched date:</span>
                            <input
                              type="date"
                              max={maxDate}
                              bind:value={$dispatchedDate}
                              required
                              class="mt-1 block w-full rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            />
                          </label>
                        </div>
                        <div class="flex-1">
                          <label class="block">
                            <span class="text-gray-700 text-lg">Attachment:</span>
                            <input
                              type="file"
                              accept="application/pdf,image/*"
                              on:change={handleAttachmentChange}
                              required
                              class="mt-1 block w-full border-2 border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                          </label>
                        </div>
                      </div>
                      
                      <div class="flex justify-end">
                        <button 
                          on:click={handleLogisticsSubmit} 
                          class="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors shadow-md"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  </div>
                
                            
                {:else if stage === 'On Going'}
                <div class="on-going">
                  {#if ($stageData['On Going']?.data ?? {}).rejectionAlert}
                    <div class="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg relative mb-6 shadow-md" role="alert">
                      <strong class="font-bold text-lg">Rejected:</strong>
                      <span class="block sm:inline text-lg ml-2">{($stageData['On Going']?.data ?? {}).rejectionAlert}</span>
                    </div>
                  {/if}
                  <div class="flex justify-center mb-8">
                    <div class="bill-type-buttons flex gap-6">
                    <button 
                      class="toggle-button"
                      style="padding: 12px 25px; background-color: {$isInstallation ? '#4CAF50' : '#ffffff'}; color: {$isInstallation ? 'white' : '#555'}; border: 1px solid {$isInstallation ? '#4CAF50' : '#e0e0e0'}; border-radius: 5px; cursor: pointer; transition: all 0.3s ease; font-weight: 500;"
                      on:click={() => {
                        isInstallation.set(true);
                        clearOnGoingData();
                      }}
                    >
                      Installation
                    </button>
                    <button 
                      class="toggle-button"
                      style="padding: 12px 25px; background-color: {!$isInstallation ? '#4CAF50' : '#ffffff'}; color: {!$isInstallation ? 'white' : '#555'}; border: 1px solid {!$isInstallation ? '#4CAF50' : '#e0e0e0'}; border-radius: 5px; cursor: pointer; transition: all 0.3s ease; font-weight: 500;"
                      on:click={() => {
                        isInstallation.set(false);
                        clearOnGoingData();
                      }}
                    >
                      Service
                    </button>
                  </div>
                  </div>

                  <div class="on-going-form space-y-6">
                    <div class="flex space-x-8">
                      <div class="flex-1">
                        <label class="block">
                          <span class="text-gray-700 text-lg">Engineer name:</span>
                          <input
                            type="text"
                            bind:value={$engineerName}
                            required
                            class="mt-1 block w-full rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          />
                        </label>
                      </div>
                      <div class="flex-1">
                        <label class="block">
                          <span class="text-gray-700 text-lg">Schedule date:</span>
                          <input
                            type="date"
                            max={maxDate}
                            bind:value={$scheduleDate}
                            required
                            class="mt-1 block w-full rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          />
                        </label>
                      </div>
                    </div>
                    
                    <div class="flex space-x-8">
                      <div class="flex-1">
                        <label class="block">
                          <span class="text-gray-700 text-lg">Mobile number:</span>
                          <input
                            type="tel"
                            bind:value={$mobileNumber}
                            on:input={(e) => {
                              const value = e.currentTarget.value.replace(/\D/g, '').slice(0, 10);
                              mobileNumber.set(value);
                            }}
                            pattern="\d{10}"
                            maxlength="10"
                            required
                            class="mt-1 block w-full rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          />
                          {#if $mobileNumber && !validateMobileNumber($mobileNumber)}
                            <span class="text-red-500 text-sm mt-1">Please enter a valid 10-digit mobile number</span>
                          {/if}
                        </label>
                      </div>
                      <div class="flex-1">
                        <label class="block">
                          <span class="text-gray-700 text-lg">Vendor name:</span>
                          <input
                            type="text"
                            bind:value={$vendorName}
                            required
                            class="mt-1 block w-full rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          />
                        </label>
                      </div>
                    </div>
                    
                    <div class="flex space-x-8">
                      <div class="flex-1">
                        <label class="block">
                          <span class="text-gray-700 text-lg">{$isInstallation ? 'Installation' : 'Service'} remarks:</span>
                          <textarea
                            bind:value={$remarks}
                            required
                            rows="3"
                            class="mt-1 block w-full rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          ></textarea>
                        </label>
                      </div>
                      <div class="flex-1">
                        <label class="block">
                          <span class="text-gray-700 text-lg">{$isInstallation ? 'Installation' : 'Service'} report attachment:</span>
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            on:change={(e) => handleFileAttachment(e, reportAttachment)}
                            required
                            class="mt-1 block w-full border-2 border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          />
                        </label>
                      </div>
                    </div>
                    
                    {#if !$isInstallation}
                      <div class="flex space-x-8">
                        <div class="flex-1">
                          <label class="block">
                            <span class="text-gray-700 text-lg">Service ticket id:</span>
                            <input
                              type="text"
                              bind:value={$serviceTicketId}
                              required
                              class="mt-1 block w-full rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            />
                          </label>
                        </div>
                        <div class="flex-1">
                          {#if $isBillable}
                            <label class="block">
                              <span class="text-gray-700 text-lg">Billable attachment:</span>
                              <input
                                type="file"
                                accept="application/pdf,image/*"
                                on:change={(e) => handleFileAttachment(e, billableAttachment)}
                                required
                                class="mt-1 block w-full border-2 border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                              />
                            </label>
                          {/if}
                        </div>
                      </div>
                    {/if}
                    
                    <div class="flex justify-between items-center">
                      
                      
                      {#if !$isInstallation}
                        <div class="toggle-buttons">
                          <button 
                            class="toggle-button"
                            style="padding: 12px 25px; background-color: {$isBillable ? '#4CAF50' : '#ffffff'}; color: {$isBillable ? 'white' : '#555'}; border: 1px solid {$isBillable ? '#4CAF50' : '#e0e0e0'}; border-radius: 5px; cursor: pointer; transition: all 0.3s ease; font-weight: 500;"
                            on:click={() => isBillable.set(true)}
                          >
                            Billable
                          </button>
                          <button 
                            class="toggle-button"
                            style="padding: 12px 25px; background-color: {!$isBillable ? '#4CAF50' : '#ffffff'}; color: {!$isBillable ? 'white' : '#555'}; border: 1px solid {!$isBillable ? '#4CAF50' : '#e0e0e0'}; border-radius: 5px; cursor: pointer; transition: all 0.3s ease; font-weight: 500;"
                            on:click={() => isBillable.set(false)}
                          >
                            Not billable
                          </button>
                        </div>
                      {/if}
                    </div>
                    
                    <div class="flex justify-end">
                      <button 
                        on:click={() => handleSubmit('On Going')} 
                        class="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors shadow-md"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              {:else if stage === 'Share with Account'}
              <div class="share-with-account">
                <div class="flex justify-center mb-8">
                  <div class="bill-type-buttons flex gap-6">
                  <button 
                    class="toggle-button"
                    style="padding: 12px 25px; background-color: {$isApproved ? '#4CAF50' : '#ffffff'}; color: {$isApproved ? 'white' : '#555'}; border: 1px solid {$isApproved ? '#4CAF50' : '#e0e0e0'}; border-radius: 5px; cursor: pointer; transition: all 0.3s ease; font-weight: 500;"
                    on:click={() => isApproved.set(true)}
                  >
                    Approve
                  </button>
                  <button 
                    class="toggle-button"
                    style="padding: 12px 25px; background-color: {!$isApproved ? '#4CAF50' : '#ffffff'}; color: {!$isApproved ? 'white' : '#555'}; border: 1px solid {!$isApproved ? '#4CAF50' : '#e0e0e0'}; border-radius: 5px; cursor: pointer; transition: all 0.3s ease; font-weight: 500;"
                    on:click={() => isApproved.set(false)}
                  >
                    Reject
                  </button>
                </div>
                </div>
                <label class="block">
                  <span class="text-gray-700 text-lg">Remarks:</span>
                  <textarea
                    bind:value={$accountRemarks}
                    required
                    class="mt-2 block w-full rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  ></textarea>
                </label>
                <div class="flex justify-end mt-6">
                  <button 
                    on:click={() => handleSubmit('Share with Account')} 
                    class="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors shadow-md"
                  >
                    Submit
                  </button>
                </div>
              </div>
              {:else if stage === 'Return Pickup'}
              <div class="return-pickup">
                <div class="flex justify-center mb-8">
                  <div class="toggle-buttons flex gap-6">
                    <button 
                      class="toggle-button"
                      style="padding: 12px 25px; background-color: {$isReturnAvailable ? '#4CAF50' : '#ffffff'}; color: {$isReturnAvailable ? 'white' : '#555'}; border: 1px solid {$isReturnAvailable ? '#4CAF50' : '#e0e0e0'}; border-radius: 5px; cursor: pointer; transition: all 0.3s ease; font-weight: 500;"
                      on:click={() => isReturnAvailable.set(true)}
                    >
                      Available
                    </button>
                    <button 
                      class="toggle-button"
                      style="padding: 12px 25px; background-color: {!$isReturnAvailable ? '#4CAF50' : '#ffffff'}; color: {!$isReturnAvailable ? 'white' : '#555'}; border: 1px solid {!$isReturnAvailable ? '#4CAF50' : '#e0e0e0'}; border-radius: 5px; cursor: pointer; transition: all 0.3s ease; font-weight: 500;"
                      on:click={() => isReturnAvailable.set(false)}
                    >
                      Not Available
                    </button>
                  </div>
                </div>
            
                <div class="return-pickup-form space-y-6">
                  {#if $isReturnAvailable}
                    <div class="flex space-x-8">
                      <div class="flex-1">
                        <label class="block">
                          <span class="text-gray-700 text-lg">DC Delivery Date:</span>
                          <input
                            type="date"
                            max={maxDate}
                            bind:value={$dcDeliveryDate}
                            required
                            class="mt-1 block w-full rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          />
                        </label>
                      </div>
                      <div class="flex-1">
                        <label class="block">
                          <span class="text-gray-700 text-lg">Remarks:</span>
                          <textarea
                            bind:value={$returnRemarks}
                            required
                            rows="3"
                            class="mt-1 block w-full rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          ></textarea>
                        </label>
                      </div>
                    </div>
                  {/if}
                  
                  <div class="flex justify-end">
                    <button 
                      on:click={() => handleSubmit('Return Pickup')} 
                      class="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors shadow-md"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              
          
                {#if $stageData[stage]?.submissionTime}
                  <p class="mt-4 text-gray-600">
                    Last submitted on: {$stageData[stage].submissionTime.toLocaleString()}
                  </p>
            {/if}
            
          </div>
        {/if}
      {/if}
    </div>
  </div>   
{/each} 
</div>
{ /if}
<div class="mt-12 text-center">
  {#if $submissionTime}
    <p class="text-lg text-gray-600">
      Last submitted on: {$submissionTime.toLocaleString()}
    </p>
  {/if}
</div>
</div>

{#if $showDroppedPopup}
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg p-8 max-w-md w-full">
    <h2 class="text-2xl font-bold mb-4">Dropped (Void)</h2>
    <label class="block mb-4">
      <span class="text-gray-700">Remarks:</span>
      <textarea
        bind:value={$droppedRemarks}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        rows="3"
      ></textarea>
    </label>
    <div class="flex justify-end">
      <button
        on:click={() => showDroppedPopup.set(false)}
        class="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
      >
        Cancel
      </button>
      <button
        on:click={submitDropped}
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Submit
      </button>
    </div>
  </div>
</div>
{/if}

{#if $showMonitoringPopup}
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg p-8 max-w-md w-full">
    <h2 class="text-2xl font-bold mb-4">Monitoring Billing</h2>
    <label class="block mb-4">
      <span class="text-gray-700">Remarks:</span>
      <textarea
        bind:value={$monitoringRemarks}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        rows="3"
      ></textarea>
    </label>
    <div class="flex justify-end">
      <button
        on:click={() => showMonitoringPopup.set(false)}
        class="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
      >
        Cancel
      </button>
      <button
        on:click={submitMonitoring}
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Submit
      </button>
    </div>
  </div>
</div>
{/if}

{#if $showUndoDroppedPopup}
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg p-8 max-w-md w-full">
    <h2 class="text-2xl font-bold mb-4">Confirm Undo Dropped</h2>
    <p class="mb-6">Are you sure you want to undo the Dropped (Void) status?</p>
    <div class="flex justify-end">
      <button
        on:click={() => showUndoDroppedPopup.set(false)}
        class="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
      >
        Cancel
      </button>
      <button
        on:click={confirmUndoDropped}
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        OK
      </button>
    </div>
  </div>
</div>
{/if}

{#if $showUndoMonitoringPopup}
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg p-8 max-w-md w-full">
    <h2 class="text-2xl font-bold mb-4">Confirm Undo Monitoring</h2>
    <p class="mb-6">Are you sure you want to undo the Monitoring Billing status?</p>
    <div class="flex justify-end">
      <button
        on:click={() => showUndoMonitoringPopup.set(false)}
        class="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
      >
        Cancel
      </button>
      <button
        on:click={confirmUndoMonitoring}
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        OK
      </button>
    </div>
  </div>
</div>
{/if}
</div>