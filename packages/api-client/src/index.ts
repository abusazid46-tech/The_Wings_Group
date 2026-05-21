import type {
  AdminDashboard,
  AuthSession,
  Booking,
  BookingCreateInput,
  BookingStatusUpdateInput,
  CrmNote,
  CrmNoteCreateInput,
  CustomerSummary,
  GoogleLoginInput,
  Lead,
  LeadCreateInput,
  LeadUpdateInput,
  OtpRequestInput,
  OtpRequestResponse,
  OtpVerifyInput,
  RazorpayOrderCreateInput,
  RazorpayOrderResponse,
  RazorpayVerifyInput,
  RazorpayVerifyResponse,
  Service,
  ServiceCategory,
  ServiceCreateInput,
  ServiceUpdateInput,
  WhatsappMessageCreateInput,
  WhatsappSendResponse
} from "@the-wings/types";

type ApiClientOptions = {
  baseUrl: string;
  token?: string;
  credentials?: RequestCredentials;
};

export class ApiClient {
  private readonly baseUrl: string;
  private readonly token?: string;
  private readonly credentials: RequestCredentials;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.token = options.token;
    this.credentials = options.credentials ?? "include";
  }

  async requestOtp(input: OtpRequestInput) {
    return this.request<{ data: OtpRequestResponse }>("/auth/otp/request", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async verifyOtp(input: OtpVerifyInput) {
    return this.request<{ data: AuthSession }>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async loginWithGoogle(input: GoogleLoginInput) {
    return this.request<{ data: AuthSession }>("/auth/google", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async getMe() {
    return this.request<{ data: AuthSession["user"] }>("/auth/me");
  }

  async logout() {
    return this.request<{ data: { ok: true } }>("/auth/logout", {
      method: "POST"
    });
  }

  async getServices(options?: { includeInactive?: boolean }) {
    const query = options?.includeInactive ? "?includeInactive=true" : "";
    return this.request<{ data: Service[] }>(`/services${query}`);
  }

  async getServiceCategories() {
    return this.request<{ data: ServiceCategory[] }>("/services/categories");
  }

  async createService(input: ServiceCreateInput) {
    return this.request<{ data: Service }>("/services", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async updateService(id: string, input: ServiceUpdateInput) {
    return this.request<{ data: Service }>(`/services/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  }

  async deleteService(id: string) {
    return this.request<{ data: Service }>(`/services/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
  }

  async createBooking(input: BookingCreateInput) {
    return this.request<{ data: Booking }>("/bookings", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async getBooking(bookingCode: string) {
    return this.request<{ data: Booking }>(`/bookings/${encodeURIComponent(bookingCode)}`);
  }

  async createRazorpayOrder(input: RazorpayOrderCreateInput) {
    return this.request<{ data: RazorpayOrderResponse }>("/payments/razorpay/order", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async verifyRazorpayPayment(input: RazorpayVerifyInput) {
    return this.request<{ data: RazorpayVerifyResponse }>("/payments/razorpay/verify", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async getBookings() {
    return this.request<{ data: Booking[] }>("/bookings");
  }

  async updateBookingStatus(bookingCode: string, input: BookingStatusUpdateInput) {
    return this.request<{ data: Booking }>(`/bookings/${encodeURIComponent(bookingCode)}/status`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  }

  async getAdminDashboard() {
    return this.request<{ data: AdminDashboard }>("/admin/dashboard");
  }

  async getCustomers() {
    return this.request<{ data: CustomerSummary[] }>("/admin/customers");
  }

  async getLeads() {
    return this.request<{ data: Lead[] }>("/leads");
  }

  async createLead(input: LeadCreateInput) {
    return this.request<{ data: Lead }>("/leads", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async updateLead(id: string, input: LeadUpdateInput) {
    return this.request<{ data: Lead }>(`/leads/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  }

  async deleteLead(id: string) {
    return this.request<{ data: Lead }>(`/leads/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
  }

  async getCrmNotes() {
    return this.request<{ data: CrmNote[] }>("/crm/notes");
  }

  async createCrmNote(input: CrmNoteCreateInput) {
    return this.request<{ data: CrmNote }>("/crm/notes", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async logWhatsappMessage(input: WhatsappMessageCreateInput) {
    return this.request<WhatsappSendResponse>("/crm/whatsapp", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (this.token) headers.set("Authorization", `Bearer ${this.token}`);

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: this.credentials
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}

export function createApiClient(options?: Partial<ApiClientOptions>) {
  const runtimeEnv = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };

  return new ApiClient({
    baseUrl: options?.baseUrl ?? runtimeEnv.process?.env?.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
    token: options?.token,
    credentials: options?.credentials
  });
}
