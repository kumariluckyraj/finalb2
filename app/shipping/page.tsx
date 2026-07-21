"use client";
import { Truck, Package, MapPin, Clock, IndianRupee, ShieldCheck } from "lucide-react";

const deliveryOptions = [
  {
    icon: <Truck className="w-6 h-6" />,
    title: "Standard Delivery",
    time: "3–7 Business Days",
    price: "Free above ₹499",
    note: "₹40 for orders below ₹499",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Express Delivery",
    time: "1–2 Business Days",
    price: "₹99 flat",
    note: "Available in select pin codes",
  },
  {
    icon: <Package className="w-6 h-6" />,
    title: "Same-Day Delivery",
    time: "Within 24 hours",
    price: "₹149 flat",
    note: "Metro cities only",
  },
];

const shippingZones = [
  { zone: "Metro Cities", time: "2–4 days", detail: "Delhi, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad, Pune, Ahmedabad" },
  { zone: "Tier 2 Cities", time: "3–5 days", detail: "Jaipur, Lucknow, Chandigarh, Bhopal, Indore, Coimbatore, Nagpur" },
  { zone: "Tier 3 & Remote", time: "5–7 days", detail: "All other locations across India including remote and rural areas" },
];

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#1a211e]">
      <section className="relative bg-[#0c0c0c] overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-20 md:py-28 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-6">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <h1 className="display-serif m-0 mb-4 text-white" style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>
            Shipping Information
          </h1>
          <p className="text-white/70 text-[16px] max-w-[600px] mx-auto leading-relaxed">
            We deliver to every pin code across India. Here&apos;s everything you need to know about how we get your orders to you.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10">
          <h2 className="display-serif m-0 mb-10 text-center text-[#1a211e]" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
            Delivery Options
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {deliveryOptions.map((opt) => (
              <div key={opt.title} className="border border-[#e0e0e0] rounded p-8 bg-white hover:border-[#1a211e] transition-colors">
                <div className="w-12 h-12 rounded-full bg-[#eef1f0] flex items-center justify-center text-[#1a211e] mb-5">
                  {opt.icon}
                </div>
                <h3 className="text-[20px] font-bold text-[#1a211e] m-0 mb-2">{opt.title}</h3>
                <div className="text-[28px] font-bold text-[#1a211e] mb-2">{opt.time}</div>
                <p className="text-[16px] font-semibold text-[#1a211e] m-0 mb-1">{opt.price}</p>
                <p className="text-[14px] text-[#606562] m-0">{opt.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eef1f0] py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10">
          <h2 className="display-serif m-0 mb-4 text-center text-[#1a211e]" style={{ fontSize: 'clamp(28px, 4vw, 36px)' }}>
            Delivery Timeline by Location
          </h2>
          <p className="text-[#606562] text-[15px] text-center max-w-[500px] mx-auto mb-10 leading-relaxed">
            Estimated delivery times once your order has been shipped.
          </p>
          <div className="max-w-[800px] mx-auto">
            {shippingZones.map((zone) => (
              <div key={zone.zone} className="flex items-start gap-5 py-6 border-b border-[#d0d3d1] last:border-b-0">
                <MapPin className="w-5 h-5 text-[#1a211e] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-[16px] font-bold text-[#1a211e] m-0 mb-1">{zone.zone}</h3>
                  <p className="text-[14px] text-[#606562] m-0 mb-1">{zone.detail}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-[16px] font-bold text-[#1a211e]">{zone.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-[900px] mx-auto px-5 md:px-10">
          <h2 className="display-serif m-0 mb-6 text-center text-[#1a211e]" style={{ fontSize: 'clamp(28px, 4vw, 36px)' }}>
            Shipping Policies
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-[18px] font-bold text-[#1a211e] mb-2 flex items-center gap-2">
                <IndianRupee className="w-4 h-4" /> Free Shipping
              </h3>
              <p className="text-[15px] text-[#606562] leading-relaxed m-0">
                We offer free standard shipping on all orders above ₹499. A flat ₹40 shipping fee applies to orders below this threshold. Express and same-day delivery options are available at additional costs as listed above.
              </p>
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#1a211e] mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Shipping Guarantee
              </h3>
              <p className="text-[15px] text-[#606562] leading-relaxed m-0">
                If your order is delayed beyond the estimated delivery timeline, we will credit your B2World account with SuperCoins as compensation. If your package is lost or damaged in transit, we will issue a full refund or send a replacement at no extra cost.
              </p>
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#1a211e] mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" /> Order Processing
              </h3>
              <p className="text-[15px] text-[#606562] leading-relaxed m-0">
                Orders are processed within 24 hours of placement (excluding Sundays and public holidays). Once processed, the order is handed over to our courier partner for delivery. You will receive tracking details via email and SMS once shipped.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#eef1f0] py-16 md:py-20">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 text-center">
          <h2 className="display-serif m-0 mb-4 text-[#1a211e]" style={{ fontSize: 'clamp(28px, 4vw, 36px)' }}>
            Track Your Order
          </h2>
          <p className="text-[#606562] text-[16px] max-w-[500px] mx-auto leading-relaxed mb-8">
            Once your order is shipped, you can track it in real-time from your account dashboard.
          </p>
          <a href="/myorders" className="inline-flex items-center gap-2 bg-[#1a211e] text-white px-8 py-3.5 rounded text-[14px] font-bold uppercase no-underline hover:opacity-90 transition-opacity" style={{ letterSpacing: '0.057em' }}>
            Track Order
          </a>
        </div>
      </section>
    </div>
  );
}
