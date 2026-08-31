import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import type { Session as SupabaseSession } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./lib/supabase";
import QRCode from "qrcode";

const SHOP_NAME = "Coke Station";
type Screen = "landing" | "student-login" | "student-register" | "forgot-password" | "student-menu" | "owner-pin" | "owner-dashboard";
type Category = "All" | "Maggie" | "Eggs" | "Sandwiches" | "Hot Drinks" | "Cold Drinks" | "Snacks";
type MenuItem = { id: string; name: string; category: Exclude<Category, "All">; size: string; price: number; emoji: string; available: boolean };
type PaymentMethod = "UPI" | "COD";
type UpiApp = "Google Pay" | "PhonePe" | "Paytm" | "Other apps";
type PaymentSettings = { upiId: string; qrCode: string | null };
type StudentNotification = { id: string; title: string; message: string; emoji: string; tone: "preparing" | "ready" | "delivered" | "cancelled" };
const defaultPaymentSettings: PaymentSettings = { upiId: "7598981132@fam", qrCode: null };
const MINIMUM_ORDER = 60;
type Order = { id: string; createdAt: string; student: string; phone: string; hostel: string; room?: string; studentId?: string; items: { name: string; quantity: number }[]; total: number; payment: PaymentMethod; upiApp?: UpiApp; paymentStatus: "Pending" | "Paid" | "Failed" | "Cancelled"; status: "New" | "Preparing" | "Ready" | "Out for Delivery" | "Delivered" | "Cancelled"; paymentConfirmedManually?: boolean };
type Shift = { id: string; openedAt: string; closedAt?: string; orderCount: number; online: number; cod: number; total: number; pending: number };
type StudentProfile = { id?: string; name: string; phone: string; hostel: string; room: string };
type StudentAuthInput = { name: string; phone: string; password: string; register: boolean };
type Hostel = { name: string; gender: "Boys Hostel" | "Girls Hostel"; latitude?: number; longitude?: number };
const hostels: Hostel[] = [
  { name: "Agate", gender: "Boys Hostel", latitude: 10.762137403112972, longitude: 78.8132997404081 },
  { name: "Garnet A", gender: "Boys Hostel", latitude: 10.762510570185626, longitude: 78.81151738075262 },
  { name: "Garnet B", gender: "Boys Hostel", latitude: 10.763227296938446, longitude: 78.81158711818958 },
  { name: "Garnet C", gender: "Boys Hostel", latitude: 10.763675741927413, longitude: 78.81255792854171 },
  { name: "Zircon A", gender: "Boys Hostel", latitude: 10.76617255057139, longitude: 78.81769769701339 },
  { name: "Zircon B", gender: "Boys Hostel", latitude: 10.76617255057139, longitude: 78.81769769701339 },
  { name: "Zircon C", gender: "Boys Hostel", latitude: 10.766561694379964, longitude: 78.81653095344988 },
  { name: "Amber A", gender: "Boys Hostel", latitude: 10.767816906460675, longitude: 78.81368529188931 },
  { name: "Amber B", gender: "Boys Hostel", latitude: 10.767816906460675, longitude: 78.81368529188931 },
  { name: "Coral", gender: "Boys Hostel", latitude: 10.762259126028722, longitude: 78.81556372731433 },
  { name: "Aquamarine A", gender: "Boys Hostel", latitude: 10.76803787234711, longitude: 78.81843373808012 },
  { name: "Aquamarine B", gender: "Boys Hostel", latitude: 10.76803787234711, longitude: 78.81843373808012 },
  { name: "Ruby", gender: "Boys Hostel", latitude: 10.764345393756026, longitude: 78.81735036361107 },
  { name: "Emerald", gender: "Boys Hostel" },
  { name: "Pearl", gender: "Boys Hostel", latitude: 10.764236429262786, longitude: 78.81540921041675 },
  { name: "Sapphire", gender: "Boys Hostel" },
  { name: "Topaz", gender: "Boys Hostel" },
  { name: "Lapse", gender: "Boys Hostel", latitude: 10.764209103836722, longitude: 78.81389389562526 },
  { name: "Diamond", gender: "Boys Hostel", latitude: 10.763144556633666, longitude: 78.8144410662619 },
  { name: "Jade", gender: "Boys Hostel", latitude: 10.76344563322943, longitude: 78.81786511259108 },
  { name: "Jasper", gender: "Boys Hostel", latitude: 10.769331525856403, longitude: 78.81839464239414 },
  { name: "Amethyst", gender: "Boys Hostel", latitude: 10.766427776724644, longitude: 78.81454299018299 },
  { name: "Opal A", gender: "Girls Hostel", latitude: 10.758637111325784, longitude: 78.82061239730831 },
  { name: "Opal B", gender: "Girls Hostel", latitude: 10.758637111325784, longitude: 78.82061239730831 },
  { name: "Opal C", gender: "Girls Hostel", latitude: 10.758637111325784, longitude: 78.82061239730831 },
  { name: "Opal D", gender: "Girls Hostel", latitude: 10.758637111325784, longitude: 78.82061239730831 },
  { name: "Opal E", gender: "Girls Hostel", latitude: 10.758637111325784, longitude: 78.82061239730831 },
  { name: "Opal F", gender: "Girls Hostel", latitude: 10.758637111325784, longitude: 78.82061239730831 },
  { name: "Beryl", gender: "Girls Hostel", latitude: 10.762089234457777, longitude: 78.81746592790621 },
];
const emptyProfile: StudentProfile = { name: "Vishwa S", phone: "", hostel: "", room: "" };
function isHostedEnvironment() {
  return typeof window !== "undefined" && !["localhost", "127.0.0.1"].includes(window.location.hostname);
}
function normalizeIndianPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const tenDigits = digits.startsWith("91") && digits.length > 10 ? digits.slice(-10) : digits;
  return tenDigits.length === 10 ? `+91${tenDigits}` : value.trim();
}
function phoneCandidates(value: string) {
  const digits = value.replace(/\D/g, "");
  const tenDigits = digits.startsWith("91") && digits.length > 10 ? digits.slice(-10) : digits;
  if (tenDigits.length !== 10) return [value.trim()];
  return [...new Set([`+91${tenDigits}`, `91${tenDigits}`, tenDigits])];
}
function displayPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return value || "Phone unavailable";
}
function HostelOptions() {
  return <><option value="">Select your hostel</option><optgroup label="BOYS HOSTEL">{hostels.filter((hostel) => hostel.gender === "Boys Hostel").map((hostel) => <option value={hostel.name} key={hostel.name}>{hostel.name}</option>)}</optgroup><optgroup label="GIRLS HOSTEL">{hostels.filter((hostel) => hostel.gender === "Girls Hostel").map((hostel) => <option value={hostel.name} key={hostel.name}>{hostel.name}</option>)}</optgroup></>;
}
function openHostelDirections(hostel: Hostel, onBlocked?: (message: string) => void) {
  if (hostel.latitude === undefined || hostel.longitude === undefined) return;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${hostel.latitude},${hostel.longitude}`;
  const newWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (newWindow) return;
  void navigator.clipboard?.writeText(url);
  onBlocked?.("Maps was blocked in this preview, so the directions link was copied.");
}

type IconName = "cart" | "plus" | "minus" | "close" | "check" | "arrow" | "history" | "phone" | "settings" | "menu" | "store" | "clock" | "box" | "cash" | "card" | "truck" | "refresh";
function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "cart": return <svg {...p}><path d="M3 4h2l1.7 10a2 2 0 0 0 2 1.7h7.2a2 2 0 0 0 1.9-1.5L20 8H6" /><circle cx="9" cy="19" r="1.3" /><circle cx="17" cy="19" r="1.3" /></svg>;
    case "plus": return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
    case "minus": return <svg {...p}><path d="M5 12h14" /></svg>;
    case "close": return <svg {...p}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "check": return <svg {...p}><path d="m5 12 4 4L19 7" /></svg>;
    case "arrow": return <svg {...p}><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
    case "history": return <svg {...p}><path d="M4 12a8 8 0 1 0 3-6" /><path d="M4 5v5h5M12 7v5l3 2" /></svg>;
    case "phone": return <svg {...p}><path d="M7 4 5.4 5.2a2 2 0 0 0-.7 2.3c1.7 5.2 5 8.5 10.2 10.2a2 2 0 0 0 2.3-.7l1.2-1.6a1.5 1.5 0 0 0-.2-2l-1.7-1.4a1.5 1.5 0 0 0-2 .1l-.9.9a12 12 0 0 1-3.7-3.7l.9-.9a1.5 1.5 0 0 0 .1-2L9 4.2A1.5 1.5 0 0 0 7 4Z" /></svg>;
    case "settings": return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a2 2 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a2 2 0 0 0-1.9-.3 2 2 0 0 0-1 1.6v.1h-2.5V20a2 2 0 0 0-1-1.6 2 2 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a2 2 0 0 0 .3-1.9 2 2 0 0 0-1.6-1H6v-2.5h.4a2 2 0 0 0 1.6-1 2 2 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a2 2 0 0 0 1.9.3 2 2 0 0 0 1-1.6v-.1h2.5v.1a2 2 0 0 0 1 1.6 2 2 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a2 2 0 0 0-.3 1.9 2 2 0 0 0 1.6 1h.4V14h-.4a2 2 0 0 0-1.6 1Z" /></svg>;
    case "menu": return <svg {...p}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
    case "store": return <svg {...p}><path d="M4 10v10h16V10M3 10l2-5h14l2 5" /><path d="M3 10a3 3 0 0 0 5 0 3 3 0 0 0 5 0 3 3 0 0 0 5 0 3 3 0 0 0 3 0" /></svg>;
    case "clock": return <svg {...p}><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></svg>;
    case "box": return <svg {...p}><path d="m4 8 8-4 8 4-8 4-8-4ZM4 8v8l8 4 8-4V8M12 12v8" /></svg>;
    case "cash": return <svg {...p}><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>;
    case "card": return <svg {...p}><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3 9.5h18M7 14h3" /></svg>;
    case "truck": return <svg {...p}><path d="M3 6h11v10H3zM14 10h3.5l3 3v3H14" /><circle cx="7" cy="18" r="2" /><circle cx="17.5" cy="18" r="2" /></svg>;
    case "refresh": return <svg {...p}><path d="M20 11a8 8 0 0 0-14.5-4L4 9" /><path d="M4 4v5h5M4 13a8 8 0 0 0 14.5 4L20 15" /><path d="M20 20v-5h-5" /></svg>;
  }
}

const categories: { name: Category; emoji: string }[] = [
  { name: "All", emoji: "🌙" }, { name: "Maggie", emoji: "🍜" }, { name: "Eggs", emoji: "🍳" }, { name: "Sandwiches", emoji: "🥪" }, { name: "Hot Drinks", emoji: "☕" }, { name: "Cold Drinks", emoji: "🥤" }, { name: "Snacks", emoji: "🍟" },
];
const defaultMenu: MenuItem[] = [
  { id: "maggie", name: "Maggie", category: "Maggie", size: "Regular", price: 35, emoji: "🍜", available: true },
  { id: "cheese-maggie", name: "Cheese Maggie", category: "Maggie", size: "Regular", price: 40, emoji: "🧀", available: false },
  { id: "chicken-maggie", name: "Chicken Maggie", category: "Maggie", size: "Regular", price: 45, emoji: "🍜", available: true },
  { id: "cheese-chicken", name: "Cheese Chicken Maggie", category: "Maggie", size: "Regular", price: 50, emoji: "🍜", available: true },
  { id: "bread-omelette", name: "Bread Omelette", category: "Eggs", size: "Regular", price: 35, emoji: "🍳", available: true },
  { id: "double-omelette", name: "Double Omelette", category: "Eggs", size: "Regular", price: 25, emoji: "🥚", available: true },
  { id: "tea", name: "Tea", category: "Hot Drinks", size: "Cup", price: 10, emoji: "🍵", available: true },
  { id: "coffee", name: "Coffee", category: "Hot Drinks", size: "Cup", price: 10, emoji: "☕", available: true },
  { id: "sprite", name: "Sprite", category: "Cold Drinks", size: "750 ml", price: 40, emoji: "🥤", available: true },
  { id: "veg-sandwich", name: "Veg Sandwich", category: "Sandwiches", size: "Regular", price: 45, emoji: "🥪", available: true },
  { id: "chips", name: "Peri Peri Chips", category: "Snacks", size: "Pack", price: 30, emoji: "🍟", available: true },
  { id: "cheese-sandwich", name: "Cheese Sandwich", category: "Sandwiches", size: "Regular", price: 45, emoji: "🥪", available: true },
  { id: "chicken-sandwich", name: "Chicken Sandwich", category: "Sandwiches", size: "Regular", price: 60, emoji: "🥪", available: true },
  { id: "veg-roll", name: "Veg Roll", category: "Sandwiches", size: "Regular", price: 35, emoji: "🌯", available: true },
  { id: "chicken-roll", name: "Chicken Roll", category: "Sandwiches", size: "Regular", price: 55, emoji: "🌯", available: true },
  { id: "black-tea", name: "Black Tea", category: "Hot Drinks", size: "Cup", price: 15, emoji: "🍵", available: true },
  { id: "lemon-tea", name: "Lemon Tea", category: "Hot Drinks", size: "Cup", price: 15, emoji: "🍋", available: true },
  { id: "cold-coffee", name: "Cold Coffee", category: "Cold Drinks", size: "Glass", price: 45, emoji: "🥤", available: true },
  { id: "water", name: "Water Bottle", category: "Cold Drinks", size: "1 L", price: 20, emoji: "💧", available: true },
  { id: "cookies", name: "Chocolate Cookies", category: "Snacks", size: "Pack", price: 25, emoji: "🍪", available: true },
  { id: "brownie", name: "Chocolate Brownie", category: "Snacks", size: "Piece", price: 40, emoji: "🍫", available: true },
];
// Only the empty current shift is seeded. Orders and completed history are loaded from the backend/local session state.
const defaultShifts: Shift[] = [
  { id: "shift-current", openedAt: new Date().toISOString(), orderCount: 0, online: 0, cod: 0, total: 0, pending: 0 },
];
function read<T>(key: string, fallback: T): T { try { const value = window.localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; } }
function money(value: number) { return `₹${value.toLocaleString("en-IN")}`; }
// Stored phone numbers can show up as a bare 10-digit number, or with a "91"
// country-code prefix but no "+" (e.g. "917200874720") — dialers reject that
// second form as an invalid number since it's neither a valid local number
// nor a properly-formed international one. Always rebuild a clean +91
// E.164 number from just the digits, regardless of how it was stored.
function telHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `tel:+91${digits.slice(-10)}`;
}
function clock(value: string) { return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
function shortDate(value: string) { return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" }).format(new Date(value)); }
function dashboardDate(value: string) { return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(value)); }
function dateTime(value: string) { return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
function fullDateTime(value: string) { return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
function orderFromDatabase(row: Record<string, unknown>): Order {
  const rawItems = Array.isArray(row.items) ? row.items : [];
  const items = rawItems.flatMap((item) => {
    if (typeof item === "object" && item !== null) {
      const value = item as { name?: unknown; quantity?: unknown };
      return typeof value.name === "string" ? [{ name: value.name, quantity: Number(value.quantity) || 1 }] : [];
    }
    return typeof item === "string" ? [{ name: item, quantity: 1 }] : [];
  });
  const rawPayment = String(row.payment_method ?? row.payment ?? "COD").toUpperCase();
  const rawStatus = String(row.status ?? "New");
  const rawPaymentStatus = String(row.payment_status ?? "Pending");
  const statuses: Order["status"][] = ["New", "Preparing", "Ready", "Out for Delivery", "Delivered", "Cancelled"];
  const paymentStatuses: Order["paymentStatus"][] = ["Pending", "Paid", "Failed", "Cancelled"];
  return {
    id: String(row.order_ref ?? row.id ?? "ORDER"),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    studentId: typeof row.student_id === "string" ? row.student_id : undefined,
    student: String(row.student_name ?? row.student ?? "Student"),
    phone: String(row.student_phone ?? row.phone ?? ""),
    hostel: String(row.hostel ?? ""),
    items,
    total: Number(row.total ?? 0),
    payment: rawPayment === "UPI" ? "UPI" : "COD",
    upiApp: typeof row.upi_app === "string" && row.upi_app ? row.upi_app as UpiApp : undefined,
    paymentStatus: paymentStatuses.includes(rawPaymentStatus as Order["paymentStatus"]) ? rawPaymentStatus as Order["paymentStatus"] : "Pending",
    status: statuses.includes(rawStatus as Order["status"]) ? rawStatus as Order["status"] : "New",
    paymentConfirmedManually: row.payment_confirmed_manually === true,
  };
}


function menuItemFromDatabase(row: Record<string, unknown>): MenuItem {
  const categories: Exclude<Category, "All">[] = ["Maggie", "Eggs", "Sandwiches", "Hot Drinks", "Cold Drinks", "Snacks"];
  const category = String(row.category ?? "Snacks");
  return {
    id: String(row.id ?? `menu-${Date.now()}`),
    name: String(row.name ?? "Menu item"),
    category: categories.includes(category as Exclude<Category, "All">) ? category as Exclude<Category, "All"> : "Snacks",
    size: String(row.size ?? "Regular"),
    price: Number(row.price ?? 0),
    emoji: String(row.emoji ?? "🍽️"),
    available: row.available !== false,
  };
}

function getStudentStatusNotification(order: Order): StudentNotification | null {
  if (order.status === "Preparing") return { id: `${order.id}-Preparing`, title: "Order Preparing!", message: "The kitchen is preparing your order.", emoji: "👨‍🍳", tone: "preparing" };
  if (order.status === "Ready" || order.status === "Out for Delivery") return { id: `${order.id}-${order.status}`, title: "Out for Delivery!", message: `Your order is on the way to ${order.hostel || "your hostel"}!`, emoji: "🛵", tone: "ready" };
  if (order.status === "Delivered") return { id: `${order.id}-Delivered`, title: "Order Delivered!", message: `Delivered to ${order.hostel || "your hostel"}. Enjoy your food! 🎉`, emoji: "🎉", tone: "delivered" };
  if (order.status === "Cancelled") return { id: `${order.id}-Cancelled`, title: "Order Canceled!", message: "Your order was canceled because the online payment was not successful.", emoji: "❌", tone: "cancelled" };
  return null;
}

function MiniCup() { return <span className="mini-cup"><i /><b /></span>; }
function Brand({ owner = false, student = true, studentName = "Vishwa S" }: { owner?: boolean; student?: boolean; studentName?: string }) { return <div className="legacy-brand"><MiniCup /><div><strong>Coke Station</strong><small>{owner ? "OWNER DASHBOARD" : student ? `👋 ${studentName.toUpperCase()}` : "Hostel Night Canteen"}</small></div></div>; }
function Modal({ title, subtitle, onClose, children, wide = false, className = "" }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; wide?: boolean; className?: string }) { return <div className="dark-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={`dark-modal ${wide ? "wide" : ""} ${className}`}><div className="dark-modal-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="dark-close" onClick={onClose}><Icon name="close" size={17} /></button></div>{children}</div></div>; }
function PrimaryButton({ children, onClick, type = "button", className = "", disabled = false }: { children: ReactNode; onClick?: () => void; type?: "button" | "submit"; className?: string; disabled?: boolean }) { return <button type={type} onClick={onClick} disabled={disabled} className={`red-button ${className}`}>{children}</button>; }

function Landing({ onStudent, onOwner }: { onStudent: () => void; onOwner: () => void }) {
  return <div className="auth-page"><div className="auth-brand"><MiniCup /><h1>Coke Station</h1><p>Hostel Night Canteen · Open 7PM onwards</p><span className="phone-badge">📱 &nbsp;Phone + Password Login</span></div><div className="who-label">Who are you?</div><div className="auth-choice"><PrimaryButton onClick={onStudent}>🎓 Student Login <Icon name="arrow" size={17} /></PrimaryButton><button className="owner-login-button" onClick={onOwner}>🏪 Shop Owner Login <Icon name="arrow" size={17} /></button></div></div>;
}

function Login({ owner, register, onBack, onSuccess, onRegister, onStudentAuth, onForgotPassword }: { owner?: boolean; register?: boolean; onBack: () => void; onSuccess: (value?: string) => void; onRegister?: () => void; onStudentAuth?: (input: StudentAuthInput) => Promise<void>; onForgotPassword?: () => void }) {
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (owner) {
      if (pin === "coke123") onSuccess(pin);
      else setError("Incorrect PIN. Please try again.");
      return;
    }
    if (register && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      if (onStudentAuth) await onStudentAuth({ name: register ? fullName : "", phone: mobile, password, register: Boolean(register) });
      else onSuccess();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to complete sign in.");
    } finally {
      setLoading(false);
    }
  };
  return <div className="auth-page form-page"><div className="auth-brand compact"><MiniCup /><h1>Coke Station</h1><p>Hostel Night Canteen · Open 7PM onwards</p><span className="phone-badge">📱 &nbsp;Phone + Password Login</span></div><form className="auth-form" onSubmit={submit}><h2>{owner ? "Owner PIN" : register ? "Student Registration" : "Student Login"}</h2>{owner ? <label><span>OWNER PIN</span><div className="password-field"><input autoFocus type="password" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="Enter PIN" /><b>🔑</b></div></label> : <>{register && <label><span>FULL NAME</span><input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" required /></label>}<label><span>MOBILE NUMBER</span><div className="password-field"><input value={mobile} onChange={(event) => setMobile(event.target.value)} placeholder="10-digit mobile number" inputMode="tel" required /><b>🔑</b></div></label><label><span>PASSWORD</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required /></label>{register && <label><span>CONFIRM PASSWORD</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="••••••••" required /></label>}</>}{!register && !owner && <button type="button" className="forgot-link" onClick={onForgotPassword}>Forgot Password?</button>}{error && <p className="auth-error">{error}</p>}<PrimaryButton type="submit" className="auth-submit">{loading ? "Please wait…" : owner || !register ? "Login" : "Create account"} {!loading && <Icon name="arrow" size={17} />}</PrimaryButton>{!owner && <p className="auth-switch-text">{register ? "Already have an account?" : "No account?"} <button type="button" onClick={onRegister}>{register ? "Login here" : "Register here"}</button></p>}<button type="button" className="back-link" onClick={onBack}>← Back</button></form></div>;
}
function StudentHeader({ onHistory, onLogout, onCart, onProfile, studentName, cartCount, cartTotal }: { onHistory: () => void; onLogout: () => void; onCart: () => void; onProfile: () => void; studentName: string; cartCount: number; cartTotal: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="student-header"><div className="student-header-inner"><Brand studentName={studentName} /><div className="student-header-actions"><button className={`student-cart ${cartCount > 0 ? "has-items" : ""}`} onClick={onCart}><Icon name="cart" size={18} /><span>{cartCount > 0 ? `${cartCount} · ${money(cartTotal)}` : "Cart"}</span></button><button className="kebab-button" onClick={() => setMenuOpen(!menuOpen)}>⋮</button>{menuOpen && <div className="header-dropdown"><button className="drop-selected" onClick={onHistory}>📋 Order History</button><button onClick={onProfile}>👤 Profile</button><button onClick={onLogout}>🚪 Logout</button></div>}</div></div></header>;
}

function StudentStatusNotification({ notification, onClose }: { notification: StudentNotification | null; onClose: () => void }) {
  if (!notification) return null;
  return <div className={`student-status-notification ${notification.tone}`} role="status" aria-live="polite"><div className="student-status-icon">{notification.emoji}</div><div className="student-status-copy"><strong>{notification.title}</strong><span>{notification.message}</span></div><button className="student-status-close" onClick={onClose} aria-label="Dismiss notification">×</button></div>;
}

function StudentProduct({ product, quantity, onAdd, onQuantity }: { product: MenuItem; quantity: number; onAdd: (item: MenuItem) => void; onQuantity: (id: string, delta: number) => void }) { return <article className={`student-product ${quantity > 0 ? "in-cart" : ""} ${!product.available ? "sold-out" : ""}`}><div className="product-emoji">{product.emoji}</div><div className="student-product-copy"><b>{product.name}</b>{!product.available && <span className="stock-badge">OUT OF STOCK</span>}<span>{product.size}</span><strong>{money(product.price)}</strong></div>{!product.available ? <button className="product-add" disabled>Out of Stock</button> : quantity > 0 ? <div className="product-stepper"><button aria-label={`Remove one ${product.name}`} onClick={() => onQuantity(product.id, -1)}>−</button><span>{quantity}</span><button aria-label={`Add one ${product.name}`} onClick={() => onQuantity(product.id, 1)}>+</button></div> : <button className="product-add" onClick={() => onAdd(product)}>+ Add</button>}</article>; }
function CartModal({ cart, onQuantity, onClose, onCheckout }: { cart: { item: MenuItem; quantity: number }[]; onQuantity: (id: string, delta: number) => void; onClose: () => void; onCheckout: () => void }) {
  const total = cart.reduce((sum, row) => sum + row.item.price * row.quantity, 0);
  const minimumRemaining = Math.max(0, MINIMUM_ORDER - total);
  const minimumReached = total >= MINIMUM_ORDER;
  return <Modal title="🛒 Cart" subtitle={`${cart.reduce((sum, row) => sum + row.quantity, 0)} item(s) in your order`} onClose={onClose}><div className="cart-modal-body">{cart.length === 0 ? <div className="center-empty"><Icon name="cart" size={30} /><h3>Your cart is empty</h3><p>Add something from the menu first.</p></div> : <>{cart.map((row) => <div className="cart-row" key={row.item.id}><span className="cart-row-emoji">{row.item.emoji}</span><div><b>{row.item.name}</b><small>{row.item.size}</small><div className="quantity-stepper"><button onClick={() => onQuantity(row.item.id, -1)}><Icon name="minus" size={12} /></button><span>{row.quantity}</span><button onClick={() => onQuantity(row.item.id, 1)}><Icon name="plus" size={12} /></button></div></div><strong>{money(row.item.price * row.quantity)}</strong></div>)}<div className="cart-total"><span>Total</span><b>{money(total)}</b></div><div className={`cart-minimum-order ${minimumReached ? "reached" : ""}`} role="status"><span className="cart-minimum-icon">🛒</span><div><strong>Minimum order: {money(MINIMUM_ORDER)}</strong><small>{minimumReached ? "Minimum reached. You can continue to checkout." : `Add items worth ${money(minimumRemaining)} to place an order.`}</small></div></div><PrimaryButton className="full-width" onClick={onCheckout} disabled={!minimumReached}>Continue to checkout <Icon name="arrow" size={16} /></PrimaryButton></>}</div></Modal>;
}

function ProfileModal({ profile, onClose, onChangePassword }: { profile: StudentProfile; onClose: () => void; onChangePassword: () => void }) {
  return <Modal title="👤 Profile" subtitle="Your account details" onClose={onClose}>
    <div className="profile-view">
      <div className="profile-detail-card"><span>STUDENT NAME</span><strong>{profile.name || "Vishwa S"}</strong></div>
      <div className="profile-detail-card"><span>PHONE NUMBER</span><strong>{displayPhone(profile.phone)}</strong></div>
      <button className="change-password-button" onClick={onChangePassword}>Change Password</button>
    </div>
  </Modal>;
}

function PasswordField({ label, placeholder, value, onChange, visible, onToggle }: { label: string; placeholder: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void }) {
  return <div className="profile-field"><span>{label}</span><div className="password-input-wrap"><input type={visible ? "text" : "password"} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} required /><button type="button" className="password-visibility" onClick={onToggle} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}>{visible ? "◉" : "○"}</button></div></div>;
}

function ChangePasswordModal({ onClose, onUpdate }: { onClose: () => void; onUpdate: (credentials: { currentPassword: string; newPassword: string }) => void | Promise<void> }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!currentPassword) { setError("Enter your current password."); return; }
    if (newPassword.length < 6) { setError("New password must contain at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setError("New passwords do not match."); return; }
    setSaving(true);
    try {
      await onUpdate({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Password could not be changed.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal title="🔒 Change Password" subtitle="Keep your account secure" onClose={onClose}>
    {!success ? <form className="profile-password-form" onSubmit={submit}>
      <PasswordField label="CURRENT PASSWORD" placeholder="Enter current password" value={currentPassword} onChange={setCurrentPassword} visible={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} />
      <PasswordField label="NEW PASSWORD" placeholder="Minimum 6 characters" value={newPassword} onChange={setNewPassword} visible={showNew} onToggle={() => setShowNew(!showNew)} />
      <PasswordField label="CONFIRM NEW PASSWORD" placeholder="Re-enter new password" value={confirmPassword} onChange={setConfirmPassword} visible={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
      {error && <p className="profile-error">{error}</p>}
      <button className="update-password-button" type="submit" disabled={saving}>{saving ? "Updating…" : "Update Password"} {!saving && <Icon name="check" size={16} />}</button>
    </form> : <div className="password-success"><div className="password-success-icon"><Icon name="check" size={27} /></div><h3>Password updated</h3><p>Your Coke Station password was changed successfully.</p><button className="update-password-button" onClick={onClose}>Done <Icon name="check" size={16} /></button></div>}
  </Modal>;
}
function ForgotPasswordPage({ onBack, onSuccess }: { onBack: () => void; onSuccess: (message: string) => void }) {
  const [step, setStep] = useState<"details" | "password">("details");
  const [studentName, setStudentName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const verifyDetails = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const normalized = normalizeIndianPhone(phoneInput);
    if (!studentName.trim()) { setError("Enter your student name."); return; }
    if (!/^\+91\d{10}$/.test(normalized)) { setError("Enter a valid 10-digit Indian mobile number."); return; }
    if (!supabase || !supabaseConfigured) { setError("Password reset is not connected yet."); return; }
    setSaving(true);
    let verifiedPhone = "";
    let verificationError = "";
    for (const candidate of phoneCandidates(phoneInput)) {
      const { data: identityMatches, error: identityError } = await supabase.rpc("coke_verify_student_identity", { p_phone: candidate, p_full_name: studentName.trim() });
      if (identityError) { verificationError = identityError.message; continue; }
      if (identityMatches === true) { verifiedPhone = candidate; break; }
    }
    setSaving(false);
    if (verificationError && !verifiedPhone) { setError("Password reset is not configured yet. Please run the forgot-password SQL setup."); return; }
    if (!verifiedPhone) { setError("We couldn’t verify those details. Check your name and phone number and try again."); return; }
    setPhone(verifiedPhone);
    setStep("password");
  };

  const updatePassword = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (newPassword.length < 6) { setError("New password must contain at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setError("New passwords do not match."); return; }
    if (!supabase || !supabaseConfigured) { setError("Password reset is not connected yet."); return; }
    setSaving(true);
    const { data: reset, error: resetError } = await supabase.rpc("coke_reset_student_password", { p_phone: phone, p_full_name: studentName.trim(), p_new_password: newPassword });
    setSaving(false);
    if (resetError) { setError("Password reset is not configured yet. Please run the forgot-password SQL setup."); return; }
    if (reset !== true) { setError("We couldn’t verify those details. Please start again."); setStep("details"); return; }
    setSuccess(true);
    onSuccess("Password reset successfully");
  };

  return <div className="auth-page forgot-page"><div className="auth-brand forgot-brand"><MiniCup /><h1>Coke Station</h1><p>Hostel Night Canteen · Open 7PM onwards</p><button className="phone-badge phone-login-nav" type="button" onClick={onBack}>📱 &nbsp;Phone + Password Login</button></div><form className="auth-form forgot-form" onSubmit={step === "details" ? verifyDetails : updatePassword}>{success ? <div className="forgot-success"><div className="password-success-icon"><Icon name="check" size={27} /></div><h2>Password reset successful</h2><p>You can now log in with your registered phone number and new password.</p><PrimaryButton type="button" className="auth-submit" onClick={onBack}>Back to login <Icon name="arrow" size={17} /></PrimaryButton></div> : step === "details" ? <><h2>Forgot Password</h2><p className="forgot-subtitle">Enter your details</p><label><span>STUDENT NAME</span><input autoFocus value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="Your full name" autoComplete="name" required /></label><label><span>REGISTERED PHONE NUMBER</span><input value={phoneInput} onChange={(event) => setPhoneInput(event.target.value.replace(/[^\d+\s-]/g, ""))} placeholder="10-digit mobile number" inputMode="tel" autoComplete="tel" required /></label><PrimaryButton type="submit" className="auth-submit" disabled={saving}>{saving ? "Verifying…" : "Verify Details"} {!saving && <Icon name="arrow" size={17} />}</PrimaryButton></> : <><h2>Forgot Password</h2><p className="forgot-subtitle">Enter your details</p><label><span>STUDENT NAME</span><input className="verified-field" value={studentName} readOnly /></label><label><span>REGISTERED PHONE NUMBER</span><input className="verified-field" value={phoneInput || phone.replace(/^\+91/, "")} readOnly /></label><PasswordField label="NEW PASSWORD" placeholder="Minimum 6 characters" value={newPassword} onChange={setNewPassword} visible={showNew} onToggle={() => setShowNew(!showNew)} /><PasswordField label="CONFIRM NEW PASSWORD" placeholder="Re-enter new password" value={confirmPassword} onChange={setConfirmPassword} visible={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} /><PrimaryButton type="submit" className="auth-submit" disabled={saving}>{saving ? "Resetting…" : "Reset Password"} {!saving && <Icon name="check" size={17} />}</PrimaryButton></>}{error && <p className="auth-error forgot-error">{error}</p>}{!success && <button type="button" className="back-link" onClick={onBack}>← Back</button>}</form></div>;
}

function StudentHostelPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="hostel-bar"><span aria-hidden="true">🏠</span><select aria-label="Select your hostel" value={value} onChange={(event) => onChange(event.target.value)}><HostelOptions /></select></div>;
}

function StudentMenu({ menu, cart, shopOpen, profile, notification, onDismissNotification, onUpdatePassword, onAdd, onQuantity, onHistory, onCart, onCheckout, onLogout }:  { menu: MenuItem[]; cart: { item: MenuItem; quantity: number }[]; shopOpen: boolean; profile: StudentProfile; notification: StudentNotification | null; onDismissNotification: () => void; onUpdatePassword: (credentials: { currentPassword: string; newPassword: string }) => void | Promise<void>; onAdd: (item: MenuItem) => void; onQuantity: (id: string, delta: number) => void; onHistory: () => void; onCart: () => void; onCheckout: (hostel?: string) => void; onLogout: () => void }) {
  const [category, setCategory] = useState<Category>("All");
  const [hostel, setHostel] = useState(profile.hostel || "");
  const [cartOpen, setCartOpen] = useState(false);
  useEffect(() => { if (profile.hostel) setHostel(profile.hostel); }, [profile.hostel]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const shown = menu.filter((item) => category === "All" || item.category === category);
  const cartCount = cart.reduce((sum, row) => sum + row.quantity, 0);
  const cartTotal = cart.reduce((sum, row) => sum + row.item.price * row.quantity, 0);
  if (!shopOpen) return <div className="student-page"><StudentHeader onHistory={onHistory} onLogout={onLogout} onCart={() => setCartOpen(true)} onProfile={() => setProfileOpen(true)} studentName={profile.name} cartCount={cart.reduce((sum, row) => sum + row.quantity, 0)} cartTotal={cartTotal} /><StudentStatusNotification notification={notification} onClose={onDismissNotification} /><div className="closed-student"><div className="closed-cup">🥤</div><span className="live-label">● SERVICE PAUSED</span><h1>Shop is closed</h1><p>We usually deliver from 7:00 PM to 2:00 AM.<br />Please come back during the night shift.</p><button className="dark-outline-button" onClick={onHistory}>View order history</button></div>{cartOpen && <CartModal cart={cart} onQuantity={onQuantity} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); onCheckout(hostel); }} />}{profileOpen && <ProfileModal profile={profile} onClose={() => setProfileOpen(false)} onChangePassword={() => { setProfileOpen(false); setPasswordOpen(true); }} />}{passwordOpen && <ChangePasswordModal onClose={() => setPasswordOpen(false)} onUpdate={onUpdatePassword} />}</div>;
  return <div className="student-page"><StudentHeader onHistory={onHistory} onLogout={onLogout} onCart={() => setCartOpen(true)} onProfile={() => setProfileOpen(true)} studentName={profile.name} cartCount={cart.reduce((sum, row) => sum + row.quantity, 0)} cartTotal={cartTotal} /><StudentStatusNotification notification={notification} onClose={onDismissNotification} /><StudentHostelPicker value={hostel} onChange={setHostel} /><section className="student-hero"><span className="live-label">● LIVE · Hostel Night Canteen</span><h1>Late night hunger?<br /><em>We've got you covered.</em></h1><p>Maggie, sandwiches, chai, cold drinks — straight to your hostel.</p></section><div className="category-bar">{categories.map((item) => <button className={category === item.name ? "active" : ""} key={item.name} onClick={() => setCategory(item.name)}><span>{item.emoji}</span>{item.name}</button>)}</div><main className="student-menu-area"><div className="student-products">{shown.map((item) => <StudentProduct key={item.id} product={item} quantity={cart.find((row) => row.item.id === item.id)?.quantity || 0} onAdd={onAdd} onQuantity={onQuantity} />)}</div>{!shown.length && <div className="center-empty">No items in this category.</div>}</main>{cartOpen && <CartModal cart={cart} onQuantity={onQuantity} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); onCheckout(hostel); }} />}{profileOpen && <ProfileModal profile={profile} onClose={() => setProfileOpen(false)} onChangePassword={() => { setProfileOpen(false); setPasswordOpen(true); }} />}{passwordOpen && <ChangePasswordModal onClose={() => setPasswordOpen(false)} onUpdate={onUpdatePassword} />}{cart.length > 0 && !cartOpen && <button className="mobile-cart-bar" onClick={() => cartTotal >= MINIMUM_ORDER ? onCheckout(hostel) : setCartOpen(true)}><span>{cartCount} {cartCount === 1 ? "item" : "items"} in cart</span><strong>{money(cartTotal)} <span aria-hidden="true">→</span></strong></button>}</div>;
}

function CheckoutModal({ cart, profile, upiId, initialHostel = "", onClose, onPlace }: { cart: { item: MenuItem; quantity: number }[]; profile: StudentProfile; upiId: string; initialHostel?: string; onClose: () => void; onPlace: (details: { hostel: string; phone: string; payment: PaymentMethod; upiApp?: UpiApp }) => void | Promise<void> }) {
  const [hostel, setHostel] = useState(initialHostel);
  const [payment, setPayment] = useState<PaymentMethod>("COD");
  const [upiApp, setUpiApp] = useState<UpiApp>("Google Pay");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const total = cart.reduce((sum, row) => sum + row.item.price * row.quantity, 0);
  const apps: { name: UpiApp; icon: string }[] = [{ name: "Google Pay", icon: "G" }, { name: "PhonePe", icon: "पे" }, { name: "Paytm", icon: "P" }, { name: "Other apps", icon: "•••" }];
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setPlacing(true);
    try {
      await onPlace({ hostel, phone: profile.phone, payment, upiApp: payment === "UPI" ? upiApp : undefined });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The order could not be placed. Please try again.");
    } finally { setPlacing(false); }
  };
  return <Modal title="Place your order" subtitle="Your order will be sent to the shop owner." onClose={onClose}><form className="checkout-old" onSubmit={submit}><div className="old-fields"><label className="wide-label"><span>HOSTEL</span><select value={hostel} onChange={(event) => setHostel(event.target.value)} required><HostelOptions /></select></label><label className="wide-label"><span>PHONE NUMBER</span><input value={displayPhone(profile.phone)} readOnly /></label></div><h3>Payment method</h3><div className="old-payment-choice"><button type="button" className={payment === "COD" ? "active" : ""} onClick={() => setPayment("COD")}>💵 Cash on delivery {payment === "COD" && <Icon name="check" size={15} />}</button><button type="button" className={payment === "UPI" ? "active" : ""} onClick={() => { setPayment("UPI"); setUpiApp("Google Pay"); }}>📱 Pay online {payment === "UPI" && <Icon name="check" size={15} />}</button></div>{payment === "UPI" && <div className="upi-app-section"><span className="upi-app-label">CHOOSE YOUR UPI APP</span><div className="upi-app-grid">{apps.map((app) => <button type="button" key={app.name} className={upiApp === app.name ? "active" : ""} onClick={() => setUpiApp(app.name)}><span className={`upi-app-icon upi-${app.name.toLowerCase().replace(" ", "-")}`}>{app.icon}</span><span>{app.name}</span>{upiApp === app.name && <Icon name="check" size={14} />}</button>)}</div><p className="upi-app-help">Pay to <b>{upiId}</b> · You’ll be taken to {upiApp} after placing the order.</p></div>}{error && <p className="checkout-error">{error}</p>}<div className="old-checkout-total"><span>Total</span><b>{money(total)}</b></div><PrimaryButton type="submit" className="full-width" disabled={placing}>{placing ? "Placing order…" : "Place order"} {!placing && <Icon name="arrow" size={16} />}</PrimaryButton></form></Modal>;
}
function OrderPlacedModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return <Modal title="✅ Order placed" subtitle="Your order has been sent to the shop owner." onClose={onClose}>
    <div className="order-placed-content"><div className="order-placed-icon"><Icon name="check" size={30} /></div><span className="order-placed-kicker">ORDER CONFIRMED</span><h3>Order is placed!</h3><p>Thanks, {order.student.split(" ")[0]}. We’ll start preparing your order now.</p><div className="placed-order-details"><div><small>ORDER ID</small><b>{order.id}</b></div><div><small>DELIVERING TO</small><b>{order.hostel}</b></div><div><small>TOTAL</small><b>{money(order.total)}</b></div><div><small>PAYMENT</small><b>{order.payment === "UPI" ? `${order.upiApp || "Online"} · pending` : "Cash on delivery"}</b></div></div><PrimaryButton className="full-width" onClick={onClose}>Back to menu <Icon name="arrow" size={16} /></PrimaryButton></div>
  </Modal>;
}

function StudentHistory({ orders, studentId, studentPhone, onClose }: { orders: Order[]; studentId?: string; studentPhone?: string; onClose: () => void }) {
  const normalizePhone = (value: string) => value.replace(/\D/g, "").slice(-10);
  const historyOrders = [...orders].filter((order) => {
    if (!studentId && !studentPhone) return true;
    return (Boolean(studentId) && order.studentId === studentId) || (Boolean(studentPhone) && normalizePhone(order.phone) === normalizePhone(studentPhone || ""));
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const confirmedOrders = historyOrders.filter((order) => order.paymentStatus === "Paid" && order.status !== "Cancelled");
  const totalSpent = confirmedOrders.reduce((sum, order) => sum + order.total, 0);
  const onlinePaid = confirmedOrders.filter((order) => order.payment === "UPI").reduce((sum, order) => sum + order.total, 0);
  const codPaid = confirmedOrders.filter((order) => order.payment === "COD").reduce((sum, order) => sum + order.total, 0);
  const paymentLabel = (status: Order["paymentStatus"]) => status === "Paid" ? "PAID" : status === "Failed" ? "PAYMENT FAILED" : status === "Cancelled" ? "PAYMENT CANCELLED" : "PAYMENT PENDING";
  const deliveryLabel = (status: Order["status"]) => status === "Out for Delivery" ? "Out for Delivery" : status;
  return <Modal title="🧾 My Order History" subtitle="What you ordered, when you ordered and how much you spent" onClose={onClose} wide className="student-history-modal"><div className="student-history-content"><div className="student-history-summary"><div><span>🧾</span><small>TOTAL ORDERS</small><strong>{historyOrders.length}</strong></div><div><span>💰</span><small>TOTAL SPENT</small><strong className="history-total-green">{money(totalSpent)}</strong></div><div><span>💳</span><small>ONLINE PAID</small><strong className="history-total-blue">{money(onlinePaid)}</strong></div><div><span>💵</span><small>COD PAID</small><strong className="history-total-orange">{money(codPaid)}</strong></div></div><p className="student-history-note">Spending totals include only payments confirmed by the shop owner.</p><div className="student-history-list">{historyOrders.map((order) => <article className={`student-history-card history-status-${order.status.toLowerCase().replace(/\s+/g, "-")}`} key={order.id}><div className="history-card-top"><div><strong>🏠 {order.hostel || "Hostel not set"}</strong><span>📅 {fullDateTime(order.createdAt)}</span><small>{order.id}</small></div><div className="history-card-amount"><strong>{money(order.total)}</strong><span className={`history-payment-status ${order.paymentStatus.toLowerCase()}`}>{paymentLabel(order.paymentStatus)}</span></div></div><div className="history-item-pills">{order.items.map((item) => <span key={`${order.id}-${item.name}`}>{item.name.includes("Maggie") ? "🍜" : "🍽️"} {item.name} × {item.quantity}</span>)}</div><div className="history-card-bottom"><span className={`history-payment-method ${order.payment.toLowerCase()}`}>{order.payment === "COD" ? "💵 Cash on Delivery" : `💳 Online Payment${order.upiApp ? ` · ${order.upiApp}` : ""}`}</span><span className={`history-delivery-status ${order.status.toLowerCase().replace(/\s+/g, "-")}`}>{order.status === "Delivered" ? "✅" : order.status === "Cancelled" ? "✕" : "⏱️"} {deliveryLabel(order.status)}</span></div></article>)}{historyOrders.length === 0 && <div className="center-empty student-history-empty"><Icon name="history" size={30} /><h3>No orders yet</h3><p>Your orders will appear here after you place them.</p></div>}</div></div></Modal>;
}
function OwnerHeader({ onMenu, menuOpen, onCloseMenu, shopOpen, shiftStartedAt, newOrderCount }: { onMenu: () => void; menuOpen: boolean; onCloseMenu: () => void; shopOpen: boolean; shiftStartedAt: string; newOrderCount: number }) { return <header className="owner-header"><div className="owner-header-brand"><MiniCup /><div><strong>Coke Station</strong><span>OWNER DASHBOARD</span><small>📅 {dashboardDate(new Date().toISOString())}</small><em>Shift started {dashboardDate(shiftStartedAt)} · {clock(shiftStartedAt)}</em></div></div><div className="owner-header-actions">{newOrderCount > 0 && <span className="new-order-pill">{newOrderCount} new {newOrderCount === 1 ? "order" : "orders"}</span>}<span className={`owner-live-dot ${shopOpen ? "" : "closed"}`} /><button className="owner-kebab" onClick={onMenu}>⋮</button>{menuOpen && <OwnerActionMenu shopOpen={shopOpen} onClose={onCloseMenu} />}</div></header>; }
function OwnerActionMenu({ onClose, shopOpen }: { onClose: () => void; shopOpen: boolean }) { return <div className="owner-action-menu"><button className={shopOpen ? "shop-menu-green" : "shop-menu-closed"} onClick={() => { window.dispatchEvent(new CustomEvent("legacy-open-shop")); onClose(); }}>{shopOpen ? "🟢 Shop Open" : "🔴 Shop Closed"}</button><button className="menu-menu-green" onClick={() => { window.dispatchEvent(new CustomEvent("legacy-open-menu")); onClose(); }}>🍽️ Menu List</button><button className="menu-menu-blue" onClick={() => { window.dispatchEvent(new CustomEvent("legacy-open-payment")); onClose(); }}>💳 Online Payment<br />Update</button><button className="menu-menu-orange" onClick={() => { window.dispatchEvent(new CustomEvent("legacy-open-scratch")); onClose(); }}>🧹 Scratch</button><button className="menu-menu-blue" onClick={() => { window.dispatchEvent(new CustomEvent("legacy-open-history")); onClose(); }}>📊 History</button><button className="menu-menu-gray" onClick={() => { window.dispatchEvent(new CustomEvent("legacy-logout")); onClose(); }}>🚪 Logout</button></div>; }

function StatCard({ icon, title, value, helper, color }: { icon: string; title: string; value: string; helper: string; color: string }) { return <div className={`owner-stat-card ${color}`}><span className="stat-emoji">{icon}</span><small>{title}</small><strong>{value}</strong><em>{helper}</em></div>; }
type DeliveryStep = "choose" | "cash" | "online" | "complete";
type DeliveryFlow = { orderId: string; step: DeliveryStep; cashAmount: string; error: string };

function OwnerOrders({ orders, paymentSettings, onPayment, onReject, onAdvance, onCompleteDelivery, onCall, onNavigate }: { orders: Order[]; paymentSettings: PaymentSettings; onPayment: (id: string, method?: PaymentMethod) => void; onReject: (id: string) => void; onAdvance: (id: string) => void; onCompleteDelivery: (id: string) => void; onCall: (phone: string) => void; onNavigate: (message: string) => void }) {
  const [deliveryFlow, setDeliveryFlow] = useState<DeliveryFlow | null>(null);
  const selectedOrder = deliveryFlow ? orders.find((order) => order.id === deliveryFlow.orderId) : undefined;
  const beginDelivery = (order: Order) => setDeliveryFlow({ orderId: order.id, step: "choose", cashAmount: String(order.total), error: "" });
  const confirmCash = () => {
    if (!selectedOrder || !deliveryFlow) return;
    if (Number(deliveryFlow.cashAmount) !== selectedOrder.total) {
      setDeliveryFlow({ ...deliveryFlow, error: `Enter the exact amount ${money(selectedOrder.total)}.` });
      return;
    }
    onPayment(selectedOrder.id, "COD");
    setDeliveryFlow({ ...deliveryFlow, step: "complete", error: "" });
  };
  const confirmOnline = () => {
    if (!selectedOrder || !deliveryFlow) return;
    onPayment(selectedOrder.id, "UPI");
    setDeliveryFlow({ ...deliveryFlow, step: "complete", error: "" });
  };
  return <section className="owner-orders-section"><h2>Current Shift Orders{orders.length > 0 && <span className="orders-total">({orders.length} total)</span>}</h2>{orders.length ? <div className="owner-order-list">{orders.map((order) => {
    const needsPayment = (order.status === "Ready" || order.status === "Out for Delivery") && order.payment === "COD" && order.paymentStatus === "Pending";
    const onlinePaymentNeedsDecision = order.payment === "UPI" && order.status !== "Cancelled" && (order.paymentStatus === "Pending" || order.paymentStatus === "Failed");
    const onlinePaymentPending = onlinePaymentNeedsDecision && order.paymentStatus === "Pending";
    const activeFlow = deliveryFlow?.orderId === order.id ? deliveryFlow : null;
    const hostelLocation = hostels.find((hostel) => hostel.name === order.hostel);
    return <article className={`owner-order-card old-owner-order ${order.status.toLowerCase().replace(/\s+/g, "-")}`} key={order.id}>
      <div className="old-order-top"><div className="old-order-title"><span className="old-hostel">🏠 {order.hostel}</span><span className={`old-payment ${order.payment.toLowerCase()}`}>{order.payment === "COD" ? "💵 COD" : "💳 UPI"}</span><span className={`old-order-status ${order.status.toLowerCase().replace(/\s+/g, "-")}`}>{order.status === "Delivered" ? "🚚 Delivered" : order.status === "Cancelled" ? "✕ Cancelled" : <><i />{order.status}</>}</span></div><div className="old-order-amount"><b>{money(order.total)}</b>{order.paymentStatus === "Paid" ? <small className="payment-received">✓ {money(order.total)} received · {order.payment === "COD" ? "💵 Cash" : "📱 UPI"}</small> : order.payment === "UPI" ? <small className={`payment-${order.paymentStatus.toLowerCase()}`}>⚠ {order.paymentStatus === "Failed" ? "PAYMENT FAILED" : order.paymentStatus === "Cancelled" ? "PAYMENT CANCELLED" : "PAYMENT PENDING"}</small> : null}{order.status === "Delivered" ? <span className="delivered-badge">✓ DELIVERED</span> : order.status === "Cancelled" ? <span className="rejected-badge">✕ REJECTED</span> : <a className="call-now" href={telHref(order.phone)} onClick={() => onCall(order.phone)}>📞 CALL NOW</a>}</div></div>
      <div className="old-order-person"><span>👤 {order.student}</span><span>· {dateTime(order.createdAt)}</span><span className="old-phone-line">📞 {order.phone}</span></div>
      <div className="owner-order-items old-items">{order.items.map((item) => <span key={item.name}>{item.quantity}× {item.name}</span>)}</div>
      {order.status !== "Delivered" && order.status !== "Cancelled" && <div className="old-call-row"><a className="call-student-link" href={telHref(order.phone)} onClick={() => onCall(order.phone)}>📞 Call Student</a><span>{order.phone}</span></div>}
      {(order.status === "Ready" || order.status === "Out for Delivery") && <div className="old-delivery-details"><div className="old-delivery-heading">🚚 DELIVERY DETAILS</div><div className="old-delivery-grid"><span>🏠 <b>{order.hostel}</b></span><span>👤 <b>{order.student}</b></span><span>📞 <b>{order.phone}</b></span><span>{order.payment === "COD" ? "💵" : "💳"} <b>{order.payment === "COD" ? "Cash on Delivery" : "Online payment"}</b></span></div></div>}
      <div className="old-owner-actions">{onlinePaymentPending && <button className="confirm-payment" onClick={() => onPayment(order.id, "UPI")}>✓ Accept order</button>}{onlinePaymentNeedsDecision && <button className="reject-order-button" onClick={() => onReject(order.id)}>✕ Reject order</button>}{!onlinePaymentNeedsDecision && order.status === "New" && <button className="old-next new-next" onClick={() => onAdvance(order.id)}>→ Mark as Preparing</button>}{order.status === "Preparing" && <button className="old-next preparing-next" onClick={() => onAdvance(order.id)}>→ Mark as Ready</button>}{order.status === "Ready" && !needsPayment && !activeFlow && <button className="old-next delivered-next" onClick={() => onAdvance(order.id)}>🚚 Mark as Delivered</button>}{order.status === "Ready" && needsPayment && !activeFlow && <button className="old-next delivered-next" onClick={() => beginDelivery(order)}>🚚 Mark as Delivered</button>}{order.status === "Out for Delivery" && !needsPayment && !activeFlow && <button className="old-next delivered-next" onClick={() => onAdvance(order.id)}>🚚 Mark as Delivered</button>}{order.status === "Out for Delivery" && needsPayment && !activeFlow && <button className="old-next delivered-next" onClick={() => beginDelivery(order)}>🚚 Mark as Delivered</button>}{(order.status === "Ready" || order.status === "Out for Delivery") && !activeFlow && (hostelLocation?.latitude !== undefined && hostelLocation.longitude !== undefined ? <button className="navigate-hostel-button" type="button" onClick={() => openHostelDirections(hostelLocation, onNavigate)}>📍 Navigate to {order.hostel}</button> : <span className="no-navigation">📍 No location for {order.hostel}</span>)}</div>
      {activeFlow && activeFlow.step === "choose" && <div className="delivery-payment-panel choose-payment"><strong>💳 Collect payment from the student first</strong><button className="cash-received-button" onClick={() => setDeliveryFlow({ ...activeFlow, step: "cash", error: "" })}>💵 Cash Received</button><button className="pay-online-button" onClick={() => setDeliveryFlow({ ...activeFlow, step: "online", error: "" })}>📱 Pay Online (UPI / QR)</button><button className="flow-cancel" onClick={() => setDeliveryFlow(null)}>Cancel</button></div>}
      {activeFlow && activeFlow.step === "cash" && <div className="delivery-payment-panel cash-payment"><strong>💵 Cash Received — enter the exact amount</strong><div className="cash-entry"><span>₹</span><input type="number" min="0" value={activeFlow.cashAmount} onChange={(event) => setDeliveryFlow({ ...activeFlow, cashAmount: event.target.value, error: "" })} /><button onClick={confirmCash}>✓ Confirm Cash Received</button></div>{activeFlow.error && <p className="payment-flow-error">{activeFlow.error}</p>}<button className="flow-back" onClick={() => setDeliveryFlow({ ...activeFlow, step: "choose", error: "" })}>← Back</button></div>}
      {activeFlow && activeFlow.step === "online" && <div className="delivery-payment-panel online-payment"><strong>📱 Pay Online — show this to the student</strong><div className="delivery-online-body"><UpiPaymentQr upiId={paymentSettings.upiId} amount={order.total} /><div><span>AMOUNT TO COLLECT</span><b>{money(order.total)}</b><span>UPI ID</span><strong>{paymentSettings.upiId}</strong></div></div><button className="confirm-online-button" onClick={confirmOnline}>✓ Confirm Online Payment Received</button><button className="flow-back" onClick={() => setDeliveryFlow({ ...activeFlow, step: "choose", error: "" })}>← Back</button></div>}
      {activeFlow && activeFlow.step === "complete" && <div className="delivery-payment-panel complete-payment"><strong>✓ {money(order.total)} received via {order.payment === "COD" ? "💵 Cash" : "💳 UPI"}</strong><div><button className="complete-delivery-button" onClick={() => { onCompleteDelivery(order.id); setDeliveryFlow(null); }}>🚚 Complete Mark as Delivered</button><button className="flow-cancel" onClick={() => setDeliveryFlow(null)}>Cancel</button></div></div>}
    </article>;
  })}</div> : <div className="owner-empty-state"><span>📫</span><h3>No orders yet</h3><p>Orders from students will appear here</p></div>}</section>;
}
function MenuListModal({ menu, onClose, onToggle, onAdd }: { menu: MenuItem[]; onClose: () => void; onToggle: (id: string) => void; onAdd: (item: MenuItem) => void }) { const [adding, setAdding] = useState(false); const [form, setForm] = useState({ name: "", emoji: "🍽️", category: "Snacks" as Exclude<Category, "All">, size: "Regular", price: "" }); const available = menu.filter((item) => item.available).length; return <Modal title="🍽️ Menu List" subtitle={`${available} available · ${menu.length - available} out of stock`} onClose={onClose} wide className="list-modal"><button className="add-food-button" onClick={() => setAdding(!adding)}>{adding ? "× Close Add Item Form" : "+ Add New Food Item"}</button>{adding && <form className="new-food-form" onSubmit={(event) => { event.preventDefault(); if (!form.name || !form.price) return; onAdd({ id: `food-${Date.now()}`, name: form.name, emoji: form.emoji, category: form.category, size: form.size, price: Number(form.price), available: true }); setForm({ name: "", emoji: "🍽️", category: "Snacks", size: "Regular", price: "" }); setAdding(false); }}><h3>New Food Item</h3><div className="new-food-grid"><label><span>ITEM NAME</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Chicken Roll" required /></label><label><span>EMOJI</span><input value={form.emoji} onChange={(event) => setForm({ ...form, emoji: event.target.value })} /></label><label><span>CATEGORY</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as Exclude<Category, "All"> })}><option>Maggie</option><option>Eggs</option><option>Sandwiches</option><option>Hot Drinks</option><option>Cold Drinks</option><option>Snacks</option></select></label><label><span>SIZE / SERVING</span><input value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} /></label><label><span>PRICE (₹)</span><input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="50" required /></label></div><button className="green-save-button" type="submit">Add Item to Student Menu</button></form>}<div className="owner-menu-modal-list">{menu.map((item) => <div className={`owner-menu-modal-row ${!item.available ? "row-out" : ""}`} key={item.id}><span className="owner-item-emoji">{item.emoji}</span><div><b>{item.name}</b><small>{item.category} · {item.size} · {money(item.price)}</small></div><button className={`availability-pill ${item.available ? "available" : "out"}`} onClick={() => onToggle(item.id)}>{item.available ? "✓ Available" : "× Out of Stock"}</button></div>)}</div></Modal>; }

function PaymentModal({ settings, onClose, onSave }: { settings: PaymentSettings; onClose: () => void; onSave: (next: PaymentSettings) => void | Promise<void> }) {
  const [tab, setTab] = useState<"upi" | "qr">("upi");
  const [upi, setUpi] = useState(settings.upiId);
  const [qrCode, setQrCode] = useState<string | null>(settings.qrCode);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const uploadQr = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("QR image must be smaller than 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setQrCode(typeof reader.result === "string" ? reader.result : null); setError(""); };
    reader.readAsDataURL(file);
  };
  const save = async () => {
    setError("");
    const cleanUpi = upi.trim();
    if (!/^[^\s@]+@[^\s@]+$/.test(cleanUpi)) { setError("Enter a valid UPI ID, for example stall@upi."); setTab("upi"); return; }
    setSaving(true);
    try {
      await onSave({ upiId: cleanUpi, qrCode });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Payment settings could not be saved.");
    } finally { setSaving(false); }
  };
  return <Modal title="💳 Online Payment Update" subtitle="UPI ID and QR code used for delivery-time payments" onClose={onClose}><div className="payment-tabs"><button type="button" className={tab === "upi" ? "active blue" : ""} onClick={() => setTab("upi")}>🧾 UPI Update</button><button type="button" className={tab === "qr" ? "active green" : ""} onClick={() => setTab("qr")}>🖼️ QR Code Update</button></div>{tab === "upi" ? <div className="payment-update-form"><label><span>FOOD STALL UPI ID</span><input value={upi} onChange={(event) => setUpi(event.target.value)} placeholder="stall@upi" autoComplete="off" /></label><p>This UPI ID is shown to the student when they pay online.</p><button className="blue-save-button" type="button" onClick={save} disabled={saving}>{saving ? "Saving…" : saved ? "✓ UPI ID Saved" : "💾 Save UPI ID"}</button>{error && <p className="payment-error">{error}</p>}</div> : <div className="qr-update-form"><span className="qr-label">FOOD STALL UPI QR CODE</span><div className="qr-preview">{qrCode ? <img className="uploaded-qr" src={qrCode} alt="Uploaded food stall UPI QR code" /> : <FakeQR />}<small>{qrCode ? "✓ Current QR code preview" : "No QR code uploaded yet"}</small></div><label className="replace-qr">🔄 {qrCode ? "Replace QR Code" : "Upload QR Code"}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadQr} /></label>{qrCode && <button className="remove-qr" type="button" onClick={() => setQrCode(null)}>Remove QR code</button>}<button className="green-save-button" type="button" onClick={save} disabled={saving}>{saving ? "Saving…" : saved ? "✓ QR Code Saved" : "💾 Save QR Code"}</button>{error && <p className="payment-error">{error}</p>}</div>}</Modal>;
}
function FakeQR() { const bits = [1,1,1,0,1,0,1,1,0,1,0,1,1,1,0,0,1,0,1,1,0,1,1,0,1,0,0,1,0,1,1,1,1,0,1,0,1,1,0,0,0,1,1,0,1,0,1,1,1,0,0,1,0,1,1,0,1,1,0,1,0,0,1,1,0,1,1,0,0,1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,1,0,0,1,1,0,1,1,0]; return <div className="fake-qr-grid">{bits.map((bit, i) => <i className={bit ? "on" : ""} key={i} />)}</div>; }
// Builds a standard UPI deep-link URI with the exact order amount baked in, so
// scanning it pre-fills the amount — no payment gateway/provider is involved,
// this is just the plain UPI URI scheme every UPI app already understands.
function buildUpiUri(upiId: string, amount: number) {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(SHOP_NAME)}&am=${amount}&cu=INR`;
}
function UpiPaymentQr({ upiId, amount }: { upiId: string; amount: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setDataUrl(null);
    QRCode.toDataURL(buildUpiUri(upiId, amount), { margin: 1, width: 220 })
      .then((url) => { if (!cancelled) setDataUrl(url); })
      .catch(() => { if (!cancelled) setDataUrl(null); });
    return () => { cancelled = true; };
  }, [upiId, amount]);
  return dataUrl ? <img className="upi-dynamic-qr" src={dataUrl} alt={`Scan to pay ${money(amount)} via UPI to ${upiId}`} /> : <FakeQR />;
}
function ConfirmModal({ kind, shopOpen = true, onClose, onConfirm }: { kind: "shop" | "scratch"; shopOpen?: boolean; onClose: () => void; onConfirm: () => void }) { const shop = kind === "shop"; const closing = shop && shopOpen; return <Modal title={shop ? (closing ? "Close Coke Station?" : "Open Coke Station?") : "Scratch and start a new shift?"} onClose={onClose} className={`confirm-modal ${shop ? (closing ? "red-confirm" : "green-confirm-modal") : "orange-confirm"}`}><div className="confirm-content"><div className={`confirm-icon ${shop ? (closing ? "red-status" : "green-status") : "orange-status"}`}><span /></div><p>{shop ? (closing ? "Students will immediately see the Shop Closed screen and will not be able to browse the menu or place an order." : "Students will be able to browse the menu and place orders as soon as the shop opens.") : "Shift orders, Online Received, COD Received and Grand Total will all return to zero. Previous orders and money records will remain safely available in History."}</p><button className={shop && closing ? "red-confirm-button" : shop ? "green-confirm-button" : "orange-confirm-button"} onClick={onConfirm}>{shop ? (closing ? "Yes, Close Shop" : "Yes, Open Shop") : "Yes, Scratch Everything to Zero"}</button><button className="cancel-confirm" onClick={onClose}>Cancel</button></div></Modal>; }

