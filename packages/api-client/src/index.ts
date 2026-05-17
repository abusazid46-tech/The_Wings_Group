import type { Booking, BookingCreateInput, Service } from "@the-wings/types";

type ApiClientOptions = {
  baseUrl: string;
  token?: string;
};

export class ApiClient {
  private readonly baseUrl: string;
  private readonly token?: string;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.token = options.token;
  }

  async getServices() {
    return this.request<{ data: Service[] }>("/services");
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

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (this.token) headers.set("Authorization", `Bearer ${this.token}`);

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers
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
    token: options?.token
  });
}
