"use client";

import { createApiClient } from "@the-wings/api-client";
import type {
  AuthSession,
  Booking,
  BookingCreateInput,
  OfferBanner,
  PaymentMode,
  RazorpayOrderResponse,
  Service as ApiService,
  ServiceCategory as ApiServiceCategory
} from "@the-wings/types";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveServiceIconKey, ServiceIcon, type ServiceIconKey } from "./ServiceIcon";
import { faqItems, seoServices, serviceAreas } from "./seo-data";
import { categoryLabels, quickServices, searchTerms, services, type ServiceCategoryId, type ServiceItem } from "./site-data";

type CartItem = ServiceItem & { quantity: number };
type LocationChoice = { label: string; address: string; coords?: string };
type SubmitStatus = "idle" | "submitting" | "success" | "offline";
type OnlinePaymentStatus = "idle" | "creating" | "ready" | "verifying" | "paid" | "unavailable" | "failed";
type BookingSource = "database" | "whatsapp";
type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  handler: (response: RazorpayHandlerResponse) => void | Promise<void>;
  modal: {
    ondismiss: () => void;
  };
};
type GoogleCredentialResponse = {
  credential?: string;
};
type GoogleAccounts = {
  id: {
    initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
    renderButton: (element: HTMLElement, options: Record<string, string | number | boolean>) => void;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
    google?: {
      accounts: GoogleAccounts;
    };
  }
}

const categories: Array<{ id: "all" | ServiceCategoryId; label: string; iconKey: ServiceIconKey }> = [
  { id: "all", label: "All Services", iconKey: "all" },
  { id: "toilet", label: "Toilet & Bath", iconKey: "bathroom" },
  { id: "tank", label: "Tank Wash", iconKey: "tank" },
  { id: "ac", label: "AC & Repair", iconKey: "ac" },
  { id: "sofa", label: "Sofa Clean", iconKey: "sofa" },
  { id: "kitchen", label: "Kitchen & Appliances", iconKey: "kitchen" },
  { id: "deep", label: "Deep Clean", iconKey: "home" },
  { id: "pest", label: "Pest Control", iconKey: "pest" },
  { id: "painter", label: "Painter & Plumber", iconKey: "painting" },
  { id: "salon", label: "Saloon & Spa", iconKey: "salon" },
  { id: "maid", label: "Aya and Housemaid", iconKey: "home" },
  { id: "security", label: "Security", iconKey: "security" }
];

const initialForm = {
  name: "",
  phone: "",
  alternatePhone: "",
  address: "",
  city: "Agartala",
  date: "",
  time: "",
  paymentMode: "COD" as PaymentMode,
  note: ""
};

type BookingForm = typeof initialForm;
type BookingFormErrors = Partial<Record<keyof BookingForm | "cart", string>>;
type BookingResult = {
  bookingCode: string;
  source: BookingSource;
  status: string;
  whatsappUrl: string;
  paymentMode: PaymentMode;
};

type BookingHistoryItem = {
  bookingCode: string;
  serviceSummary: string;
  total: number;
  preferredDate: string;
  preferredTimeSlot: string;
  status: string;
  source: BookingSource;
  createdAt: string;
};

const bookingHistoryKey = "twg_customer_bookings";
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const serviceCity = "Agartala";
const agartalaCenter = { lat: 23.8315, lng: 91.2868 };
const agartalaServiceRadiusKm = 25;
const categorySlugMap: Record<string, ServiceCategoryId> = {
  "toilet-bath": "toilet",
  "toilet-and-bath": "toilet",
  "toilet": "toilet",
  "bath": "toilet",
  "bathroom": "toilet",
  "cat_toilet_bath": "toilet",
  "tank-wash": "tank",
  "tankwash": "tank",
  "tank": "tank",
  "cat_tank_wash": "tank",
  "ac-repair": "ac",
  "ac-and-repair": "ac",
  "ac-and-electric": "ac",
  "ac-electric": "ac",
  "ac": "ac",
  "cat_ac_repair": "ac",
  "sofa-clean": "sofa",
  "sofa": "sofa",
  "cat_sofa_clean": "sofa",
  "deep-clean": "deep",
  "deep": "deep",
  "cat_deep_clean": "deep",
  "kitchen-appliances": "kitchen",
  "kitchen-and-appliances": "kitchen",
  "kitchen": "kitchen",
  "cat_kitchen_appliances": "kitchen",
  "aya-housemaid": "maid",
  "aya-and-housemaid": "maid",
  "maid": "maid",
  "cat_aya_housemaid": "maid",
  "pest-control": "pest",
  "pest": "pest",
  "cat_pest_control": "pest",
  "painter-plumber": "painter",
  "painter-and-plumber": "painter",
  "painter": "painter",
  "cat_painter_plumber": "painter",
  "saloon-spa": "salon",
  "saloon-and-spa": "salon",
  "salon-spa": "salon",
  "salon": "salon",
  "cat_saloon_spa": "salon",
  "security": "security",
  "cat_security": "security"
};

