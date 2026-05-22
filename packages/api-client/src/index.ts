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

type ApiErrorBody = {
  error?: string;
  detail?: string;
  code?: string;
  requestId?: string;
  details?: {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
};

const deployedApiUrl = "https://the-wings-group.onrender.com";

export class ApiClientError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null) {
    super(formatApiError(status, body));
    this.name = "ApiClientError";
    this.status = status;
    this.body = body;
  }
}

function getDefaultApiUrl() {
  const runtimeEnv = globalThis as typeof globalThis & {
    location?: Location;
    process?: { env?: Record<string, string | undefined> };
  };
  const configuredUrl = runtimeEnv.process?.env?.NEXT_PUBLIC_API_URL;
  if (configuredUrl) return configuredUrl;

  const hostname = runtimeEnv.location?.hostname;
  if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
    return deployedApiUrl;
  }

  return "http://localhost:4000";
}

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
      throw new ApiClientError(response.status, await parseErrorBody(response));
    }

    return response.json() as Promise<T>;
  }
}

async function parseErrorBody(response: Response): Promise<ApiErrorBody | null> {
  try {
    const body = (await response.json()) as unknown;
    return isApiErrorBody(body) ? body : null;
  } catch {
    return null;
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return Boolean(value && typeof value === "object");
}

function formatApiError(status: number, body: ApiErrorBody | null) {
  const fieldErrors = body?.details?.fieldErrors;
  const fieldMessage = fieldErrors
    ? Object.entries(fieldErrors)
        .flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`))
        .join("; ")
    : "";
  const formMessage = body?.details?.formErrors?.join("; ") ?? "";
  const message = [body?.error, body?.detail, fieldMessage, formMessage].filter(Boolean).join(" - ");

  return message || `API request failed: ${status}`;
}

export function createApiClient(options?: Partial<ApiClientOptions>) {
  return new ApiClient({
    baseUrl: options?.baseUrl ?? getDefaultApiUrl(),
    token: options?.token,
    credentials: options?.credentials
  });
}
