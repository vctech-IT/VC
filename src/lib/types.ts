// Interfaces for the Sales Order system

export interface SalesOrder {
    id: Int16Array;
    salesorder_id: string;
    salesorder_number: string;
    date: string;
    status: string;
    reference_number: string;
    customer_id: string;
    customer_name: string;
    contact_person_details: ContactPerson[];
    currency_code: string;
    currency_symbol: string;
    total_quantity: number;
    line_items: LineItem[];
    billing_address: Address;
    shipping_address: Address;
    notes: string;
    salesperson_name: string;
    sub_total: number;
    tax_total: number;
    total: number;
    taxes: Tax[];
    balance: number;
    company_details: CompanyDetails;
    customer_gst_no: string;
    place_of_supply: string;
    payment_terms: string;
    created_by: string;
    last_modified_by: string;
    created_time: string;
    last_modified_time: string;
    invoiced_status: string;
    payment_status: string;
    shipment_date: string | null;
    order_status: string;
    delivery_method: string | null;
    paid_status: string | null;
    documents: Document[];
    custom_fields: CustomField[];
    rounding_adjustment?: number;
}

export interface CustomField {
    label: string;
    value: string;
}

export interface CompanyDetails {
    company_name: string;
    company_address: string;
    company_city: string;
    company_state: string;
    company_country: string;
    company_gst_no: string;
}

export interface Document {
    file_name: string;
    document_id: string;
    file_size: string;
    file_size_formatted: string;
    uploaded_by: string;
    file_type: string;
    uploaded_on: string;
}

export interface ContactPerson {
    phone: string;
    mobile: string;
    last_name: string;
    contact_person_id: string;
    first_name: string;
    email: string;
}

export interface LineItem {
	id: number;
	status: string;
	amount: number;
    line_item_id: string;
    name: string;
    description: string;
    rate: number;
    quantity: number;
    unit: string;
    tax_name: string;
    tax_percentage: number;
    item_total: number;
    hsn_or_sac: string;
}

export interface Address {
    address: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
    attention: string;
}

export interface Tax {
    tax_amount: number;
    tax_name: string;
    tax_amount_formatted: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    isApproved: boolean;
    createdAt: Date;
}

export interface PageData {
    pendingUsers: User[];
    approvedUsers: User[];
    pendingUsersCount: number;
    approvedUsersCount: number;
}

export interface Invoice {
    invoice_id: string;
    date: string;
    invoice_number: string;
    reference_number?: string;
    customer_name: string;
    status: string;
    due_date: string;
    total: number;
    balance: number;
    branch_name?: string;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
}