export function CustomerHome() {
  const [placeholder, setPlaceholder] = useState("Search for 'Bathroom Cleaning'");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState<LocationChoice>({
    label: "Agartala, Tripura",
    address: "Agartala, Tripura"
  });
  const [category, setCategory] = useState<"all" | ServiceCategoryId>("all");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [serviceCatalog, setServiceCatalog] = useState<ServiceItem[]>(services);
  const [popularServiceCatalog, setPopularServiceCatalog] = useState<ServiceItem[]>(services.slice(0, 5));
  const [offerBanners, setOfferBanners] = useState<OfferBanner[]>([]);
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState<BookingFormErrors>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<OnlinePaymentStatus>("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [confirmedPayload, setConfirmedPayload] = useState<BookingCreateInput | null>(null);
  const [bookingHistory, setBookingHistory] = useState<BookingHistoryItem[]>([]);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const catalogRequestRef = useRef(0);

  useEffect(() => {
    let termIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    function tick() {
      const term = searchTerms[termIndex] ?? "Bathroom Cleaning";
      setPlaceholder(`Search for '${term.slice(0, charIndex)}'`);

      if (!deleting && charIndex === term.length) {
        deleting = true;
        timeout = setTimeout(tick, 1200);
        return;
      }

      if (deleting && charIndex === 0) {
        deleting = false;
        termIndex = (termIndex + 1) % searchTerms.length;
        timeout = setTimeout(tick, 250);
        return;
      }

      charIndex += deleting ? -1 : 1;
      timeout = setTimeout(tick, deleting ? 45 : 85);
    }

    tick();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(bookingHistoryKey);
      if (stored) setBookingHistory(JSON.parse(stored) as BookingHistoryItem[]);
    } catch {
      setBookingHistory([]);
    }
  }, []);

  const refreshServiceCatalog = useCallback(async () => {
    const requestId = catalogRequestRef.current + 1;
    catalogRequestRef.current = requestId;

    try {
      const api = createApiClient();
      const [servicesResponse, popularServicesResponse, offersResponse] = await Promise.all([
        api.getServices(),
        api.getPopularServices({ limit: 5 }).catch(() => ({ data: [] as ApiService[] })),
        api.getActiveOfferBanners().catch(() => ({ data: [] as OfferBanner[] }))
      ]);
      if (catalogRequestRef.current !== requestId) return;

      const needsCategoryFallback = [...servicesResponse.data, ...popularServicesResponse.data].some((service) => !service.category);
      const categoriesResponse = needsCategoryFallback
        ? await api.getServiceCategories().catch(() => ({ data: [] as ApiServiceCategory[] }))
        : { data: [] as ApiServiceCategory[] };
      if (catalogRequestRef.current !== requestId) return;

      const categoryMap = new Map(categoriesResponse.data.map((item) => [item.id, item]));
      const mappedServices = servicesResponse.data
        .filter((service) => service.isActive)
        .map((service) => mapApiServiceToServiceItem(service, categoryMap));
      const mappedPopularServices = popularServicesResponse.data
        .filter((service) => service.isActive)
        .map((service) => mapApiServiceToServiceItem(service, categoryMap));
      setServiceCatalog(mappedServices);
      setPopularServiceCatalog(mappedPopularServices.length > 0 ? mappedPopularServices.slice(0, 5) : mappedServices.slice(0, 5));
      setOfferBanners(offersResponse.data);
    } catch {
      if (catalogRequestRef.current !== requestId) return;
      setServiceCatalog((current) => (current.length > 0 ? current : services));
      setPopularServiceCatalog((current) => (current.length > 0 ? current : services.slice(0, 5)));
      setOfferBanners((current) => current);
    }
  }, []);

  useEffect(() => {
    void refreshServiceCatalog();
  }, [refreshServiceCatalog]);

  useEffect(() => {
    const api = createApiClient();
    const eventsUrl = api.getServiceCatalogEventsUrl();
    let source: EventSource | null = null;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    function scheduleRefresh() {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void refreshServiceCatalog();
      }, 250);
    }

    if (typeof window !== "undefined" && "EventSource" in window) {
      source = new EventSource(eventsUrl);
      source.addEventListener("catalog:update", scheduleRefresh);
    }

    const pollTimer = setInterval(() => {
      void refreshServiceCatalog();
    }, 60000);

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      clearInterval(pollTimer);
      source?.close();
    };
  }, [refreshServiceCatalog]);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const response = await createApiClient().getMe();
        if (!mounted) return;
        setAuthSession({ user: response.data });
      } catch {
        if (!mounted) return;
        setAuthSession(null);
      }
    }

    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleHomeServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const source = query ? serviceCatalog : popularServiceCatalog;
    return source.filter((service) => {
      const matchesSearch =
        !query ||
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        (service.groupLabel ?? "").toLowerCase().includes(query) ||
        (service.categoryLabel ?? categoryLabels[service.category]).toLowerCase().includes(query);

      return matchesSearch;
    }).slice(0, query ? undefined : 5);
  }, [popularServiceCatalog, searchQuery, serviceCatalog]);

  const cartItems = Object.values(cart);
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const activeOffer = useMemo(() => chooseOfferBanner(offerBanners, cartItems), [cartItems, offerBanners]);

  function addService(service: ServiceItem) {
    setCart((current) => {
      const cartKey = String(service.id);
      const existing = current[cartKey];
      return {
        ...current,
        [cartKey]: existing ? { ...existing, quantity: existing.quantity + 1 } : { ...service, quantity: 1 }
      };
    });
    setFormErrors((current) => ({ ...current, cart: undefined }));
  }

  function updateCartQuantity(serviceId: ServiceItem["id"], quantity: number) {
    setCart((current) => {
      const cartKey = String(serviceId);
      const existing = current[cartKey];
      if (!existing) return current;

      if (quantity <= 0) {
        const next = { ...current };
        delete next[cartKey];
        return next;
      }

      return {
        ...current,
        [cartKey]: { ...existing, quantity }
      };
    });
  }

  function removeService(serviceId: ServiceItem["id"]) {
    updateCartQuantity(serviceId, 0);
  }

  function resetBookingState() {
    setSuccess(false);
    setSubmitStatus("idle");
    setSubmitMessage("");
    setPaymentStatus("idle");
    setPaymentMessage("");
    setBookingResult(null);
    setBookingRef(null);
    setConfirmedPayload(null);
    setFormErrors({});
  }

  function prepareBookingForm() {
    setForm((current) => ({
      ...current,
      address: current.address || location.address,
      city: serviceCity,
      date: current.date || getTodayInputValue()
    }));
  }

  function browseCategory(nextCategory: ServiceCategoryId) {
    setCategory(nextCategory);
    setSearchQuery("");
    setCategoryModalOpen(true);
  }

  function updateSearch(value: string) {
    setSearchQuery(value);
    if (value.trim()) setCategory("all");
  }

  function submitSearch() {
    setCategory("all");
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  }

  function bookOffer(offer: OfferBanner) {
    if (offer.serviceId) {
      const service = serviceCatalog.find((item) => item.serviceId === offer.serviceId);
      if (service) {
        setCart({ [String(service.id)]: { ...service, quantity: 1 } });
        resetBookingState();
        prepareBookingForm();
        setBookingModalOpen(true);
        return;
      }
    }

    if (offer.service?.name) {
      setSearchQuery(offer.service.name);
    } else if (offer.category?.name) {
      setSearchQuery(offer.category.name);
    }
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  }

  function openCart() {
    resetBookingState();
    prepareBookingForm();
    setBookingModalOpen(true);
  }

  function updateForm(field: keyof BookingForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  }

  function rememberBooking(entry: BookingHistoryItem) {
    setBookingHistory((current) => {
      const next = [entry, ...current.filter((item) => item.bookingCode !== entry.bookingCode)].slice(0, 5);
      try {
        window.localStorage.setItem(bookingHistoryKey, JSON.stringify(next));
      } catch {
        // Local history is optional; booking submission should not fail because of storage settings.
      }
      return next;
    });
  }

  function saveAuthSession(session: AuthSession) {
    setAuthSession(session);
    setForm((current) => ({
      ...current,
      name: current.name || session.user.name || "",
      phone: current.phone || session.user.phone || ""
    }));
    setAuthModalOpen(false);
    setSubmitMessage("");
  }

  async function signOut() {
    try {
      await createApiClient().logout();
    } catch {
      // Local state still clears if the network is unavailable.
    }
    setAuthSession(null);
  }

  function selectLocation(choice: LocationChoice) {
    if (!isSupportedAgartalaLocation(choice)) {
      setLocationStatus("Service is currently available only in Agartala. Please choose an Agartala address.");
      return;
    }

    const normalizedChoice = {
      ...choice,
      label: hasAgartalaText(choice.label) ? choice.label : `${choice.label}, ${serviceCity}`,
      address: hasAgartalaText(choice.address) ? choice.address : `${choice.address}, ${serviceCity}`
    };

    setLocation(normalizedChoice);
    setForm((current) => ({
      ...current,
      address: current.address || normalizedChoice.address,
      city: serviceCity
    }));
    setLocationStatus(`Service location set to ${normalizedChoice.label}.`);
    setLocationModalOpen(false);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Current location is not supported on this browser. Please enter your address manually.");
      return;
    }

    setLocationStatus("Getting your current location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
        if (!isWithinAgartalaServiceArea(position.coords.latitude, position.coords.longitude)) {
          setLocationStatus("Your current location is outside our Agartala service area. Please enter an Agartala address.");
          return;
        }
        selectLocation({
          label: "Current location",
          address: `Current location coordinates: ${coords}`,
          coords
        });
      },
      () => setLocationStatus("Location permission was denied. Search or type your address manually."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function _legacyConfirmBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name || !form.phone || !form.address || !form.date || !form.time) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      alert("Enter a valid 10-digit phone number.");
      return;
    }

    if (cartItems.length === 0) {
      alert("Please add at least one service.");
      return;
    }

    const bookingId = `TWG${Date.now().toString().slice(-6)}`;
    const serviceSummary = cartItems.map((item) => `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ""}`).join(", ");
    const whatsappMessage = [
      `New Booking - ${bookingId}`,
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Address: ${form.address}`,
      `Services: ${serviceSummary}`,
      `Preferred Date & Time: ${form.date} ${form.time}`,
      `Total (Cash on Delivery): ₹${total.toLocaleString()}`,
      form.note ? `Instructions: ${form.note}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    setBookingRef(
      [
        `Booking ID: ${bookingId}`,
        `Name: ${form.name}`,
        `Phone: ${form.phone}`,
        `Services: ${serviceSummary}`,
        `Date & Time: ${form.date} · ${form.time}`,
        `Total (Cash on Delivery): ₹${total.toLocaleString()}`
      ].join("\n")
    );
    setSuccess(true);
    window.open(`https://wa.me/919774887803?text=${encodeURIComponent(whatsappMessage)}`, "_blank", "noopener");
    setCart({});
  }

  async function confirmBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!authSession) {
      setSubmitMessage("Sign in with Google to continue booking.");
      setAuthModalOpen(true);
      return;
    }

    const normalizedForm: BookingForm = {
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      alternatePhone: form.alternatePhone.trim(),
      address: form.address.trim(),
      city: form.city.trim() || "Agartala",
      date: form.date || getTodayInputValue(),
      note: form.note.trim()
    };
    const errors = validateBookingForm(normalizedForm, cartItems);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload = createBookingPayload(normalizedForm, cartItems, total, authSession.user.id);
    setConfirmedPayload(payload);
    setSubmitStatus("submitting");
    setSubmitMessage("Creating your booking...");

    try {
      const response = await createApiClient().createBooking(payload);
      const booking = response.data;
      const whatsappUrl = createWhatsappUrl(booking.bookingCode, payload);
      const result: BookingResult = {
        bookingCode: booking.bookingCode,
        source: "database",
        status: booking.status,
        whatsappUrl,
        paymentMode: payload.paymentMode
      };

      setBookingResult(result);
      setBookingRef(formatBookingSummary(booking.bookingCode, payload, booking.status, "database"));
      setSubmitStatus("success");
      setSubmitMessage(
        payload.paymentMode === "RAZORPAY"
          ? "Payment is required before this booking is confirmed. Continue to secure Razorpay payment."
          : "Booking saved. WhatsApp confirmation is queued for the operations team."
      );
      rememberBooking(createHistoryItem(booking, payload, "database"));
    } catch {
      const fallbackCode = createLocalBookingCode();
      const whatsappUrl = createWhatsappUrl(fallbackCode, payload);
      const result: BookingResult = {
        bookingCode: fallbackCode,
        source: "whatsapp",
        status: "PENDING_WHATSAPP",
        whatsappUrl,
        paymentMode: payload.paymentMode
      };

      setBookingResult(result);
      setBookingRef(formatBookingSummary(fallbackCode, payload, "Pending WhatsApp confirmation", "whatsapp"));
      setSubmitStatus("offline");
      setSubmitMessage("API is not connected yet, so this request is saved in this browser and sent through WhatsApp.");
      rememberBooking(createHistoryItemFromPayload(fallbackCode, payload, "whatsapp"));
      window.open(whatsappUrl, "_blank", "noopener");
    }

    setForm(normalizedForm);
    setCart({});
    setSuccess(true);
  }

  async function startOnlinePayment() {
    if (!bookingResult || bookingResult.source !== "database") {
      setPaymentStatus("unavailable");
      setPaymentMessage("Online payment needs a saved database booking first.");
      return;
    }

    setPaymentStatus("creating");
    setPaymentMessage("Creating secure Razorpay order...");

    try {
      const orderResponse = await createApiClient().createRazorpayOrder({ bookingCode: bookingResult.bookingCode });
      const order = orderResponse.data;

      if (!order.checkoutEnabled || !order.keyId) {
        setPaymentStatus("unavailable");
        setPaymentMessage(order.message || "Razorpay is not configured yet. Customer can still pay after service.");
        return;
      }

      const loaded = await loadRazorpayCheckout();
      if (!loaded || !window.Razorpay) {
        setPaymentStatus("failed");
        setPaymentMessage("Unable to load Razorpay Checkout. Please check the internet connection.");
        return;
      }

      setPaymentStatus("ready");
      setPaymentMessage("Opening Razorpay Checkout...");

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "The Wings Group",
        description: `Booking ${order.bookingCode}`,
        order_id: order.orderId,
        prefill: {
          name: form.name,
          contact: form.phone
        },
        notes: {
          bookingCode: order.bookingCode
        },
        theme: {
          color: "#0a1628"
        },
        handler: async (response) => {
          await verifyOnlinePayment(order, response);
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus("ready");
            setPaymentMessage("Payment window closed. You can reopen it anytime.");
          }
        }
      });

      checkout.open();
    } catch {
      setPaymentStatus("failed");
      setPaymentMessage("Payment order could not be created. Customer can still pay after service.");
    }
  }

  async function verifyOnlinePayment(order: RazorpayOrderResponse, response: RazorpayHandlerResponse) {
    setPaymentStatus("verifying");
    setPaymentMessage("Verifying payment...");

    try {
      const verified = await createApiClient().verifyRazorpayPayment({
        bookingCode: order.bookingCode,
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature
      });

      setPaymentStatus("paid");
      setPaymentMessage("Payment verified successfully.");
      setBookingResult((current) => (current ? { ...current, status: verified.data.booking.status } : current));
      if (confirmedPayload) {
        setBookingRef(formatBookingSummary(order.bookingCode, confirmedPayload, "Paid via Razorpay", "database"));
      }
    } catch {
      setPaymentStatus("failed");
      setPaymentMessage("Payment verification failed. Please do not mark the booking paid until admin verifies it.");
    }
  }

  return (
    <>
      <Navbar
        placeholder={placeholder}
        location={location}
        searchQuery={searchQuery}
        cartCount={cartCount}
        authSession={authSession}
        onSearchChange={updateSearch}
        onSearchSubmit={submitSearch}
        onOpenCart={openCart}
        onOpenLocation={() => setLocationModalOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onSignOut={signOut}
      />
      {activeOffer && <PromoPanel offer={activeOffer} onBook={bookOffer} />}
      <Hero selectedCategory={category} onCategorySelect={browseCategory} />
      <TrustBar />
      <ServicesSection
        searchQuery={searchQuery}
        services={visibleHomeServices}
        cart={cart}
        onAdd={addService}
        onClearSearch={() => setSearchQuery("")}
      />
      <LocalSeoSection />
      <FaqSection />
      <HowItWorks />
      <AboutTeaser />
      <CodSection />
      <SiteFooter />
      <MobileContactBar />
      {cartItems.length > 0 && !bookingModalOpen && (
        <CheckoutBar cartCount={cartCount} total={total} onOpenCart={openCart} />
      )}

      {categoryModalOpen && (
        <CategoryServiceModal
          category={category}
          services={getCategoryDetailServices(category, serviceCatalog)}
          cart={cart}
          onClose={() => setCategoryModalOpen(false)}
          onAdd={addService}
          onOpenCart={openCart}
        />
      )}

      {locationModalOpen && (
        <LocationModal
          status={locationStatus}
          onClose={() => setLocationModalOpen(false)}
          onUseCurrent={useCurrentLocation}
          onSelect={selectLocation}
        />
      )}

      {bookingModalOpen && (
        <BookingModal
          cartItems={cartItems}
          total={total}
          form={form}
          errors={formErrors}
          success={success}
          submitStatus={submitStatus}
          submitMessage={submitMessage}
          paymentStatus={paymentStatus}
          paymentMessage={paymentMessage}
          bookingResult={bookingResult}
          bookingRef={bookingRef}
          bookingHistory={bookingHistory}
          authSession={authSession}
          onClose={() => setBookingModalOpen(false)}
          onOpenAuth={() => setAuthModalOpen(true)}
          onSubmit={confirmBooking}
          onPayOnline={startOnlinePayment}
          onFormChange={updateForm}
          onQuantityChange={updateCartQuantity}
          onRemove={removeService}
          onClearCart={() => setCart({})}
        />
      )}

      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onSuccess={saveAuthSession}
        />
      )}
    </>
  );
}

