export interface ShipRocketAuthResponse {
  token: string;
}

export interface ShipRocketCreateOrderPayload {
  order_id: string;
  order_date: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2: string;
  billing_city: string;
  billing_state: string;
  billing_pincode: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name: string;
  shipping_last_name: string;
  shipping_address: string;
  shipping_address_2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_country: string;
  shipping_email: string;
  shipping_phone: string;
  order_items: ShipRocketOrderItem[];
  payment_method: "Prepaid" | "COD";
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
  pickup_location: string;
  shipping_charges?: number;
  giftwrap_charges?: number;
  transaction_charges?: number;
  total_discount?: number;
  invoice_number?: string;
  invoice_date?: string;
  tax_number?: string;
  gst_number?: string;
}

export interface ShipRocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: number;
}

export interface ShipRocketCreateOrderResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed: boolean;
}

export interface ShipRocketAssignAwbPayload {
  shipment_id: number;
  courier_id: string;
  awb_code?: string;
  is_return?: number;
}

export interface ShipRocketAssignAwbResponse {
  awb_code: string;
  courier_name: string;
  status: string;
  response: string;
  etd?: string;
  awb_data?: string;
}

export interface ShipRocketPickupPayload {
  shipment_id: number;
  pickup_date: string;
  pickup_time: string;
  pickup_token_number?: string;
}

export interface ShipRocketPickupResponse {
  pickup_registered: boolean;
  pickup_token_number: string;
  response: string;
}

export interface ShipRocketLabelResponse {
  label_url: string;
  response: string;
}

export interface ShipRocketInvoiceResponse {
  invoice_url: string;
  response: string;
}

export interface ShipRocketTrackingResponse {
  tracking_data: {
    shipment_status: number;
    shipment_status_text: string;
    awb_code: string;
    courier_name: string;
    current_status: string;
    delivered: boolean;
    track: ShipRocketTrackEvent[];
    eta: string;
  };
}

export interface ShipRocketTrackEvent {
  id: number;
  location: string;
  status: string;
  activity: string;
  date: string;
  time: string;
  updated_time: string;
}

export interface ShipRocketCourierServiceabilityResponse {
  data: ShipRocketCourier[];
}

export interface ShipRocketCourier {
  courier_name: string;
  courier_id: number;
  freight_charge: number;
  pickup_location: string;
  pickup_date: string;
  estimated_delivery_days: number;
  tracking_url: string;
}

export interface ShipRocketError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}