type ShopSession = { id: string; openedAt: string; closedAt: string | null };
// Every count for a session is derived live from the real orders list — never
// stored as a separate counter — so it can't drift out of sync the way the
// old locally-cached shift.orderCount fields could.
function computeSessionStats(session: { openedAt: string; closedAt: string | null }, orders: Order[]) {
  const start = new Date(session.openedAt).getTime();
  const end = session.closedAt ? new Date(session.closedAt).getTime() : Infinity;
  const sessionOrders = orders.filter((order) => { const t = new Date(order.createdAt).getTime(); return t >= start && t < end; });
  const confirmed = sessionOrders.filter((order) => order.status !== "Cancelled" && order.paymentStatus === "Paid");
  const online = confirmed.filter((order) => order.payment === "UPI").reduce((sum, order) => sum + order.total, 0);
  const cod = confirmed.filter((order) => order.payment === "COD").reduce((sum, order) => sum + order.total, 0);
  const pending = sessionOrders.filter((order) => order.paymentStatus === "Pending").length;
  return { orderCount: sessionOrders.length, online, cod, total: online + cod, pending };
}
type HistoryExportRow = { session: string; opened: string; closed: string; orders: number; online: number; cod: number; total: number; pending: number };
type HistorySummary = { allOrders: number; onlineReceived: number; codReceived: number; grandTotal: number };
// jsPDF's built-in fonts don't include the ₹ glyph (it renders as a blank
// box), so the PDF export writes "Rs." instead. The on-screen UI and the
// Excel export both keep using money()/₹ as before.
function moneyForPdf(value: number) { return `Rs. ${value.toLocaleString("en-IN")}`; }
async function downloadHistoryPdf(summary: HistorySummary, rows: HistoryExportRow[]) {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = autoTableModule.default;
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.text("Order History", 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(130);
  doc.text(`${SHOP_NAME} · Generated ${new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date())}`, 14, 22);
  doc.setTextColor(20);
  doc.setFontSize(10);
  doc.text(`All Orders: ${summary.allOrders}      Online Received: ${moneyForPdf(summary.onlineReceived)}      COD Received: ${moneyForPdf(summary.codReceived)}      Grand Total: ${moneyForPdf(summary.grandTotal)}`, 14, 30);
  autoTable(doc, {
    startY: 35,
    head: [["Session", "Opened", "Closed", "Orders", "Online", "COD", "Total", "Pending"]],
    body: rows.map((row) => [row.session, row.opened, row.closed, String(row.orders), moneyForPdf(row.online), moneyForPdf(row.cod), moneyForPdf(row.total), String(row.pending)]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [175, 17, 23] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  doc.save("Coke_Station_Order_History.pdf");
}
async function downloadHistoryExcel(summary: HistorySummary, rows: HistoryExportRow[]) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const bold = { fontWeight: "bold" as const };
  const money0 = "₹#,##0";
  const data = [
    [{ value: "Coke Station — Order History", fontSize: 14, ...bold }],
    [{ value: `Generated: ${new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date())}` }],
    [],
    [{ value: "All Orders", ...bold }, { value: "Online Received", ...bold }, { value: "COD Received", ...bold }, { value: "Grand Total", ...bold }],
    [{ value: summary.allOrders, type: Number }, { value: summary.onlineReceived, type: Number, format: money0 }, { value: summary.codReceived, type: Number, format: money0 }, { value: summary.grandTotal, type: Number, format: money0 }],
    [],
    [{ value: "Session", ...bold }, { value: "Opened", ...bold }, { value: "Closed", ...bold }, { value: "Orders", ...bold }, { value: "Online", ...bold }, { value: "COD", ...bold }, { value: "Total", ...bold }, { value: "Pending", ...bold }],
    ...rows.map((row) => [
      { value: row.session },
      { value: row.opened },
      { value: row.closed },
      { value: row.orders, type: Number },
      { value: row.online, type: Number, format: money0 },
      { value: row.cod, type: Number, format: money0 },
      { value: row.total, type: Number, format: money0 },
      { value: row.pending, type: Number },
    ]),
  ];
  await (await writeXlsxFile(data, { sheet: "Order History" })).toFile("Coke_Station_Order_History.xlsx");
}
function HistoryDownloadButtons({ summary, rows }: { summary: HistorySummary; rows: HistoryExportRow[] }) {
  const [busy, setBusy] = useState<"pdf" | "xlsx" | null>(null);
  const runExport = async (kind: "pdf" | "xlsx") => {
    if (busy) return;
    setBusy(kind);
    try {
      if (kind === "pdf") await downloadHistoryPdf(summary, rows);
      else await downloadHistoryExcel(summary, rows);
    } catch {
      window.alert(`Could not generate the ${kind === "pdf" ? "PDF" : "Excel"} file. Please try again.`);
    } finally {
      setBusy(null);
    }
  };
  return <div className="history-download-group"><button type="button" className="history-download-button pdf" disabled={busy !== null} onClick={() => runExport("pdf")} title="Download PDF" aria-label="Download PDF">{busy === "pdf" ? "…" : "DP"}</button><button type="button" className="history-download-button xlsx" disabled={busy !== null} onClick={() => runExport("xlsx")} title="Download Excel" aria-label="Download Excel">{busy === "xlsx" ? "…" : "DX"}</button></div>;
}
function SalesHistoryModal({ orders, ownerPin, shifts, shopOpen, shiftStartedAt, onClose, onDelete }: { orders: Order[]; ownerPin: string; shifts: Shift[]; shopOpen: boolean; shiftStartedAt: string; onClose: () => void; onDelete: (id: string) => void }) {
  // Session open/close boundaries are the shared source of truth in Supabase
  // (owner_list_coke_shop_sessions) — every order count below is computed
  // live from the real orders list against those boundaries. This avoids the
  // old bug where locally-cached, per-device shift counters could go out of
  // sync with — or duplicate — the real order data.
  const [sessions, setSessions] = useState<ShopSession[] | null>(supabase ? null : []);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!supabase || !ownerPin) { if (!cancelled) setSessions([]); return; }
      const { data, error } = await supabase.rpc("owner_list_coke_shop_sessions", { p_pin: ownerPin });
      if (cancelled) return;
      if (error || !Array.isArray(data)) { setLoadError("Could not load synced session history — showing local data only."); setSessions([]); return; }
      setSessions((data as Record<string, unknown>[]).map((row) => ({ id: String(row.id), openedAt: String(row.opened_at), closedAt: row.closed_at ? String(row.closed_at) : null })));
    };
    void load();
    return () => { cancelled = true; };
  }, [ownerPin]);
  const hideSession = async (id: string) => {
    if (!window.confirm("Delete this history record? This cannot be undone.")) return;
    if (supabase && ownerPin) {
      const { error } = await supabase.rpc("owner_hide_session", { p_session_id: id, p_owner_pin: ownerPin });
      if (!error) { setSessions((current) => (current || []).filter((session) => session.id !== id)); return; }
    }
    onDelete(id);
  };
  const usingSyncedSessions = supabase && (sessions?.length ?? 0) > 0;
  const completedSessions = usingSyncedSessions ? (sessions || []).filter((session) => session.closedAt).sort((a, b) => b.openedAt.localeCompare(a.openedAt)) : [];
  const currentSession = usingSyncedSessions ? (sessions || []).find((session) => !session.closedAt) : null;
  const liveStats = shopOpen && currentSession ? computeSessionStats(currentSession, orders) : null;
  const completedSessionStats = completedSessions.map((session) => ({ session, stats: computeSessionStats(session, orders) }));
  const legacyCompletedShifts = usingSyncedSessions ? [] : shifts.filter((shift) => shift.closedAt);
  const legacyLiveOrders = !usingSyncedSessions && shopOpen ? orders.filter((order) => new Date(order.createdAt).getTime() >= new Date(shiftStartedAt).getTime()) : [];
  // The totals below mirror exactly what's still visible in the list further
  // down — summed from the same live-computed session stats (or, offline,
  // the same cached legacy shift totals) rather than the full order list.
  // That way clearing a history record with × immediately reduces these
  // totals too, instead of them always reflecting every order ever placed.
  const all = usingSyncedSessions
    ? (liveStats ? liveStats.orderCount : 0) + completedSessionStats.reduce((sum, entry) => sum + entry.stats.orderCount, 0)
    : legacyLiveOrders.length + legacyCompletedShifts.reduce((sum, shift) => sum + shift.orderCount, 0);
  const online = usingSyncedSessions
    ? (liveStats ? liveStats.online : 0) + completedSessionStats.reduce((sum, entry) => sum + entry.stats.online, 0)
    : legacyLiveOrders.filter((order) => order.payment === "UPI" && order.paymentStatus === "Paid").reduce((sum, order) => sum + order.total, 0) + legacyCompletedShifts.reduce((sum, shift) => sum + shift.online, 0);
  const cod = usingSyncedSessions
    ? (liveStats ? liveStats.cod : 0) + completedSessionStats.reduce((sum, entry) => sum + entry.stats.cod, 0)
    : legacyLiveOrders.filter((order) => order.payment === "COD" && order.paymentStatus === "Paid").reduce((sum, order) => sum + order.total, 0) + legacyCompletedShifts.reduce((sum, shift) => sum + shift.cod, 0);
  // Mirrors exactly what's rendered below, in the same order, so the PDF/Excel
  // downloads can never contain anything not currently shown in History.
  const historyRows: HistoryExportRow[] = usingSyncedSessions
    ? [
        ...(shopOpen && currentSession && liveStats ? [{ session: "Current Open Session", opened: `${shortDate(currentSession.openedAt)} · ${clock(currentSession.openedAt)}`, closed: "Running (shop still open)", orders: liveStats.orderCount, online: liveStats.online, cod: liveStats.cod, total: liveStats.total, pending: liveStats.pending }] : []),
        ...completedSessionStats.map(({ session, stats }) => ({ session: "Completed Shop Session", opened: dateTime(session.openedAt), closed: dateTime(session.closedAt || session.openedAt), orders: stats.orderCount, online: stats.online, cod: stats.cod, total: stats.total, pending: stats.pending })),
      ]
    : [
        ...(shopOpen ? [{ session: "Current Open Session", opened: `${shortDate(shiftStartedAt)} · ${clock(shiftStartedAt)}`, closed: "Running (shop still open)", orders: legacyLiveOrders.length, online: legacyLiveOrders.filter((order) => order.payment === "UPI" && order.paymentStatus === "Paid").reduce((sum, order) => sum + order.total, 0), cod: legacyLiveOrders.filter((order) => order.payment === "COD" && order.paymentStatus === "Paid").reduce((sum, order) => sum + order.total, 0), pending: legacyLiveOrders.filter((order) => order.paymentStatus === "Pending").length, total: 0 }] : []),
        ...legacyCompletedShifts.map((shift) => ({ session: "Completed Shop Session", opened: dateTime(shift.openedAt), closed: dateTime(shift.closedAt || shift.openedAt), orders: shift.orderCount, online: shift.online, cod: shift.cod, total: shift.total, pending: shift.pending })),
      ].map((row) => ({ ...row, total: row.total || row.online + row.cod }));
  const historySummary: HistorySummary = { allOrders: all, onlineReceived: online, codReceived: cod, grandTotal: online + cod };
  return <Modal title="📊 Sales History" subtitle="One history record for every Shop Open → Shop Closed session" onClose={onClose} wide className="history-modal"><div className="history-modal-toolbar"><span>Daily summary · confirmed payments only</span><HistoryDownloadButtons summary={historySummary} rows={historyRows} /></div><div className="history-stat-grid"><div><small>ALL ORDERS</small><b>{all}</b></div><div><small>ONLINE RECEIVED</small><b className="blue-text">{money(online)}</b></div><div><small>COD RECEIVED</small><b className="orange-text">{money(cod)}</b></div><div><small>GRAND TOTAL</small><b className="green-text">{money(online + cod)}</b></div></div>{loadError && <p className="history-load-error">{loadError}</p>}<div className="history-session-list">{sessions === null && <p className="history-loading">Loading synced session history…</p>}{usingSyncedSessions ? <>{shopOpen && currentSession && liveStats && <div className="history-session current"><div className="session-head"><div><b><span className="green-status-dot" /> Current Open Session</b><small>Opened: {shortDate(currentSession.openedAt)} · {clock(currentSession.openedAt)}</small><em>Running now — closes when owner presses Shop Closed</em></div><strong>{liveStats.orderCount} {liveStats.orderCount === 1 ? "order" : "orders"}</strong></div><div className="session-money"><span>ONLINE <b>{money(liveStats.online)}</b><small>confirmed</small></span><span>COD <b>{money(liveStats.cod)}</b><small>confirmed</small></span><span>TOTAL <b>{money(liveStats.total)}</b><small>{liveStats.pending} pending</small></span></div></div>}{completedSessionStats.map(({ session, stats }) => <div className="history-session" key={session.id}><div className="session-head"><div><b>🔒 Completed Shop Session</b><small>Opened: {dateTime(session.openedAt)}</small><small>Closed: {dateTime(session.closedAt || session.openedAt)}</small></div><div className="session-actions"><strong>{stats.orderCount} {stats.orderCount === 1 ? "order" : "orders"}</strong><button onClick={() => hideSession(session.id)}>×</button></div></div><div className="session-money"><span>ONLINE <b className="blue-text">{money(stats.online)}</b><small>{stats.online ? "confirmed" : "0 confirmed"}</small></span><span>COD <b className="orange-text">{money(stats.cod)}</b><small>{stats.cod ? "confirmed" : "0 confirmed"}</small></span><span>TOTAL <b className="green-text">{money(stats.total)}</b><small>{stats.pending} pending</small></span></div></div>)}</> : <>{shopOpen && <div className="history-session current"><div className="session-head"><div><b><span className="green-status-dot" /> Current Open Session</b><small>Opened: {shortDate(shiftStartedAt)} · {clock(shiftStartedAt)}</small><em>Running now — closes when owner presses Shop Closed</em></div><strong>{legacyLiveOrders.length} orders</strong></div></div>}{legacyCompletedShifts.map((shift) => <div className="history-session" key={shift.id}><div className="session-head"><div><b>🔒 Completed Shop Session</b><small>Opened: {dateTime(shift.openedAt)}</small><small>Closed: {dateTime(shift.closedAt || shift.openedAt)}</small></div><div className="session-actions"><strong>{shift.orderCount} {shift.orderCount === 1 ? "order" : "orders"}</strong><button onClick={() => hideSession(shift.id)}>×</button></div></div><div className="session-money"><span>ONLINE <b className="blue-text">{money(shift.online)}</b><small>{shift.online ? "confirmed" : "0 confirmed"}</small></span><span>COD <b className="orange-text">{money(shift.cod)}</b><small>{shift.cod ? "confirmed" : "0 confirmed"}</small></span><span>TOTAL <b className="green-text">{money(shift.total)}</b><small>{shift.pending} pending</small></span></div></div>)}</>}</div></Modal>;
}
function OwnerDashboard({ menu, orders, shifts, shopOpen, ownerPin, paymentSettings, shiftStartedAt, onShop, onScratch, onMenu, onPayment, onHistory, onLogout, onToggle, onAdd, onPaymentSave, onAdvance, onPay, onReject, onCompleteDelivery, onCall, onNavigate, onDeleteShift }: { menu: MenuItem[]; orders: Order[]; shifts: Shift[]; shopOpen: boolean; ownerPin: string; paymentSettings: PaymentSettings; shiftStartedAt: string; onShop: () => void | Promise<void>; onScratch: () => void; onMenu: () => void; onPayment: () => void; onHistory: () => void; onLogout: () => void; onToggle: (id: string) => void; onAdd: (item: MenuItem) => void; onPaymentSave: (settings: PaymentSettings) => void | Promise<void>; onAdvance: (id: string) => void; onPay: (id: string, method?: PaymentMethod) => void; onReject: (id: string) => void; onCompleteDelivery: (id: string) => void; onCall: (phone: string) => void; onNavigate: (message: string) => void; onDeleteShift: (id: string) => void }) {
  const [actionMenu, setActionMenu] = useState(false);
  const [modal, setModal] = useState<"shop" | "scratch" | "menu" | "payment" | "history" | null>(null);
  useEffect(() => {
    const pairs: [string, () => void][] = [["legacy-open-shop", () => setModal("shop")], ["legacy-open-menu", () => setModal("menu")], ["legacy-open-payment", () => setModal("payment")], ["legacy-open-scratch", () => setModal("scratch")], ["legacy-open-history", () => setModal("history")], ["legacy-logout", onLogout]];
    const listeners = pairs.map(([name, handler]) => { window.addEventListener(name, handler); return [name, handler] as const; });
    return () => listeners.forEach(([name, handler]) => window.removeEventListener(name, handler));
  }, [onLogout]);
  const currentShiftOrders = orders.filter((order) => new Date(order.createdAt).getTime() >= new Date(shiftStartedAt).getTime());
  const paidOnline = currentShiftOrders.filter((order) => order.payment === "UPI" && order.paymentStatus === "Paid" && order.status !== "Cancelled").reduce((sum, order) => sum + order.total, 0);
  const paidCod = currentShiftOrders.filter((order) => order.payment === "COD" && order.paymentStatus === "Paid" && order.status !== "Cancelled").reduce((sum, order) => sum + order.total, 0);
  return <div className="owner-page"><OwnerHeader shopOpen={shopOpen} shiftStartedAt={shiftStartedAt} newOrderCount={currentShiftOrders.filter((order) => order.status === "New").length} onMenu={() => setActionMenu(!actionMenu)} menuOpen={actionMenu} onCloseMenu={() => setActionMenu(false)} /><main className="owner-dashboard-main"><div className="owner-stat-grid"><StatCard icon="📋" title="SHIFT ORDERS" value={String(currentShiftOrders.length)} helper={`since ${clock(shiftStartedAt)}`} color="neutral" /><StatCard icon="💳" title="ONLINE RECEIVED" value={money(paidOnline)} helper={`${currentShiftOrders.filter((order) => order.payment === "UPI" && order.paymentStatus === "Paid").length} confirmed this shift`} color="blue" /><StatCard icon="💵" title="COD RECEIVED" value={money(paidCod)} helper={`${currentShiftOrders.filter((order) => order.payment === "COD" && order.paymentStatus === "Paid").length} confirmed this shift`} color="orange" /><StatCard icon="💰" title="GRAND TOTAL" value={money(paidOnline + paidCod)} helper="current shift · confirmed only" color="green" /></div><OwnerOrders orders={currentShiftOrders} paymentSettings={paymentSettings} onPayment={onPay} onReject={onReject} onAdvance={onAdvance} onCompleteDelivery={onCompleteDelivery} onCall={onCall} onNavigate={onNavigate} /></main>{modal === "shop" && <ConfirmModal kind="shop" shopOpen={shopOpen} onClose={() => setModal(null)} onConfirm={() => { onShop(); setModal(null); }} />}{modal === "scratch" && <ConfirmModal kind="scratch" onClose={() => setModal(null)} onConfirm={() => { onScratch(); setModal(null); }} />}{modal === "menu" && <MenuListModal menu={menu} onClose={() => setModal(null)} onToggle={onToggle} onAdd={onAdd} />}{modal === "payment" && <PaymentModal settings={paymentSettings} onClose={() => setModal(null)} onSave={async (next) => { await onPaymentSave(next); setModal(null); }} />}{modal === "history" && <SalesHistoryModal orders={orders} ownerPin={ownerPin} shifts={shifts} shopOpen={shopOpen} shiftStartedAt={shiftStartedAt} onClose={() => setModal(null)} onDelete={onDeleteShift} />}</div>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [ownerPin, setOwnerPin] = useState("");
  const [profile, setProfile] = useState<StudentProfile>(emptyProfile);
  const [studentNotification, setStudentNotification] = useState<StudentNotification | null>(null);
  const studentOrderStatuses = useRef<Record<string, Order["status"]>>({});
  const studentOrderSnapshotReady = useRef(false);
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [menu, setMenu] = useState<MenuItem[]>(() => read("legacy-coke-menu", defaultMenu));
  const [orders, setOrders] = useState<Order[]>(() => read("legacy-coke-orders", []));
  const [shifts, setShifts] = useState<Shift[]>(() => read("legacy-coke-shifts", defaultShifts));
  const [shopOpen, setShopOpen] = useState<boolean>(() => read("legacy-coke-shop", true));
  const [backendShiftStartedAt, setBackendShiftStartedAt] = useState<string | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(() => read("legacy-coke-payment-settings", defaultPaymentSettings));
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [cartByAccount, setCartByAccount] = useState<Record<string, { item: MenuItem; quantity: number }[]>>(() => read("legacy-coke-carts", {}));
  const accountKey = profile.id ? `user:${profile.id}` : profile.phone ? `phone:${normalizeIndianPhone(profile.phone)}` : "guest";
  const activeAccountKey = useRef(accountKey);
  const currentShift = shifts.find((shift) => !shift.closedAt);
  const shiftStartedAt = backendShiftStartedAt || currentShift?.openedAt || shifts[0]?.openedAt || new Date().toISOString();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutHostel, setCheckoutHostel] = useState("");
  const [orderPlaced, setOrderPlaced] = useState<Order | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => { window.localStorage.setItem("legacy-coke-menu", JSON.stringify(menu)); }, [menu]);
  useEffect(() => { window.localStorage.setItem("legacy-coke-orders", JSON.stringify(orders)); }, [orders]);
  useEffect(() => { window.localStorage.setItem("legacy-coke-shifts", JSON.stringify(shifts)); }, [shifts]);
  useEffect(() => { window.localStorage.setItem("legacy-coke-shop", JSON.stringify(shopOpen)); }, [shopOpen]);
  useEffect(() => { window.localStorage.setItem("legacy-coke-payment-settings", JSON.stringify(paymentSettings)); }, [paymentSettings]);
  // Load the current owner payment settings when the owner signs in.
  useEffect(() => {
    const client = supabase;
    if (!client || !ownerPin) return;
    const loadPaymentSettings = async () => {
      const { data } = await client.rpc("owner_get_shop_payment_settings", { p_owner_pin: ownerPin });
      const row = Array.isArray(data) ? data[0] : data;
      if (row && typeof row.upi_id === "string") setPaymentSettings({ upiId: row.upi_id, qrCode: typeof row.qr_code === "string" ? row.qr_code : null });
    };
    void loadPaymentSettings();
  }, [ownerPin]);
  // Students always receive the latest public UPI destination, without receiving the QR code.
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;
    const loadStudentUpi = async () => {
      const { data } = await client.rpc("get_student_upi_id");
      if (!cancelled && typeof data === "string" && data.trim()) setPaymentSettings((current) => ({ ...current, upiId: data.trim() }));
    };
    void loadStudentUpi();
    const timer = window.setInterval(() => { void loadStudentUpi(); }, 3000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);
  // Shop status is shared through Supabase when the status migration is installed;
  // localStorage remains a fallback for the offline/reference preview.
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;
    const loadShopStatus = async () => {
      const { data } = await client.from("coke_shop_status").select("is_open, shift_started_at").eq("id", 1).maybeSingle();
      if (!cancelled && data && typeof data.is_open === "boolean") {
        setShopOpen(data.is_open);
        if (typeof data.shift_started_at === "string" && data.shift_started_at) setBackendShiftStartedAt(data.shift_started_at);
      }
    };
    void loadShopStatus();
    const timer = window.setInterval(() => { void loadShopStatus(); }, 2500);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);
  // Save the active account's basket under its own key. This prevents one student's
  // basket from appearing when another student logs in on the same browser.
  useEffect(() => {
    const key = activeAccountKey.current;
    setCartByAccount((current) => ({ ...current, [key]: cart }));
  }, [cart]);
  useEffect(() => { window.localStorage.setItem("legacy-coke-carts", JSON.stringify(cartByAccount)); }, [cartByAccount]);
  // Load the next student's basket whenever the authenticated account changes.
  useEffect(() => {
    activeAccountKey.current = accountKey;
    setCart(cartByAccount[accountKey] || []);
  }, [accountKey]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2800); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => { if (!studentNotification) return; const timer = window.setTimeout(() => setStudentNotification(null), 5600); return () => window.clearTimeout(timer); }, [studentNotification?.id]);
  // Menu is shared through Supabase; localStorage is only a fallback until the migration is run.
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const shouldSync = (screen === "owner-dashboard" && Boolean(ownerPin)) || (screen === "student-menu" && Boolean(profile.id));
    if (!shouldSync) return;
    let cancelled = false;
    const loadMenu = async () => {
      const result = screen === "owner-dashboard"
        ? await client.rpc("owner_get_coke_station_menu", { p_pin: ownerPin })
        : await client.from("coke_station_menu").select("id, name, category, size, price, emoji, available").order("created_at", { ascending: true });
      if (!cancelled && !result.error && result.data) setMenu((result.data as Record<string, unknown>[]).map(menuItemFromDatabase));
    };
    void loadMenu();
    const timer = window.setInterval(() => { void loadMenu(); }, 3000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [screen, ownerPin, profile.id]);
  // An item marked out of stock on the owner's device is removed from any open student cart.
  useEffect(() => {
    setCart((current) => current.filter((row) => {
      const latest = menu.find((item) => item.id === row.item.id);
      return !latest || latest.available;
    }));
  }, [menu]);

  const notify = (message: string) => setToast(message);
  const hydrateProfile = async (session: SupabaseSession) => {
    const user = session.user;
    const metadata = user.user_metadata as { full_name?: string; name?: string; student_name?: string; fullName?: string; studentName?: string } | undefined;
    const fallback: StudentProfile = {
      id: user.id,
      name: metadata?.full_name?.trim() || metadata?.name?.trim() || metadata?.student_name?.trim() || metadata?.fullName?.trim() || metadata?.studentName?.trim() || "Vishwa S",
      phone: user.phone || "",
      hostel: "",
      room: "",
    };
    if (!supabase) {
      setProfile(fallback);
      return;
    }
    try {
      const result = await supabase
        .from("coke_student_profiles")
        .select("id, full_name, phone, default_hostel, room")
        .eq("id", user.id)
        .maybeSingle();
      const row = result.data as { id?: string; full_name?: string; phone?: string; default_hostel?: string; room?: string } | null;
      const next: StudentProfile = {
        id: user.id,
        name: row?.full_name?.trim() || fallback.name,
        // The source of truth is Auth's phone number when the profile row is old.
        phone: user.phone || row?.phone || fallback.phone,
        hostel: row?.default_hostel && hostels.some((hostel) => hostel.name === row.default_hostel) ? row.default_hostel : fallback.hostel,
        room: row?.room || fallback.room,
      };
      setProfile(next);
      // This repairs accounts created before the profile table/trigger existed.
      const repair = await supabase.from("coke_student_profiles").upsert({
        id: user.id,
        full_name: next.name,
        phone: next.phone,
        default_hostel: next.hostel === "Select your hostel" ? "" : next.hostel,
        room: next.room,
      }, { onConflict: "id" });
      if (repair.error && !["42P01", "PGRST205"].includes(repair.error.code || "")) console.warn("Could not repair student profile", repair.error.message);
    } catch (caught) {
      // Profile details should still render from Auth if the optional table is not installed yet.
      setProfile(fallback);
      console.warn("Could not load Coke Station profile", caught);
    }
  };

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;
    const restoreSession = async () => {
      const { data } = await client.auth.getSession();
      if (!cancelled && data.session) {
        await hydrateProfile(data.session);
        if (!cancelled) setScreen("student-menu");
      }
    };
    void restoreSession();
    const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setCart([]);
        setCartOpen(false);
        setCheckoutOpen(false);
        setStudentNotification(null);
        studentOrderStatuses.current = {};
        studentOrderSnapshotReady.current = false;
        setProfile(emptyProfile);
        setScreen("landing");
      } else if (session) {
        // Supabase recommends deferring follow-up queries from this callback.
        window.setTimeout(() => { if (!cancelled) void hydrateProfile(session); }, 0);
        setScreen("student-menu");
      }
    });
    return () => { cancelled = true; authListener.subscription.unsubscribe(); };
  }, []);

  const handleStudentAuth = async (input: StudentAuthInput) => {
    const phone = normalizeIndianPhone(input.phone);
    if (!/^\+91\d{10}$/.test(phone)) throw new Error("Enter a valid 10-digit Indian mobile number.");
    if (!supabaseConfigured || !supabase) {
      if (isHostedEnvironment()) throw new Error("Cloud backend is not configured on this deployment. Add VITE_SUPABASE_ANON_KEY in Netlify and redeploy.");
      // Keeps the reference UI usable locally until the public anon key is added.
      setProfile({ ...emptyProfile, name: input.name || "Vishwa S", phone });
      setScreen("student-menu");
      notify("Demo account loaded — connect Supabase for saved accounts");
      return;
    }
    if (input.register) {
      const { data, error } = await supabase.auth.signUp({ phone, password: input.password, options: { data: { full_name: input.name.trim() } } });
      if (error) throw new Error(error.message);
      if (!data.session) throw new Error("Account created. Ask the owner to disable Phone Confirmations, then log in.");
      await hydrateProfile(data.session);
      setScreen("student-menu");
      notify("Account created successfully");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ phone, password: input.password });
      if (error) throw new Error(error.message);
      if (!data.session) throw new Error("Login did not return an active session.");
      await hydrateProfile(data.session);
      setScreen("student-menu");
      notify("Welcome back");
    }
  };

  const saveProfile = async (update: { name: string; hostel: string; room: string }) => {
    const previous = profile;
    const next = { ...profile, name: update.name.trim() || profile.name, hostel: update.hostel, room: update.room.trim() };
    setProfile(next);
    setProfileError("");
    if (!supabase || !supabaseConfigured || !profile.id) {
      notify("Profile saved on this device");
      return;
    }
    setProfileSaving(true);
    const { error } = await supabase.from("coke_student_profiles").upsert({
      id: profile.id,
      full_name: next.name,
      phone: profile.phone,
      default_hostel: next.hostel === "Select your hostel" ? "" : next.hostel,
      room: next.room,
    }, { onConflict: "id" });
    if (error) {
      setProfile(previous);
      setProfileError(error.message.includes("coke_student_profiles") ? "Run supabase/PROFILE_BACKEND.sql first." : error.message);
      setProfileSaving(false);
      return;
    }
    await supabase.auth.updateUser({ data: { full_name: next.name } });
    setProfileSaving(false);
    notify("Profile saved");
  };

  const changePassword = async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
    if (!supabase || !supabaseConfigured) {
      notify("Connect Supabase before changing your password");
      throw new Error("Supabase is not connected yet.");
    }
    const phone = normalizeIndianPhone(profile.phone);
    if (!/^\+91\d{10}$/.test(phone)) throw new Error("Your registered phone number is missing. Please sign in again.");
    const { data: reauthenticated, error: verifyError } = await supabase.auth.signInWithPassword({ phone, password: currentPassword });
    if (verifyError || !reauthenticated.session) {
      notify("Current password is incorrect");
      throw new Error("Current password is incorrect.");
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      notify("Password could not be changed");
      throw new Error(updateError.message);
    }
    notify("Password changed successfully");
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setCart([]);
    setCartOpen(false);
    setCheckoutOpen(false);
    setOrderPlaced(null);
    setStudentNotification(null);
    studentOrderStatuses.current = {};
    studentOrderSnapshotReady.current = false;
    setProfile(emptyProfile);
    setOwnerPin("");
    setScreen("landing");
  };
  const addToCart = (item: MenuItem) => { if (!item.available) return notify(`${item.name} is out of stock`); setCart((current) => { const found = current.find((row) => row.item.id === item.id); return found ? current.map((row) => row.item.id === item.id ? { ...row, quantity: row.quantity + 1 } : row) : [...current, { item, quantity: 1 }]; }); };
  const toggleMenuItem = async (id: string) => {
    const item = menu.find((entry) => entry.id === id);
    if (!item) return;
    const nextAvailable = !item.available;
    setMenu((current) => current.map((entry) => entry.id === id ? { ...entry, available: nextAvailable } : entry));
    if (!supabase || !ownerPin) return;
    const { data, error } = await supabase.rpc("owner_upsert_coke_station_menu", { p_id: item.id, p_name: item.name, p_category: item.category, p_size: item.size, p_price: item.price, p_emoji: item.emoji, p_available: nextAvailable, p_pin: ownerPin });
    if (error || data === false) notify(error?.message || "Menu availability was not saved");
  };
  const addMenuItem = async (item: MenuItem) => {
    const previous = menu;
    setMenu((current) => [...current, item]);
    if (!supabase || !ownerPin) { notify(`${item.name} added`); return; }
    const { data, error } = await supabase.rpc("owner_upsert_coke_station_menu", { p_id: item.id, p_name: item.name, p_category: item.category, p_size: item.size, p_price: item.price, p_emoji: item.emoji, p_available: item.available, p_pin: ownerPin });
    if (error || data === false) { setMenu(previous); notify(error?.message || "Menu item was not saved"); return; }
    notify(`${item.name} added`);
  };
  const changeQuantity = (id: string, delta: number) => setCart((current) => current.map((row) => row.item.id === id ? { ...row, quantity: row.quantity + delta } : row).filter((row) => row.quantity > 0));
  const placeOrder = async (details: { hostel: string; phone: string; payment: PaymentMethod; upiApp?: UpiApp }) => {
    const total = cart.reduce((sum, row) => sum + row.item.price * row.quantity, 0);
    if (total < MINIMUM_ORDER) throw new Error(`Minimum order is ${money(MINIMUM_ORDER)}. Add items worth ${money(MINIMUM_ORDER - total)} more.`);
    const order: Order = { id: `CS-${Date.now().toString().slice(-6)}`, createdAt: new Date().toISOString(), studentId: profile.id, student: profile.name, phone: profile.phone || details.phone, hostel: details.hostel, items: cart.map((row) => ({ name: row.item.name, quantity: row.quantity })), total, payment: details.payment, upiApp: details.upiApp, paymentStatus: "Pending", status: "New" };
    if (isHostedEnvironment() && (!supabase || !supabaseConfigured)) throw new Error("Cloud backend is not configured. Ask the owner to add the Supabase environment variables in Netlify.");
    let savedOrder = order;
    if (supabase && supabaseConfigured) {
      if (!profile.id) throw new Error("Your session expired. Please log in again.");
      const { data, error } = await supabase.from("coke_station_orders").insert({
        order_ref: order.id,
        student_id: profile.id,
        student_name: order.student,
        student_phone: order.phone,
        hostel: order.hostel,
        items: order.items,
        total: order.total,
        payment_method: order.payment,
        upi_app: order.upiApp || null,
        payment_status: order.paymentStatus,
        status: order.status,
      }).select("*").single();
      if (error) throw new Error(error.code === "42P01" || error.code === "PGRST205" ? "Orders backend is not installed yet. Run supabase/ORDERS_BACKEND.sql." : error.message);
      if (data && typeof data === "object") savedOrder = orderFromDatabase(data as Record<string, unknown>);
    }
    setOrders((current) => [savedOrder, ...current]);
    setCart([]);
    setCheckoutOpen(false);
    setOrderPlaced(savedOrder);
  };
  const scratch = async () => {
    const now = new Date().toISOString();
    if (supabase && ownerPin) {
      const { error } = await supabase.rpc("owner_scratch_shift", { p_owner_pin: ownerPin });
      if (error) { notify(error.message || "Could not start a new shift"); return; }
      setBackendShiftStartedAt(now);
      notify("New shift started — current counters reset to zero");
      return;
    }
    // Offline/local fallback when Supabase isn't configured.
    const previousShiftOrders = orders.filter((order) => new Date(order.createdAt).getTime() >= new Date(shiftStartedAt).getTime() && order.status !== "Cancelled");
    const online = previousShiftOrders.filter((order) => order.payment === "UPI" && order.paymentStatus === "Paid").reduce((sum, order) => sum + order.total, 0);
    const cod = previousShiftOrders.filter((order) => order.payment === "COD" && order.paymentStatus === "Paid").reduce((sum, order) => sum + order.total, 0);
    setShifts((current) => {
      const completed = current.find((shift) => !shift.closedAt);
      const previousCompleted = current.filter((shift) => shift.closedAt);
      const completedShift = completed ? { ...completed, closedAt: now, orderCount: previousShiftOrders.length, online, cod, total: online + cod, pending: previousShiftOrders.filter((order) => order.paymentStatus === "Pending").length } : null;
      return [{ id: `shift-${Date.now()}`, openedAt: now, orderCount: 0, online: 0, cod: 0, total: 0, pending: 0 }, ...(completedShift ? [completedShift] : []), ...previousCompleted];
    });
    notify("New shift started — current counters reset to zero");
  };
  const toggleShop = async () => {
    const nextStatus = !shopOpen;
    const previousBackendShift = backendShiftStartedAt;
    const previousShifts = shifts;
    const openingTime = new Date().toISOString();
    if (nextStatus) {
      setShopOpen(true);
      setBackendShiftStartedAt(openingTime);
      setShifts((current) => current.some((shift) => !shift.closedAt) ? current : [{ id: `shift-${Date.now()}`, openedAt: openingTime, orderCount: 0, online: 0, cod: 0, total: 0, pending: 0 }, ...current]);
    } else {
      const previousShiftOrders = orders.filter((order) => new Date(order.createdAt).getTime() >= new Date(shiftStartedAt).getTime() && order.status !== "Cancelled");
      const online = previousShiftOrders.filter((order) => order.payment === "UPI" && order.paymentStatus === "Paid").reduce((sum, order) => sum + order.total, 0);
      const cod = previousShiftOrders.filter((order) => order.payment === "COD" && order.paymentStatus === "Paid").reduce((sum, order) => sum + order.total, 0);
      setShopOpen(false);
      setBackendShiftStartedAt(null);
      setShifts((current) => current.map((shift) => !shift.closedAt ? { ...shift, closedAt: openingTime, orderCount: previousShiftOrders.length, online, cod, total: online + cod, pending: previousShiftOrders.filter((order) => order.paymentStatus !== "Paid").length } : shift));
    }
    if (supabase && ownerPin) {
      const { data, error } = await supabase.rpc("owner_set_shop_status", { p_open: nextStatus, p_owner_pin: ownerPin });
      const statusBackendMissing = error && ["42883", "PGRST202", "42P01"].includes(error.code || "");
      if ((error && !statusBackendMissing) || data === false) {
        setShopOpen(!nextStatus);
        setBackendShiftStartedAt(previousBackendShift);
        setShifts(previousShifts);
        notify(error?.message || "Shop status was not changed");
        return;
      }
      if (statusBackendMissing) notify(nextStatus ? "Shop opened on this device — run SHOP_STATUS.sql to sync devices" : "Shop closed on this device — run SHOP_STATUS.sql to sync devices");
      else notify(nextStatus ? "Shop opened" : "Shop closed");
      return;
    }
    notify(nextStatus ? "Shop opened" : "Shop closed");
  };
  const savePaymentSettings = async (next: PaymentSettings) => {
    const previous = paymentSettings;
    setPaymentSettings(next);
    if (supabase && ownerPin) {
      const { data, error } = await supabase.rpc("owner_update_shop_payment_settings", { p_upi_id: next.upiId, p_qr_code: next.qrCode, p_owner_pin: ownerPin });
      const paymentBackendMissing = error && ["42883", "PGRST202", "42P01"].includes(error.code || "");
      if ((error && !paymentBackendMissing) || data === false) {
        setPaymentSettings(previous);
        throw new Error(error?.message || "Payment settings were not saved.");
      }
      if (paymentBackendMissing) notify("Saved on this device — run ONLINE_PAYMENT_UPDATE.sql to sync devices");
      else notify("Payment settings saved");
      return;
    }
    notify("Payment settings saved");
  };
  const syncOwnerOrder = async (orderRef: string, status: Order["status"], paymentStatus: Order["paymentStatus"], paymentMethod: PaymentMethod, paymentConfirmedManually?: boolean) => {
    if (!supabase || !ownerPin) return;
    const params: Record<string, unknown> = { p_order_ref: orderRef, p_status: status, p_payment_status: paymentStatus, p_payment_method: paymentMethod, p_pin: ownerPin };
    if (paymentConfirmedManually !== undefined) params.p_payment_confirmed_manually = paymentConfirmedManually;
    const { data, error } = await supabase.rpc("owner_update_coke_station_order", params);
    const ordersBackendMissing = error && ["42883", "PGRST202", "42P01"].includes(error.code || "");
    if ((error && !ordersBackendMissing) || data === false) notify(error?.message || "Order update was not saved");
    else if (ordersBackendMissing) notify("Updated on this device — run ORDERS_BACKEND.sql to sync the owner dashboard");
  };
  const nextStatus = (id: string) => {
    const order = orders.find((item) => item.id === id);
    if (!order) return;
    const status: Order["status"] = order.status === "New" ? "Preparing" : order.status === "Preparing" ? "Ready" : "Delivered";
    const paymentStatus: Order["paymentStatus"] = status === "Delivered" && order.payment === "COD" ? "Paid" : order.paymentStatus;
    setOrders((current) => current.map((item) => item.id === id ? { ...item, status, paymentStatus } : item));
    void syncOwnerOrder(id, status, paymentStatus, order.payment);
  };
  const confirmPayment = (id: string, method: PaymentMethod = "UPI") => {
    const order = orders.find((item) => item.id === id);
    if (!order) return;
    setOrders((current) => current.map((item) => item.id === id ? { ...item, paymentStatus: "Paid", payment: method, paymentConfirmedManually: true } : item));
    void syncOwnerOrder(id, order.status, "Paid", method, true);
    notify("Order accepted — payment confirmed");
  };
  const rejectOrder = (id: string) => {
    const order = orders.find((item) => item.id === id);
    if (!order || order.status === "Cancelled" || order.payment !== "UPI") return;
    setOrders((current) => current.map((item) => item.id === id ? { ...item, status: "Cancelled", paymentStatus: "Cancelled" } : item));
    void syncOwnerOrder(id, "Cancelled", "Cancelled", order.payment);
    notify("Order rejected and canceled");
  };
  const completeDelivery = (id: string) => {
    const order = orders.find((item) => item.id === id);
    if (!order) return;
    setOrders((current) => current.map((item) => item.id === id ? { ...item, status: "Delivered", paymentStatus: item.payment === "COD" ? "Paid" : item.paymentStatus } : item));
    void syncOwnerOrder(id, "Delivered", order.payment === "COD" ? "Paid" : order.paymentStatus, order.payment);
    notify("Order marked as delivered");
  };
  const deleteShift = (id: string) => { if (window.confirm("Delete this history record? This cannot be undone.")) { setShifts((current) => current.filter((shift) => shift.id !== id)); notify("History record deleted"); } };
  const fetchStudentOrders = async () => {
    if (!supabase || !profile.id) return;
    const { data, error } = await supabase.from("coke_station_orders").select("*").eq("student_id", profile.id).order("created_at", { ascending: false });
    if (error || !data) return;
    const nextOrders = (data as Record<string, unknown>[]).map(orderFromDatabase);
    const previousStatuses = studentOrderStatuses.current;
    if (studentOrderSnapshotReady.current) {
      for (const order of nextOrders) {
        const previousStatus = previousStatuses[order.id];
        if (previousStatus && previousStatus !== order.status) {
          const notification = getStudentStatusNotification(order);
          if (notification) {
            setStudentNotification(notification);
            if (order.status === "Cancelled") setOrderPlaced((current) => current?.id === order.id ? null : current);
          }
        }
      }
    }
    studentOrderStatuses.current = Object.fromEntries(nextOrders.map((order) => [order.id, order.status]));
    studentOrderSnapshotReady.current = true;
    setOrders(nextOrders);
  };
  const fetchOwnerOrders = async () => {
    if (!supabase || !ownerPin) return;
    const { data, error } = await supabase.rpc("owner_get_coke_station_orders", { p_pin: ownerPin });
    if (!error && data) setOrders((data as Record<string, unknown>[]).map(orderFromDatabase));
  };
  useEffect(() => {
    if (!supabase) return;
    const loadOrders = screen === "owner-dashboard" && ownerPin ? fetchOwnerOrders : screen === "student-menu" && profile.id ? fetchStudentOrders : null;
    if (!loadOrders) return;
    void loadOrders();
    const timer = window.setInterval(() => { void loadOrders(); }, 2000);
    return () => window.clearInterval(timer);
  }, [screen, ownerPin, profile.id]);

  let screenContent: ReactNode;
  if (screen === "landing") screenContent = <Landing onStudent={() => setScreen("student-login")} onOwner={() => setScreen("owner-pin")} />;
  else if (screen === "student-login") screenContent = <Login onBack={() => setScreen("landing")} onSuccess={() => setScreen("student-menu")} onRegister={() => setScreen("student-register")} onStudentAuth={handleStudentAuth} onForgotPassword={() => setScreen("forgot-password")} />;
  else if (screen === "student-register") screenContent = <Login register onBack={() => setScreen("landing")} onSuccess={() => setScreen("student-menu")} onRegister={() => setScreen("student-login")} onStudentAuth={handleStudentAuth} />;
  else if (screen === "forgot-password") screenContent = <ForgotPasswordPage onBack={() => setScreen("student-login")} onSuccess={notify} />;
  else if (screen === "owner-pin") screenContent = <Login owner onBack={() => setScreen("landing")} onSuccess={(pin) => { setOwnerPin(pin || ""); setScreen("owner-dashboard"); }} />;
  else if (screen === "student-menu") screenContent = <StudentMenu menu={menu} cart={cart} profile={profile} notification={studentNotification} onDismissNotification={() => setStudentNotification(null)} onUpdatePassword={changePassword} shopOpen={shopOpen} onAdd={addToCart} onQuantity={changeQuantity} onHistory={() => setHistoryOpen(true)} onCart={() => setCartOpen(true)} onCheckout={(selectedHostel) => { setCheckoutHostel(selectedHostel || ""); setCheckoutOpen(true); }} onLogout={logout} />;
  else screenContent = <OwnerDashboard menu={menu} orders={orders} shifts={shifts} shopOpen={shopOpen} ownerPin={ownerPin} paymentSettings={paymentSettings} shiftStartedAt={shiftStartedAt} onShop={toggleShop} onScratch={scratch} onMenu={() => undefined} onPayment={() => undefined} onHistory={() => setHistoryOpen(true)} onLogout={logout} onToggle={toggleMenuItem} onAdd={addMenuItem} onPaymentSave={savePaymentSettings} onAdvance={nextStatus} onPay={confirmPayment} onReject={rejectOrder} onCompleteDelivery={completeDelivery} onCall={(phone) => notify(`Calling ${phone}`)} onNavigate={(message) => notify(message)} onDeleteShift={deleteShift} />;

  return <div className="legacy-root">{screenContent}{historyOpen && screen === "student-menu" && <StudentHistory orders={orders} studentId={profile.id} studentPhone={profile.phone} onClose={() => setHistoryOpen(false)} />}{cartOpen && screen === "student-menu" && <CartModal cart={cart} onQuantity={changeQuantity} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />}{checkoutOpen && <CheckoutModal cart={cart} profile={profile} upiId={paymentSettings.upiId} initialHostel={checkoutHostel} onClose={() => setCheckoutOpen(false)} onPlace={placeOrder} />}{orderPlaced && <OrderPlacedModal order={orderPlaced} onClose={() => setOrderPlaced(null)} />}{toast && <div className="legacy-toast"><span>✓</span>{toast}</div>}</div>;
}