function Navbar({
  placeholder,
  location,
  searchQuery,
  cartCount,
  authSession,
  onSearchChange,
  onSearchSubmit,
  onOpenCart,
  onOpenLocation,
  onOpenAuth,
  onSignOut
}: {
  placeholder: string;
  location: LocationChoice;
  searchQuery: string;
  cartCount: number;
  authSession: AuthSession | null;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onOpenCart: () => void;
  onOpenLocation: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
}) {
  return (
    <nav className="navbar">
      <div className="container-fluid">
        <div className="navbar-inner">
          <Link className="brand-wrap" href="/">
            <img className="brand-logo-img" src="/the-wings-logo.png" alt="The Wings Group logo" />
            <div>
              <div className="brand-name-uc">Wings Group</div>
              <div className="brand-sub-uc">Northeast India</div>
            </div>
          </Link>

          <button className="uc-location-pill" type="button" onClick={onOpenLocation} aria-label="Choose service location">
            <i className="bi bi-geo-alt-fill" />
            <span className="uc-location-text">
              <span className="uc-location-eta">{location.coords ? "Current location" : "In 14 minutes"}</span>
              <span className="uc-location-label">{location.label}</span>
            </span>
            <i className="bi bi-chevron-down loc-caret" />
          </button>

          <form
            className="uc-search-wrap"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              onSearchSubmit();
            }}
          >
            <button className="uc-search-submit" type="submit" aria-label="Search services">
              <i className="bi bi-search" />
            </button>
            <input
              type="text"
              className="uc-search-input"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") onSearchChange("");
              }}
              placeholder={placeholder}
              aria-label="Search services"
            />
          </form>

          <div className="uc-nav-links">
            <a className="uc-nav-link" href="#services">Services</a>
            <Link className="uc-nav-link" href="/about">About</Link>
            <a className="uc-nav-link" href="#how">How it Works</a>
            {authSession ? (
              <button className="uc-auth-pill signed-in" type="button" onClick={onSignOut} title="Sign out">
                {getUserInitial(authSession)}
                <span>{authSession.user.name || authSession.user.phone || "Account"}</span>
              </button>
            ) : (
              <button className="uc-auth-pill" type="button" onClick={onOpenAuth}>
                <i className="bi bi-person-circle" />
                <span>Sign in</span>
              </button>
            )}
            <button className="uc-cart-icon ms-1" onClick={onOpenCart} type="button" title="Cart">
              <i className="bi bi-cart3" />
              {cartCount > 0 && <span className="uc-cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function MobileContactBar() {
  const phone = "9774887803";
  const phoneWithCountry = "919774887803";

  return (
    <nav className="floating-contact-actions" aria-label="Quick contact">
      <a className="mobile-contact-action call" href={`tel:+${phoneWithCountry}`}>
        <i className="bi bi-telephone-fill" />
        <span>Call</span>
      </a>
      <a className="mobile-contact-action whatsapp" href={`https://wa.me/${phoneWithCountry}`} target="_blank" rel="noreferrer">
        <i className="bi bi-whatsapp" />
        <span>WhatsApp</span>
      </a>
      <span className="mobile-contact-number">{phone}</span>
    </nav>
  );
}

function getUserInitial(session: AuthSession) {
  const value = session.user.name || session.user.email || session.user.phone || "U";
  return value.trim().charAt(0).toUpperCase();
}

