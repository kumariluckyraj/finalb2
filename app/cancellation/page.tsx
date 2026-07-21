"use client";
import { RotateCcw, Package, Clock, RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const steps = [
  { icon: <Package className="w-5 h-5" />, title: "Initiate Return", description: "Go to My Orders, select the item, and click Return." },
  { icon: <Clock className="w-5 h-5" />, title: "Pickup Scheduled", description: "Our courier picks up the item within 2–3 business days." },
  { icon: <RefreshCw className="w-5 h-5" />, title: "Quality Check", description: "Item is inspected at our facility within 2 business days." },
  { icon: <CheckCircle className="w-5 h-5" />, title: "Refund Initiated", description: "Refund processed within 5–7 business days after inspection." },
];

const returnReasons = [
  { label: "Damaged in transit", eligible: true, note: "Full refund + return shipping covered" },
  { label: "Wrong item delivered", eligible: true, note: "Full refund + return shipping covered" },
  { label: "Size / fit issue", eligible: true, note: "Refund minus return shipping fee" },
  { label: "Changed mind", eligible: true, note: "Refund minus return shipping fee" },
  { label: "Product not as described", eligible: true, note: "Full refund + return shipping covered" },
  { label: "Hygiene / personal care items", eligible: false, note: "Non-returnable by law" },
  { label: "Innerwear / lingerie", eligible: false, note: "Non-returnable for hygiene reasons" },
];

export default function CancellationPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#1a211e]">
      <section className="relative bg-[#0c0c0c] overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-20 md:py-28 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-6">
            <RotateCcw className="w-6 h-6 text-white" />
          </div>
          <h1 className="display-serif m-0 mb-4 text-white" style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>
            Cancellation & Returns
          </h1>
          <p className="text-white/70 text-[16px] max-w-[600px] mx-auto leading-relaxed">
            We want you to love every purchase. If something isn&apos;t right, we make it easy to cancel or return.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
            <div>
              <h2 className="text-[20px] md:text-[24px] font-bold text-[#1a211e] m-0 mb-4">Order Cancellation</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-[#cc2e39] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-[15px] font-bold text-[#1a211e] m-0 mb-1">Before Shipping</h3>
                    <p className="text-[14px] text-[#606562] leading-relaxed m-0">Orders can be cancelled within 30 minutes of placement free of charge. Visit My Orders and click Cancel. The full amount will be refunded.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#cc2e39] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-[15px] font-bold text-[#1a211e] m-0 mb-1">After Shipping</h3>
                    <p className="text-[14px] text-[#606562] leading-relaxed m-0">Once shipped, you cannot cancel the order. However, you can refuse delivery at your doorstep, or initiate a return after receiving the item.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#cc2e39] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-[15px] font-bold text-[#1a211e] m-0 mb-1">Seller Cancellations</h3>
                    <p className="text-[14px] text-[#606562] leading-relaxed m-0">In rare cases where a seller is unable to fulfill an order, we will cancel it and issue a full refund within 5–7 business days.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-[20px] md:text-[24px] font-bold text-[#1a211e] m-0 mb-4">Return Policy</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <RefreshCw className="w-5 h-5 text-[#1a211e] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-[15px] font-bold text-[#1a211e] m-0 mb-1">7-Day Return Window</h3>
                    <p className="text-[14px] text-[#606562] leading-relaxed m-0">Most items can be returned within 7 days of delivery. Items must be unused, in original packaging, with all tags attached.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RotateCcw className="w-5 h-5 text-[#1a211e] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-[15px] font-bold text-[#1a211e] m-0 mb-1">Easy Pickup</h3>
                    <p className="text-[14px] text-[#606562] leading-relaxed m-0">Schedule a free pickup from your address. Our courier partner will collect the package within 2–3 business days of your return request.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#1a211e] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-[15px] font-bold text-[#1a211e] m-0 mb-1">Hassle-Free Refunds</h3>
                    <p className="text-[14px] text-[#606562] leading-relaxed m-0">Refunds are processed to your original payment method within 5–7 business days after we receive and inspect the returned item.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#eef1f0] py-16 md:py-24">
        <div className="max-w-[900px] mx-auto px-5 md:px-10">
          <h2 className="display-serif m-0 mb-8 text-center text-[#1a211e]" style={{ fontSize: 'clamp(28px, 4vw, 36px)' }}>
            Return & Refund Process
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {steps.map((step, i) => (
              <div key={step.title} className="bg-white border border-[#e0e0e0] rounded p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-[#eef1f0] flex items-center justify-center text-[#1a211e] mx-auto mb-3">
                  {step.icon}
                </div>
                <div className="text-[24px] font-bold text-[#1a211e] mb-1">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="text-[14px] font-bold text-[#1a211e] m-0 mb-1">{step.title}</h3>
                <p className="text-[12px] text-[#606562] leading-relaxed m-0">{step.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <a href="/myorders" className="inline-flex items-center gap-2 bg-[#1a211e] text-white px-8 py-3.5 rounded text-[14px] font-bold uppercase no-underline hover:opacity-90 transition-opacity" style={{ letterSpacing: '0.057em' }}>
              Initiate a Return
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-[900px] mx-auto px-5 md:px-10">
          <h2 className="display-serif m-0 mb-6 text-center text-[#1a211e]" style={{ fontSize: 'clamp(28px, 4vw, 36px)' }}>
            Eligible for Return?
          </h2>
          <p className="text-[#606562] text-[15px] text-center max-w-[500px] mx-auto mb-10 leading-relaxed">
            Use the table below to check if your item qualifies for a return.
          </p>
          <div className="border border-[#e0e0e0] rounded overflow-hidden">
            {returnReasons.map((item) => (
              <div key={item.label} className={`flex items-center justify-between px-5 py-4 ${item.eligible ? '' : 'bg-[#f8f9f8]'}`}>
                <div className="flex items-center gap-3">
                  {item.eligible ? (
                    <CheckCircle className="w-4 h-4 text-[#1a211e] shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#cc2e39] shrink-0" />
                  )}
                  <span className={`text-[14px] ${item.eligible ? 'text-[#1a211e]' : 'text-[#606562] line-through'}`}>
                    {item.label}
                  </span>
                </div>
                <span className="text-[12px] text-[#606562] ml-4 shrink-0">{item.note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eef1f0] py-16 md:py-20">
        <div className="max-w-[900px] mx-auto px-5 md:px-10 text-center">
          <h2 className="display-serif m-0 mb-4 text-[#1a211e]" style={{ fontSize: 'clamp(28px, 4vw, 36px)' }}>
            Need assistance with a return?
          </h2>
          <p className="text-[#606562] text-[16px] max-w-[500px] mx-auto leading-relaxed mb-8">
            Our support team is here to help with any cancellation or return requests.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="/faq" className="bg-[#1a211e] text-white px-8 py-3.5 rounded text-[14px] font-bold uppercase no-underline hover:opacity-90 transition-opacity" style={{ letterSpacing: '0.057em' }}>
              Visit FAQ
            </a>
            <a href="mailto:support@b2world.com" className="bg-transparent text-[#1a211e] border border-[#1a211e] px-8 py-3.5 rounded text-[14px] font-bold uppercase no-underline hover:bg-[#1a211e] hover:text-white transition-all" style={{ letterSpacing: '0.057em' }}>
              Contact Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