function PromoPanel({ offer, onBook }: { offer: OfferBanner; onBook: (offer: OfferBanner) => void }) {
  const imageUrl = offer.imageUrl || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=85&fit=crop&crop=center";
  const title = offer.offerPrice != null ? `just Rs. ${offer.offerPrice.toLocaleString()}` : offer.title;

  return (
    <section className="promo-panel" aria-label="Limited time service offer">
      <div className="container">
        <div className="promo-panel-inner">
          <div className="promo-copy">
            <div className="promo-price">
              {title}
              {offer.originalPrice != null && <del>Rs. {offer.originalPrice.toLocaleString()}</del>}
            </div>
            <div className="promo-offer">{offer.discountText || offer.subtitle || offer.title}</div>
            {offer.subtitle && offer.discountText && <div className="promo-subtitle">{offer.subtitle}</div>}
            <button className="promo-action" type="button" onClick={() => onBook(offer)}>
              {offer.ctaLabel || "Book now"} <i className="bi bi-arrow-right" />
            </button>
          </div>
          <img className="promo-image" src={imageUrl} alt={offer.service?.name || offer.category?.name || offer.title} />
        </div>
      </div>
    </section>
  );

}

/*
  return (
    <section className="promo-panel" aria-label="Limited time service offer">
      <div className="container">
        <div className="promo-panel-inner">
          <div className="promo-copy">
            <div className="promo-price">just ₹99 <del>₹245</del></div>
            <div className="promo-offer">60% OFF</div>
            <a className="promo-action" href="#services">Book now <i className="bi bi-arrow-right" /></a>
          </div>
          <img
            className="promo-image"
            src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=85&fit=crop&crop=center"
            alt="Professional home cleaning offer"
          />
        </div>
      </div>
    </section>
  );
}
*/

function Hero({
  selectedCategory,
  onCategorySelect
}: {
  selectedCategory: "all" | ServiceCategoryId;
  onCategorySelect: (category: ServiceCategoryId) => void;
}) {
  return (
    <section className="uc-hero">
      <div className="container">
        <div className="row align-items-center gy-4">
          <div className="col-lg-6 uc-hero-left">
            <div className="uc-hero-eyebrow">🪽 Agartala&apos;s #1 Home Services</div>
            <h1 className="uc-hero-h1">Home services<br />at your <em>doorstep</em></h1>
            <p className="uc-hero-sub">Professional cleaning, AC servicing, tank washing, security and more — booked in seconds. Pay only after the job is done.</p>

            <div className="uc-service-grid">
              <div className="uc-service-grid-title">Book a service</div>
              <div className="uc-svc-row">
                {quickServices.map((service) => (
                  <button
                    className={`uc-svc-item ${selectedCategory === service.category ? "active" : ""}`}
                    key={service.label}
                    type="button"
                    onClick={() => onCategorySelect(service.category)}
                  >
                    <div className="uc-svc-icon-wrap">
                      <ServiceIcon className="service-vector-icon quick-service-vector" name={service.iconKey} title={service.label} />
                      {service.badge && <span className="uc-time-badge">{service.badge}</span>}
                    </div>
                    <div className="uc-svc-name">{service.label}</div>
                  </button>
                ))}
              </div>
              <div className="uc-cod-strip">
                <i className="bi bi-cash-coin" />
                <span>100% Cash on Delivery — No advance payment required</span>
              </div>
            </div>

            <div className="uc-stats-row">
              {[
                ["500+", "Happy Homes"],
                ["5+", "Years of Trust"],
                ["4.8★", "Avg Rating"],
                ["COD", "Cash on Delivery"]
              ].map(([num, label], index) => (
                <div className="d-flex align-items-center gap-3" key={label}>
                  {index > 0 && <div className="uc-stat-divider" />}
                  <div className="uc-stat-item">
                    <div className="uc-stat-num">{num}</div>
                    <div className="uc-stat-label">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-lg-6">
            <div className="uc-hero-photos">
              {[
                ["uc-photo-1", "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=700&q=85&fit=crop&crop=center", "🧹 Deep Cleaning"],
                ["uc-photo-2", "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=700&q=85&fit=crop&crop=top", "❄️ AC Servicing"],
                ["uc-photo-3", "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&q=85&fit=crop&crop=center", "🛋️ Sofa Cleaning"],
                ["uc-photo-4", "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1000&q=85&fit=crop&crop=center", "🛡️ Security & Facility Services"]
              ].map(([className, src, label]) => (
                <div className={`uc-photo ${className}`} key={label}>
                  <img src={src} alt={label} />
                  <div className="uc-photo-label">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <div className="trust-bar">
      <div className="container">
        <div className="row gy-2 text-center text-md-start justify-content-center">
          {[
            ["bi-shield-check", "Verified Professionals"],
            ["bi-cash-coin", "Pay on Delivery"],
            ["bi-clock", "Same Day Booking"],
            ["bi-star-fill", "Satisfaction Guaranteed"]
          ].map(([icon, label]) => (
            <div className="col-6 col-md-3 d-flex justify-content-center" key={label}>
              <div className="trust-item"><div className="trust-icon"><i className={`bi ${icon}`} /></div>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServicesSection({
  searchQuery,
  services: visibleServices,
  cart,
  onAdd,
  onClearSearch
}: {
  searchQuery: string;
  services: ServiceItem[];
  cart: Record<string, CartItem>;
  onAdd: (service: ServiceItem) => void;
  onClearSearch: () => void;
}) {
  const isSearching = Boolean(searchQuery.trim());

  return (
    <section className="services-section" id="services">
      <div className="container">
        <div className="text-center mb-5">
          <div className="section-label">{isSearching ? "Search Results" : "Booking Ranked"}</div>
          <h2 className="section-title">
            {isSearching ? "Matching Services in" : "Popular Services in"}<br /><span>Agartala</span>
          </h2>
          {!isSearching && <p className="section-support-text">Top 5 services ranked from actual booking data.</p>}
        </div>
        <div className="row g-4">
          {visibleServices.length === 0 ? (
            <div className="col-12">
              <div className="empty-service-state">
                <i className="bi bi-search" />
                <strong>No matching services found</strong>
                <span>Try another search or browse all services.</span>
                {searchQuery && <button type="button" onClick={onClearSearch}>Clear search</button>}
              </div>
            </div>
          ) : visibleServices.map((service) => (
            <div className="col-sm-6 col-lg-4" key={service.id}>
              <div className="service-card">
                <div className="card-icon-wrap">
                  <ServiceIcon className="service-vector-icon card-service-vector" name={service.iconKey} title={service.name} />
                  <span className="card-category-badge">{service.categoryLabel ?? categoryLabels[service.category]}</span>
                  {!isSearching && service.bookedQuantity != null && service.bookedQuantity > 0 && (
                    <span className="popular-rank-badge">{service.bookedQuantity} booked</span>
                  )}
                </div>
                <div className="card-body-custom">
                  <div className="card-service-name">{service.name}</div>
                  <div className="card-desc">{service.description}</div>
                  <div className="mt-3 d-flex justify-content-between align-items-end">
                    <div className="card-price">₹{service.price.toLocaleString()}<span>/visit</span></div>
                    <button className={`btn-add-cart ${cart[String(service.id)] ? "added" : ""}`} onClick={() => onAdd(service)} type="button">
                      {cart[String(service.id)] ? "✓ Added" : "+ Add"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryServiceModal({
  category,
  services: categoryServices,
  cart,
  onClose,
  onAdd,
  onOpenCart
}: {
  category: "all" | ServiceCategoryId;
  services: ServiceItem[];
  cart: Record<string, CartItem>;
  onClose: () => void;
  onAdd: (service: ServiceItem) => void;
  onOpenCart: () => void;
}) {
  const title = category === "all" ? "All Services" : categoryLabels[category];
  const groupedServices = groupCategoryServices(categoryServices);
  const selectedCount = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app-modal-backdrop category-detail-backdrop">
      <div className="category-detail-modal">
        <header className="category-detail-header">
          <button className="category-back-btn" type="button" onClick={onClose} aria-label="Close service category">
            <i className="bi bi-arrow-left" />
          </button>
          <div>
            <span>The Wings Group</span>
            <h2>{title}</h2>
          </div>
          <button className="category-cart-btn" type="button" onClick={onOpenCart}>
            <i className="bi bi-cart3" />
            {selectedCount > 0 && <strong>{selectedCount}</strong>}
          </button>
        </header>

        <div className="category-detail-layout no-side-selector">
          <section className="category-service-list">
            {groupedServices.map(([group, items]) => (
              <div className="category-service-group" key={group}>
                <h3>{group}</h3>
                {items.map((service) => (
                  <CategoryServiceRow
                    key={service.id}
                    service={service}
                    added={Boolean(cart[String(service.id)])}
                    onAdd={() => onAdd(service)}
                  />
                ))}
              </div>
            ))}
          </section>

          <aside className="category-promise-card">
            <h3>TWG Promise</h3>
            <p><i className="bi bi-check2" /> Verified Professionals</p>
            <p><i className="bi bi-check2" /> Safe Chemicals</p>
            <p><i className="bi bi-check2" /> Superior Stain Removal</p>
            <div className="category-mini-cart">
              <i className="bi bi-cart3" />
              <span>{selectedCount > 0 ? `${selectedCount} item${selectedCount === 1 ? "" : "s"} in your cart` : "No items in your cart"}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function CategoryServiceRow({ service, added, onAdd }: { service: ServiceItem; added: boolean; onAdd: () => void }) {
  return (
    <article className="category-service-row">
      <div className="category-service-copy">
        <h4>{service.name}</h4>
        <div className="category-rating">
          <i className="bi bi-star-fill" />
          <span>4.82</span>
          <small>{service.durationLabel ?? "2 hrs"}</small>
        </div>
        <div className="category-price-line">
          <strong>Rs. {service.priceLabel ?? formatMoney(service.price)}</strong>
          {service.originalPrice != null && <del>Rs. {service.originalPriceLabel ?? formatMoney(service.originalPrice)}</del>}
          {service.discountLabel && <span>{service.discountLabel}</span>}
        </div>
        <p>{service.description}</p>
        <button className="category-details-btn" type="button">View details</button>
      </div>
      <div className="category-service-media">
        {service.imageUrl ? (
          <img src={service.imageUrl} alt={service.name} />
        ) : (
          <div className="category-service-image-fallback">
            <ServiceIcon className="service-vector-icon" name={service.iconKey} title={service.name} />
          </div>
        )}
        <button className={`category-add-btn ${added ? "added" : ""}`} type="button" onClick={onAdd}>
          {added ? "Added" : "Add"}
        </button>
      </div>
    </article>
  );
}

function groupCategoryServices(items: ServiceItem[]) {
  const groups = new Map<string, ServiceItem[]>();
  for (const item of items) {
    const key = item.groupLabel || item.categoryLabel || categoryLabels[item.category];
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return Array.from(groups.entries());
}

function getCategoryDetailServices(category: "all" | ServiceCategoryId, catalog: ServiceItem[]) {
  const selected = category === "all" ? catalog : catalog.filter((service) => service.category === category);
  return selected.length > 0 ? selected : catalog.filter((service) => service.category === category);
}

function LocalSeoSection() {
  return (
    <section className="local-seo-section" id="agartala-home-services">
      <div className="container">
        <div className="local-seo-grid">
          <div>
            <div className="section-label">Agartala Service Area</div>
            <h2 className="section-title">Home Services in <span>Agartala, Tripura</span></h2>
            <p>
              The Wings Group provides professional home services across Agartala, including bathroom cleaning,
              toilet cleaning, water tank wash, AC service, sofa cleaning, deep home cleaning, pest control,
              maid support, painting, plumbing, salon enquiries, and security guard services.
            </p>
            <p>
              Our booking system is built for local customers who need quick service confirmation, reliable staff,
              clear pricing, and doorstep support in Agartala.
            </p>
            <div className="service-area-pills">
              {serviceAreas.map((area) => <span key={area}>{area}</span>)}
            </div>
          </div>
          <div className="seo-link-panel">
            <h3>Popular Agartala services</h3>
            {seoServices.map((service) => (
              <Link href={`/services/${service.slug}/`} key={service.slug}>{service.title}</Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="faq-section" id="faq">
      <div className="container">
        <div className="text-center mb-5">
          <div className="section-label">FAQs</div>
          <h2 className="section-title">Questions About <span>Booking in Agartala</span></h2>
        </div>
        <div className="faq-grid">
          {faqItems.map((item) => (
            <article className="faq-card" key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="how-section" id="how">
      <div className="container">
        <div className="text-center mb-5">
          <div className="section-label">How It Works</div>
          <h2 className="section-title">Book in <span>3 Easy Steps</span></h2>
        </div>
        <div className="row g-4">
          {[
            ["1", "Choose Services", "Pick the cleaning, AC, tank, or security service you need from our catalog."],
            ["2", "Fill Your Details", "Enter your name, phone number, address, and preferred date and time."],
            ["3", "Pay on Delivery", "Our professional arrives on time. Service done. Pay in cash after completion."]
          ].map(([num, title, desc]) => (
            <div className="col-md-4" key={num}>
              <div className="step-item">
                <div className="step-num">{num}</div>
                <div className="step-title">{title}</div>
                <div className="step-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutTeaser() {
  return (
    <section className="about-teaser">
      <div className="container">
        <div className="about-teaser-inner">
          <div className="about-teaser-text">
            <h2>5+ Years of Trust.<br /><span>Northeast India&apos;s Own.</span></h2>
            <p>Under CEO Prasanta Deb, Wings Group has become the region&apos;s most dependable home services brand — built on reliability, quality, and a genuine commitment to every family we serve.</p>
            <div className="about-teaser-pills">
              {["Clear Mission", "Bold Vision", "4 Core Values", "MBA-led Leadership"].map((pill) => <span className="about-pill" key={pill}>{pill}</span>)}
            </div>
          </div>
          <Link className="btn-about" href="/about">Meet the Team →</Link>
        </div>
      </div>
    </section>
  );
}

function CodSection() {
  return (
    <section className="cod-section" id="cod">
      <div className="container">
        <div className="row align-items-center gy-5">
          <div className="col-lg-6">
            <div className="section-label" style={{ color: "var(--gold-light)" }}>Payment Policy</div>
            <h2 className="section-title" style={{ color: "white", marginBottom: 30 }}>Flexible Payment —<br /><span style={{ color: "var(--gold-light)" }}>COD or Secure Online</span></h2>
            <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.75, maxWidth: 440 }}>Choose cash on delivery for zero advance, or pay securely online with Razorpay after your booking is created.</p>
          </div>
          <div className="col-lg-6">
            {[
              ["bi-cash-coin", "Cash on Delivery", "Pay only after the service is completed at your doorstep."],
              ["bi-credit-card-2-front", "Razorpay Online Payment", "Secure online payment with server-side signature verification."],
              ["bi-calendar2-check", "Flexible Scheduling", "Book for today or plan ahead. Choose a time slot that works for you."],
              ["bi-shield-lock", "Verified Staff", "All our team members are verified, trained, and trustworthy professionals."]
            ].map(([icon, title, desc]) => (
              <div className="cod-feature" key={title}>
                <div className="cod-icon"><i className={`bi ${icon}`} /></div>
                <div className="cod-text"><h6>{title}</h6><p>{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer id="contact">
      <div className="container">
        <div className="row gy-5">
          <div className="col-lg-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <img className="brand-logo-img footer-logo-img" src="/the-wings-logo.png" alt="The Wings Group logo" />
              <div>
                <div className="footer-brand-name">The Wings Group</div>
                <div className="footer-tag">Home Care to Security — All Under One Wing</div>
              </div>
            </div>
            <div className="footer-desc">Northeast India&apos;s trusted name in cleaning, security, and facility management. Serving Agartala and surrounding areas.</div>
          </div>
          <div className="col-6 col-lg-2">
            <div className="footer-heading">Services</div>
            {seoServices.slice(0, 6).map((service) => (
              <Link className="footer-link" href={`/services/${service.slug}/`} key={service.slug}>{service.name}</Link>
            ))}
          </div>
          <div className="col-6 col-lg-2">
            <div className="footer-heading">Company</div>
            <Link className="footer-link" href="/about">About Us</Link>
            <Link className="footer-link" href="/about#mvv">Mission & Values</Link>
            <a className="footer-link" href="#how">How it Works</a>
            <a className="footer-link" href="https://wa.me/919774887803?text=Hi%20Wings%20Group%2C%20I%27d%20like%20to%20know%20about%20career%20opportunities.">Careers</a>
            <a className="footer-link" href="#contact">T&C Apply</a>
          </div>
          <div className="col-lg-4">
            <div className="footer-heading">Contact Us</div>
            <div className="footer-desc mb-3"><i className="bi bi-geo-alt me-2" />Post Office Chowmuhani, Opp. Sarkar Nursing Home, Agartala</div>
            <div className="footer-desc mb-3"><i className="bi bi-telephone me-2" />9774887803</div>
            <a className="footer-link" href="https://wa.me/919774887803"><i className="bi bi-whatsapp me-2" />WhatsApp Us</a>
          </div>
        </div>
        <div className="footer-bottom">© 2026 The Wings Group. All rights reserved. · T&C Apply · Cash on Delivery Only</div>
      </div>
    </footer>
  );
}

function CheckoutBar({ cartCount, total, onOpenCart }: { cartCount: number; total: number; onOpenCart: () => void }) {
  return (
    <div className="checkout-bar" role="status">
      <div>
        <strong>{cartCount} service{cartCount === 1 ? "" : "s"} selected</strong>
        <span>Pay after service completion</span>
      </div>
      <button type="button" onClick={onOpenCart}>
        Review booking <span>Rs. {total.toLocaleString()}</span>
      </button>
    </div>
  );
}

function LocationModal({
  status,
  onClose,
  onUseCurrent,
  onSelect
}: {
  status: string;
  onClose: () => void;
  onUseCurrent: () => void;
  onSelect: (choice: LocationChoice) => void;
}) {
  const [manual, setManual] = useState("");
  const recents: LocationChoice[] = [
    { label: "Post Office Chowmuhani", address: "Opp. Sarkar Nursing Home, Agartala, Tripura" },
    { label: "HGB Road", address: "Agartala, Tripura, India" }
  ];

  function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = manual.trim();
    if (value) onSelect({ label: value, address: value });
  }

  return (
    <div className="app-modal-backdrop">
      <div className="location-modal-card">
        <div className="location-picker-head">
          <form className="location-search-row" onSubmit={submitManual}>
            <button className="location-back-btn" type="button" onClick={onClose} aria-label="Close location picker">
              <i className="bi bi-arrow-left" />
            </button>
            <input className="location-input" value={manual} onChange={(event) => setManual(event.target.value)} placeholder="Search for your location/society/apartment" />
          </form>
        </div>
        <button className="location-use-btn" type="button" onClick={onUseCurrent}>
          <i className="bi bi-crosshair" />
          <span>Use current location</span>
        </button>
        <div className="location-status">{status}</div>
        <div className="location-recents">
          <div className="location-section-title">Recents</div>
          {recents.map((recent) => (
            <button className="recent-location-btn" type="button" key={recent.label} onClick={() => onSelect(recent)}>
              <span className="recent-location-icon"><i className="bi bi-clock-history" /></span>
              <span>
                <span className="recent-location-name">{recent.label}</span>
                <span className="recent-location-address">{recent.address}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthModal({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: (session: AuthSession) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Use Google to continue securely.");
  const [error, setError] = useState("");
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleRenderedRef = useRef(false);

  useEffect(() => {
    if (!googleClientId || googleRenderedRef.current) return;

    let active = true;
    loadGoogleIdentity().then((loaded) => {
      if (!active || !loaded || !window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response.credential) {
            setError("Google did not return a login credential.");
            return;
          }

          setBusy(true);
          setError("");
          setStatus("Verifying Google account...");
          try {
            const result = await createApiClient().loginWithGoogle({ credential: response.credential });
            onSuccess(result.data);
          } catch {
            setError("Google login failed. Check Google OAuth client settings and backend env.");
          } finally {
            setBusy(false);
          }
        }
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
        shape: "pill"
      });
      googleRenderedRef.current = true;
    });

    return () => {
      active = false;
    };
  }, [onSuccess]);

  return (
    <div className="app-modal-backdrop">
      <div className="app-modal auth-modal">
        <div className="modal-header-custom d-flex justify-content-between align-items-start">
          <div>
            <h5 className="mb-1">Customer Login</h5>
            <div className="uc-cod-strip p-0" style={{ background: "transparent", color: "var(--gold-light)" }}>
              <i className="bi bi-shield-lock" /> Google Sign-In
            </div>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close login">x</button>
        </div>
        <div className="modal-body">
          <div className="auth-grid google-only">
            <div className="auth-panel google-auth-panel">
              <div>
                <h6>Continue with Google</h6>
                <p>{googleClientId ? status : "Add Google client ID env to enable this button."}</p>
              </div>
              <div className="google-button-wrap" ref={googleButtonRef} />
              {!googleClientId && <div className="auth-error">Google login is not configured yet.</div>}
              {busy && <div className="booking-submit-note">Verifying Google account...</div>}
              {error && <div className="auth-error">{error}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingModal({
  cartItems,
  total,
  form,
  errors,
  success,
  submitStatus,
  submitMessage,
  paymentStatus,
  paymentMessage,
  bookingResult,
  bookingRef,
  bookingHistory,
  authSession,
  onClose,
  onOpenAuth,
  onSubmit,
  onPayOnline,
  onFormChange,
  onQuantityChange,
  onRemove,
  onClearCart
}: {
  cartItems: CartItem[];
  total: number;
  form: BookingForm;
  errors: BookingFormErrors;
  success: boolean;
  submitStatus: SubmitStatus;
  submitMessage: string;
  paymentStatus: OnlinePaymentStatus;
  paymentMessage: string;
  bookingResult: BookingResult | null;
  bookingRef: string | null;
  bookingHistory: BookingHistoryItem[];
  authSession: AuthSession | null;
  onClose: () => void;
  onOpenAuth: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onPayOnline: () => void | Promise<void>;
  onFormChange: (field: keyof BookingForm, value: string) => void;
  onQuantityChange: (serviceId: ServiceItem["id"], quantity: number) => void;
  onRemove: (serviceId: ServiceItem["id"]) => void;
  onClearCart: () => void;
}) {
  const today = getTodayInputValue();
  const isSubmitting = submitStatus === "submitting";
  const isPaying = paymentStatus === "creating" || paymentStatus === "verifying";
  const statusText = submitStatus === "offline" ? "WhatsApp pending" : bookingResult?.status ?? "Pending";
  const canPayOnline = bookingResult?.source === "database" && bookingResult.paymentMode === "RAZORPAY" && paymentStatus !== "paid";
  const isOnlineBooking = bookingResult?.paymentMode === "RAZORPAY";
  const isPaymentConfirmed = paymentStatus === "paid";
  const successTitle =
    bookingResult?.source !== "database"
      ? "Booking Request Captured"
      : isOnlineBooking
        ? isPaymentConfirmed
          ? "Payment Confirmed - Booking Confirmed"
          : "Payment Required"
        : "Booking Created";
  const successCopy =
    bookingResult?.source !== "database"
      ? "Our team will call the customer shortly. This request is saved as a WhatsApp backup."
      : isOnlineBooking
        ? isPaymentConfirmed
          ? "Your online payment has been verified and the booking is now confirmed."
          : "Your booking request is saved as pending. It will be confirmed only after the online payment succeeds."
        : "Your booking is created. Payment can be made after the service is completed.";
  const paymentOptions: Array<{ mode: PaymentMode; title: string; desc: string; icon: string }> = [
    { mode: "COD", title: "Pay after service", desc: "No advance payment required.", icon: "bi-cash-coin" },
    { mode: "RAZORPAY", title: "Pay online", desc: "Booking confirms only after payment succeeds.", icon: "bi-credit-card-2-front" }
  ];

  return (
    <div className="app-modal-backdrop">
      <div className="app-modal booking-modal-v2">
        <div className="modal-header-custom d-flex justify-content-between align-items-start">
          <div>
            <h5 className="mb-1">Book Your Service</h5>
            <div className="uc-cod-strip p-0" style={{ background: "transparent", color: "var(--gold-light)" }}>
              <i className="bi bi-shield-check" /> COD or Secure Online Payment
            </div>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close booking">x</button>
        </div>
        <div className="modal-body">
          {success ? (
            <div className="success-overlay">
              <div className={`booking-status-card ${submitStatus}`}>
                <div className="success-icon"><i className="bi bi-check2-circle" /></div>
                <span className="booking-source-chip">{bookingResult?.source === "database" ? "Saved to database" : "WhatsApp backup"}</span>
                <h4>{successTitle}</h4>
                <p>{successCopy}</p>
                {bookingResult && (
                  <div className="booking-code-box">
                    <span>Booking ID</span>
                    <strong>{bookingResult.bookingCode}</strong>
                    <small>Status: {statusText}</small>
                  </div>
                )}
                {submitMessage && <div className="booking-submit-note">{submitMessage}</div>}
                {canPayOnline && (
                  <button className="btn-confirm mt-3" type="button" onClick={onPayOnline} disabled={isPaying}>
                    {isPaying ? "Processing payment..." : "Pay Securely with Razorpay"}
                  </button>
                )}
                {paymentStatus === "paid" && <div className="payment-success-note">Payment verified. Booking is confirmed.</div>}
                {paymentMessage && <div className={`payment-status-note ${paymentStatus}`}>{paymentMessage}</div>}
                {bookingRef && <pre className="booking-summary text-start w-100" style={{ whiteSpace: "pre-wrap" }}>{bookingRef}</pre>}
                {bookingResult?.whatsappUrl && (
                  <a className="btn-confirm mt-3" href={bookingResult.whatsappUrl} target="_blank" rel="noreferrer">
                    Send on WhatsApp
                  </a>
                )}
                <button className="btn-confirm secondary mt-2" type="button" onClick={onClose}>Done</button>
              </div>
              <BookingHistory items={bookingHistory} />
            </div>
          ) : (
            <form className="booking-form-shell" onSubmit={onSubmit}>
              <div className={`booking-auth-card ${authSession ? "signed-in" : ""}`}>
                <div>
                  <strong>{authSession ? "Signed in for this booking" : "Sign in to continue"}</strong>
                  <span>
                    {authSession
                      ? authSession.user.name || authSession.user.phone || authSession.user.email || "Customer account ready"
                      : "Use Google so booking history stays linked to the customer."}
                  </span>
                </div>
                {!authSession && (
                  <button type="button" onClick={onOpenAuth}>
                    Sign in
                  </button>
                )}
              </div>
              <div className="booking-summary">
                <div className="booking-summary-head">
                  <strong>Your Services</strong>
                  {cartItems.length > 0 && <button type="button" onClick={onClearCart}>Clear cart</button>}
                </div>
                {cartItems.length === 0 ? (
                  <div className="empty-cart-note">No services added yet. Close and pick services.</div>
                ) : (
                  <>
                    {cartItems.map((item) => (
                      <div className="booking-item-row" key={item.id}>
                        <div>
                          <strong>{item.name}</strong>
                          <span>Rs. {item.price.toLocaleString()} per visit</span>
                        </div>
                        <div className="quantity-control">
                          <button type="button" onClick={() => onQuantityChange(item.id, item.quantity - 1)} aria-label={`Reduce ${item.name}`}>
                            <i className="bi bi-dash" />
                          </button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => onQuantityChange(item.id, item.quantity + 1)} aria-label={`Add ${item.name}`}>
                            <i className="bi bi-plus" />
                          </button>
                          <button className="remove-line" type="button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`}>
                            <i className="bi bi-x" />
                          </button>
                        </div>
                        <strong>Rs. {(item.price * item.quantity).toLocaleString()}</strong>
                      </div>
                    ))}
                    <div className="booking-total-row"><span>Total payable after service</span><strong>Rs. {total.toLocaleString()}</strong></div>
                  </>
                )}
                {errors.cart && <div className="field-error">{errors.cart}</div>}
              </div>
              <div className="row g-3">
                <div className="col-12 booking-form-section-label">Customer Details</div>
                <Field label="Full Name *" value={form.name} onChange={(value) => onFormChange("name", value)} placeholder="Customer full name" error={errors.name} />
                <Field label="Phone Number *" value={form.phone} onChange={(value) => onFormChange("phone", value)} placeholder="10-digit mobile number" type="tel" error={errors.phone} />
                <Field label="Alternate Mobile No." value={form.alternatePhone} onChange={(value) => onFormChange("alternatePhone", value)} placeholder="Optional 10-digit number" type="tel" error={errors.alternatePhone} />
                <div className="col-12">
                  <label className="form-label-custom">Address *</label>
                  <textarea
                    className={`form-control form-control-custom ${errors.address ? "is-invalid-lite" : ""}`}
                    value={form.address}
                    onChange={(event) => onFormChange("address", event.target.value)}
                    rows={2}
                    placeholder="Full address with landmark"
                  />
                  {errors.address && <div className="field-error">{errors.address}</div>}
                </div>
                <div className="col-12 booking-form-section-label">Schedule & Payment</div>
                <Field label="City *" value={form.city} onChange={(value) => onFormChange("city", value)} placeholder="Agartala" error={errors.city} />
                <Field label="Preferred Date *" value={form.date} onChange={(value) => onFormChange("date", value)} type="date" min={today} error={errors.date} />
                <div className="col-md-6">
                  <label className="form-label-custom">Preferred Time *</label>
                  <select
                    className={`form-control form-control-custom ${errors.time ? "is-invalid-lite" : ""}`}
                    value={form.time}
                    onChange={(event) => onFormChange("time", event.target.value)}
                  >
                    <option value="">Select time slot</option>
                    <option>9:00 AM - 11:00 AM</option>
                    <option>11:00 AM - 1:00 PM</option>
                    <option>1:00 PM - 3:00 PM</option>
                    <option>3:00 PM - 5:00 PM</option>
                    <option>5:00 PM - 7:00 PM</option>
                  </select>
                  {errors.time && <div className="field-error">{errors.time}</div>}
                </div>
                <div className="col-12">
                  <label className="form-label-custom">Payment Method</label>
                  <div className="payment-method-grid">
                    {paymentOptions.map(({ mode, title, desc, icon }) => (
                      <button
                        className={`payment-method-card ${form.paymentMode === mode ? "active" : ""}`}
                        type="button"
                        key={mode}
                        onClick={() => onFormChange("paymentMode", mode)}
                      >
                        <i className={`bi ${icon}`} />
                        <span>
                          <strong>{title}</strong>
                          <small>{desc}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label-custom">Special Instructions</label>
                  <textarea
                    className="form-control form-control-custom"
                    value={form.note}
                    onChange={(event) => onFormChange("note", event.target.value)}
                    rows={1}
                    placeholder="Any specific requirements..."
                  />
                </div>
              </div>
              {submitMessage && <div className="booking-submit-note">{submitMessage}</div>}
              <button className="btn-confirm mt-4 w-100" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating booking..." : form.paymentMode === "RAZORPAY" ? "Continue to Payment" : "Confirm Booking - Pay on Delivery"}
              </button>
              <BookingHistory items={bookingHistory} />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingHistory({ items }: { items: BookingHistoryItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="booking-history">
      <div className="booking-history-title">Recent bookings on this device</div>
      {items.map((item) => (
        <div className="booking-history-row" key={item.bookingCode}>
          <div>
            <strong>{item.bookingCode}</strong>
            <span>{item.serviceSummary}</span>
          </div>
          <div>
            <strong>Rs. {item.total.toLocaleString()}</strong>
            <span>{item.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function mapApiServiceToServiceItem(service: ApiService, categoryMap: Map<string, ApiServiceCategory>): ServiceItem {
  const apiCategory = service.category ?? categoryMap.get(service.categoryId);
  const category = resolveUiCategory(apiCategory, service.categoryId);
  const searchableText = [service.name, service.description, service.icon, apiCategory?.name, apiCategory?.slug].filter(Boolean).join(" ").toLowerCase();

  return {
    id: `api-${service.id}`,
    serviceId: service.id,
    category,
    categoryLabel: apiCategory?.name ?? categoryLabels[category],
    iconKey: resolveServiceIconKey(service.icon, searchableText, getCategoryIconKey(category)),
    name: service.name,
    description: service.description,
    price: service.basePrice,
    groupLabel: service.groupLabel ?? undefined,
    priceLabel: service.priceLabel ?? undefined,
    originalPrice: service.originalPrice ?? undefined,
    originalPriceLabel: service.originalPriceLabel ?? undefined,
    discountLabel: service.discountLabel ?? undefined,
    imageUrl: service.imageUrl ?? undefined,
    durationLabel: service.durationMin ? `${Math.round(service.durationMin / 60)} hrs` : undefined
  };
}

function resolveUiCategory(apiCategory: ApiServiceCategory | null | undefined, categoryId: string): ServiceCategoryId {
  const candidates = [apiCategory?.slug, apiCategory?.id, apiCategory?.name, categoryId];
  for (const candidate of candidates) {
    const normalized = normalizeCategoryKey(candidate);
    if (normalized && categorySlugMap[normalized]) return categorySlugMap[normalized];
  }

  return inferServiceCategory(candidates.filter(Boolean).join(" ").toLowerCase());
}

function normalizeCategoryKey(value: string | null | undefined) {
  return value
    ?.trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9_]+/g, "-")
    .replace(/^-|-$/g, "");
}

function inferServiceCategory(value: string): ServiceCategoryId {
  if (/\b(toilet|bath|bathroom|washroom|sanit)/.test(value)) return "toilet";
  if (/\b(tank|water|sintex|reservoir)/.test(value)) return "tank";
  if (/\b(ac|air conditioner|electric|electrician|repair)/.test(value)) return "ac";
  if (/\b(sofa|couch|mattress|carpet)/.test(value)) return "sofa";
  if (/\b(kitchen|chimney|fridge|refrigerator|appliance)/.test(value)) return "kitchen";
  if (/\b(pest|cockroach|ant|bug|termite)/.test(value)) return "pest";
  if (/\b(painter|painting|paint|plumber|plumbing|carpenter|wall|waterproof)/.test(value)) return "painter";
  if (/\b(salon|saloon|spa|massage|facial|beauty)/.test(value)) return "salon";
  if (/\b(aya|maid|housemaid|nanny|caregiver|babysitter|domestic help)/.test(value)) return "maid";
  if (/\b(security|guard|facility|housekeeping|manpower)/.test(value)) return "security";
  return "deep";
}

function getCategoryIconKey(category: ServiceCategoryId): ServiceIconKey {
  return categories.find((item) => item.id === category)?.iconKey ?? "cleaning";
}

function _LegacyBookingModal({
  cartItems,
  total,
  form,
  success,
  bookingRef,
  onClose,
  onSubmit,
  onFormChange
}: {
  cartItems: CartItem[];
  total: number;
  form: typeof initialForm;
  success: boolean;
  bookingRef: string | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFormChange: (field: keyof typeof initialForm, value: string) => void;
}) {
  const today = new Date().toISOString().split("T")[0] ?? "";

  return (
    <div className="app-modal-backdrop">
      <div className="app-modal">
        <div className="modal-header-custom d-flex justify-content-between align-items-start">
          <div>
            <h5 className="mb-1">🪽 Book Your Service</h5>
            <div className="uc-cod-strip p-0" style={{ background: "transparent", color: "var(--gold-light)" }}>
              <i className="bi bi-cash-coin" /> Cash on Delivery
            </div>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {success ? (
            <div className="success-overlay">
              <div className="success-icon">✅</div>
              <h4>Booking Confirmed!</h4>
              <p>Thank you! Our team will call you shortly to confirm your appointment.<br /><br /><strong>Reminder: Pay only in cash after service is completed.</strong></p>
              {bookingRef && <pre className="booking-summary text-start w-100" style={{ whiteSpace: "pre-wrap" }}>{bookingRef}</pre>}
              <button className="btn-confirm mt-3" type="button" onClick={onClose}>Done</button>
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              <div className="booking-summary">
                <div style={{ fontWeight: 800, marginBottom: 10, fontSize: "0.9rem" }}>🛒 Your Services</div>
                {cartItems.length === 0 ? (
                  <div style={{ color: "var(--gray)", fontSize: "0.85rem", textAlign: "center", padding: 10 }}>No services added yet. Close and pick services.</div>
                ) : (
                  <>
                    {cartItems.map((item) => (
                      <div className="item-row" key={item.id}>
                        <span>{item.name} {item.quantity > 1 ? `x${item.quantity}` : ""}</span>
                        <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="item-row"><span>Total</span><span style={{ color: "var(--sky)" }}>₹{total.toLocaleString()}</span></div>
                  </>
                )}
              </div>
              <div className="row g-3">
                <Field label="Full Name *" value={form.name} onChange={(value) => onFormChange("name", value)} placeholder="Your full name" />
                <Field label="Phone Number *" value={form.phone} onChange={(value) => onFormChange("phone", value)} placeholder="10-digit mobile number" type="tel" />
                <div className="col-12">
                  <label className="form-label-custom">Address *</label>
                  <textarea className="form-control form-control-custom" value={form.address} onChange={(event) => onFormChange("address", event.target.value)} rows={2} placeholder="Full address with landmark" />
                </div>
                <Field label="Preferred Date *" value={form.date || today} onChange={(value) => onFormChange("date", value)} type="date" min={today} />
                <div className="col-md-6">
                  <label className="form-label-custom">Preferred Time *</label>
                  <select className="form-control form-control-custom" value={form.time} onChange={(event) => onFormChange("time", event.target.value)}>
                    <option value="">Select time slot</option>
                    <option>9:00 AM - 11:00 AM</option>
                    <option>11:00 AM - 1:00 PM</option>
                    <option>1:00 PM - 3:00 PM</option>
                    <option>3:00 PM - 5:00 PM</option>
                    <option>5:00 PM - 7:00 PM</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label-custom">Special Instructions (optional)</label>
                  <textarea className="form-control form-control-custom" value={form.note} onChange={(event) => onFormChange("note", event.target.value)} rows={1} placeholder="Any specific requirements..." />
                </div>
              </div>
              <button className="btn-confirm mt-4 w-100" type="submit">Confirm Booking — Pay on Delivery 💵</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  min,
  error
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "search" | "email" | "tel" | "url" | "none" | "numeric" | "decimal";
  min?: string;
  error?: string;
}) {
  return (
    <div className="col-md-6">
      <label className="form-label-custom">{label}</label>
      <input
        className={`form-control form-control-custom ${error ? "is-invalid-lite" : ""}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        inputMode={inputMode}
        min={min}
      />
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

function getTodayInputValue() {
  return new Date().toISOString().split("T")[0] ?? "";
}

function formatMoney(value: number) {
  return Number.isInteger(value) ? value.toLocaleString("en-IN") : value.toLocaleString("en-IN", { maximumFractionDigits: 1 });
}

function chooseOfferBanner(offers: OfferBanner[], cartItems: CartItem[]) {
  if (offers.length === 0) return null;
  const selectedServiceIds = new Set(cartItems.map((item) => item.serviceId).filter(Boolean));
  return (
    offers.find((offer) => offer.serviceId && selectedServiceIds.has(offer.serviceId)) ??
    offers.find((offer) => offer.serviceId) ??
    offers.find((offer) => offer.categoryId) ??
    offers[0] ??
    null
  );
}

function isSupportedAgartalaLocation(choice: LocationChoice) {
  if (choice.coords) {
    const [lat, lng] = choice.coords.split(",").map((value) => Number(value.trim()));
    return lat !== undefined && lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng) && isWithinAgartalaServiceArea(lat, lng);
  }

  return hasAgartalaText(`${choice.label} ${choice.address}`);
}

function hasAgartalaText(value: string) {
  return value.trim().toLowerCase().includes("agartala");
}

function isWithinAgartalaServiceArea(lat: number, lng: number) {
  return distanceKm(lat, lng, agartalaCenter.lat, agartalaCenter.lng) <= agartalaServiceRadiusKm;
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function validateBookingForm(form: BookingForm, cartItems: CartItem[]) {
  const errors: BookingFormErrors = {};
  const today = getTodayInputValue();

  if (!form.name || form.name.length < 2) errors.name = "Enter the customer name.";
  if (!/^[6-9]\d{9}$/.test(form.phone)) errors.phone = "Enter a valid 10-digit Indian mobile number.";
  if (form.alternatePhone && !/^[6-9]\d{9}$/.test(form.alternatePhone)) errors.alternatePhone = "Enter a valid alternate mobile number.";
  if (!form.address || form.address.length < 8) errors.address = "Enter the full address with landmark.";
  if (!form.city || form.city.length < 2) errors.city = "Enter the service city.";
  if (!hasAgartalaText(`${form.city} ${form.address}`)) errors.city = "We currently serve Agartala only.";
  if (!form.date) errors.date = "Choose a service date.";
  if (form.date && form.date < today) errors.date = "Choose today or a future date.";
  if (!form.time) errors.time = "Choose a preferred time slot.";
  if (cartItems.length === 0) errors.cart = "Add at least one service before confirming.";

  return errors;
}

function createBookingPayload(form: BookingForm, cartItems: CartItem[], total: number, userId?: string): BookingCreateInput {
  const notes = [
    form.alternatePhone ? `Alternate mobile: ${form.alternatePhone}` : "",
    form.note
  ].filter(Boolean).join("\n");

  return {
    userId,
    customerName: form.name,
    customerPhone: form.phone,
    addressLine: form.address,
    city: form.city,
    preferredDate: form.date,
    preferredTimeSlot: form.time,
    notes: notes || undefined,
    paymentMode: form.paymentMode,
    totalAmount: Math.round(total),
    items: cartItems.map((item) => ({
      serviceId: item.serviceId,
      serviceName: item.name,
      quantity: item.quantity,
      unitPrice: Math.round(item.price)
    }))
  };
}

function createLocalBookingCode() {
  return `TWG-L-${Date.now().toString().slice(-8)}`;
}

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function getServiceSummary(items: BookingCreateInput["items"]) {
  return items.map((item) => `${item.serviceName}${item.quantity > 1 ? ` x${item.quantity}` : ""}`).join(", ");
}

function createWhatsappUrl(bookingCode: string, payload: BookingCreateInput) {
  const message = [
    `New Booking - ${bookingCode}`,
    `Name: ${payload.customerName}`,
    `Phone: ${payload.customerPhone}`,
    `Address: ${payload.addressLine}`,
    `City: ${payload.city}`,
    `Services: ${getServiceSummary(payload.items)}`,
    `Preferred Date & Time: ${payload.preferredDate} ${payload.preferredTimeSlot}`,
    `Payment: ${payload.paymentMode}`,
    `Total: Rs. ${payload.totalAmount.toLocaleString()}`,
    payload.notes ? `Instructions: ${payload.notes}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/919774887803?text=${encodeURIComponent(message)}`;
}

function formatBookingSummary(bookingCode: string, payload: BookingCreateInput, status: string, source: BookingSource) {
  return [
    `Booking ID: ${bookingCode}`,
    `Status: ${status}`,
    `Source: ${source === "database" ? "Database + WhatsApp" : "WhatsApp backup"}`,
    `Name: ${payload.customerName}`,
    `Phone: ${payload.customerPhone}`,
    `Services: ${getServiceSummary(payload.items)}`,
    `Date & Time: ${payload.preferredDate} - ${payload.preferredTimeSlot}`,
    `Payment: ${payload.paymentMode}`,
    `Total: Rs. ${payload.totalAmount.toLocaleString()}`
  ].join("\n");
}

function createHistoryItem(booking: Booking, payload: BookingCreateInput, source: BookingSource): BookingHistoryItem {
  return {
    bookingCode: booking.bookingCode,
    serviceSummary: getServiceSummary(payload.items),
    total: payload.totalAmount,
    preferredDate: payload.preferredDate,
    preferredTimeSlot: payload.preferredTimeSlot,
    status: booking.status,
    source,
    createdAt: booking.createdAt
  };
}

function createHistoryItemFromPayload(bookingCode: string, payload: BookingCreateInput, source: BookingSource): BookingHistoryItem {
  return {
    bookingCode,
    serviceSummary: getServiceSummary(payload.items),
    total: payload.totalAmount,
    preferredDate: payload.preferredDate,
    preferredTimeSlot: payload.preferredTimeSlot,
    status: source === "database" ? "PENDING" : "PENDING_WHATSAPP",
    source,
    createdAt: new Date().toISOString()
  };
}
