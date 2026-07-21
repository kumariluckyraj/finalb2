"use client";
import { useState } from "react";
import { ChevronDown, HelpCircle, ShoppingBag, Truck, CreditCard, RotateCcw, MessageCircle } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  icon: React.ReactNode;
  title: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    icon: <ShoppingBag className="w-5 h-5" />,
    title: "Shopping & Orders",
    items: [
      { q: "How do I place an order on B2World?", a: "Simply browse our catalog, add items to your cart, and proceed to checkout. You can place an order as a guest or create an account for a faster experience. Review your order details, choose a payment method, and confirm your purchase." },
      { q: "Can I modify or cancel my order after placing it?", a: "Orders can be modified or cancelled within 30 minutes of placement, provided they haven't been processed for shipping. Visit 'My Orders' in your account to make changes, or contact our support team for assistance." },
      { q: "How will I know if my order is confirmed?", a: "After successfully placing an order, you will receive an order confirmation email with your order number and details. You can also track your order status in the 'My Orders' section of your account." },
      { q: "Is it safe to shop on B2World?", a: "Absolutely. We use industry-standard SSL encryption to protect your personal and payment information. We are committed to providing a secure shopping experience and never share your data with third parties without your consent." },
    ],
  },
  {
    icon: <Truck className="w-5 h-5" />,
    title: "Shipping & Delivery",
    items: [
      { q: "What are the shipping charges?", a: "We offer FREE delivery on orders above ₹499. For orders below ₹499, a nominal shipping fee of ₹40 is applied. Express shipping options are available at an additional cost." },
      { q: "How long does delivery take?", a: "Standard delivery typically takes 3–7 business days depending on your location. Metro cities usually receive orders within 2–4 days, while remote areas may take 5–7 days. Express delivery is available in select pin codes." },
      { q: "Do you ship internationally?", a: "Currently, B2World ships across all pin codes within India. International shipping is not yet available, but we are working to expand our services globally." },
      { q: "Can I track my order?", a: "Yes, once your order is shipped, you will receive a tracking number via email and SMS. You can use this to track your package in real-time through the 'My Orders' section or directly on the courier partner's website." },
    ],
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: "Payments",
    items: [
      { q: "What payment methods are accepted?", a: "We accept all major payment methods including Visa, Mastercard, RuPay, UPI (Google Pay, PhonePe, Paytm), Net Banking, EMIs, and Cash on Delivery (COD)." },
      { q: "Is Cash on Delivery available?", a: "Yes, COD is available on eligible orders. A nominal convenience fee may apply. COD is not available on orders above ₹50,000." },
      { q: "Is it safe to save my card details?", a: "Yes, we use PCI DSS compliant payment gateways. Your card details are tokenized and never stored on our servers. You can choose to save cards securely for faster checkouts." },
      { q: "When will my payment be refunded?", a: "Refunds are processed within 5–7 business days after the returned item is received and inspected. The amount is credited back to your original payment method." },
    ],
  },
  {
    icon: <RotateCcw className="w-5 h-5" />,
    title: "Returns & Refunds",
    items: [
      { q: "What is the return policy?", a: "We offer a 7-day return policy on most products. Items must be unused, in original packaging, with all tags attached. Some categories like innerwear and personal care items are non-returnable for hygiene reasons." },
      { q: "How do I initiate a return?", a: "Go to 'My Orders', select the item you want to return, and click 'Return'. Choose a reason and submit. A pickup will be scheduled within 2–3 business days. You can also visit our Cancellation & Returns page for more details." },
      { q: "Who pays for return shipping?", a: "Return shipping is free for defective or incorrect items. For change-of-mind returns, a nominal return shipping fee may be deducted from your refund." },
      { q: "How long does the refund process take?", a: "Once we receive and inspect your return, refunds are processed within 5–7 business days. The timeline for the amount to reflect in your account depends on your payment method — bank transfers typically take 1–3 additional days." },
    ],
  },
];

const faqGeneral: FAQItem[] = [
  { q: "How do I contact customer support?", a: "You can reach us via email at support@b2world.com, call us at 1800-123-4567 (Mon–Sat, 9 AM – 9 PM), or use the live chat feature on our website. We typically respond within 2–4 hours during business hours." },
  { q: "Do you have a loyalty program?", a: "Yes! B2World SuperCoins rewards you for every purchase. Earn coins on every order and redeem them for discounts on future purchases. Sign up for free and start earning today." },
  { q: "Can I sell on B2World?", a: "Absolutely. We welcome sellers to join our marketplace. Visit our 'Sell Online' page to register. Our seller support team will guide you through the onboarding process, listing products, and managing orders." },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [openGeneral, setOpenGeneral] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleGeneral = (key: string) => setOpenGeneral(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="min-h-screen bg-white font-sans text-[#1a211e]">
      <section className="relative bg-[#0c0c0c] overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-20 md:py-28 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-6">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <h1 className="display-serif m-0 mb-4 text-white" style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>
            Frequently Asked Questions
          </h1>
          <p className="text-white/70 text-[16px] max-w-[600px] mx-auto leading-relaxed">
            Everything you need to know about shopping on B2World. Can&apos;t find what you&apos;re looking for? Reach out to our support team.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-[900px] mx-auto px-5 md:px-10">
          {faqData.map((category, ci) => (
            <div key={category.title} className="mb-12 last:mb-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#eef1f0] flex items-center justify-center text-[#1a211e] shrink-0">
                  {category.icon}
                </div>
                <h2 className="text-[20px] md:text-[24px] font-bold text-[#1a211e] m-0">{category.title}</h2>
              </div>
              <div className="space-y-2">
                {category.items.map((item, ii) => {
                  const key = `cat-${ci}-${ii}`;
                  const open = openItems[key];
                  return (
                    <div key={key} className="border border-[#e0e0e0] rounded overflow-hidden">
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full bg-white px-5 py-4 flex items-center justify-between text-left cursor-pointer border-none text-[15px] font-medium text-[#1a211e] hover:bg-[#f8f9f8] transition-colors"
                      >
                        <span>{item.q}</span>
                        <ChevronDown className={`w-4 h-4 shrink-0 ml-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                      </button>
                      {open && (
                        <div className="px-5 pb-4 text-[15px] text-[#606562] leading-relaxed border-t border-[#e0e0e0] pt-4">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#eef1f0] py-16 md:py-24">
        <div className="max-w-[900px] mx-auto px-5 md:px-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1a211e] shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h2 className="text-[20px] md:text-[24px] font-bold text-[#1a211e] m-0">Still have questions?</h2>
          </div>
          <div className="space-y-2">
            {faqGeneral.map((item, i) => {
              const key = `gen-${i}`;
              const open = openGeneral[key];
              return (
                <div key={key} className="border border-[#e0e0e0] rounded overflow-hidden bg-white">
                  <button
                    onClick={() => toggleGeneral(key)}
                    className="w-full bg-white px-5 py-4 flex items-center justify-between text-left cursor-pointer border-none text-[15px] font-medium text-[#1a211e] hover:bg-[#f8f9f8] transition-colors"
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 ml-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="px-5 pb-4 text-[15px] text-[#606562] leading-relaxed border-t border-[#e0e0e0] pt-4">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-[900px] mx-auto px-5 md:px-10 text-center">
          <h2 className="display-serif m-0 mb-4 text-[#1a211e]" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
            Need more help?
          </h2>
          <p className="text-[#606562] text-[16px] max-w-[500px] mx-auto leading-relaxed mb-8">
            Our support team is available Monday–Saturday, 9 AM – 9 PM.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="mailto:support@b2world.com" className="inline-flex items-center gap-2 bg-[#1a211e] text-white px-8 py-3.5 rounded text-[14px] font-bold uppercase no-underline hover:opacity-90 transition-opacity" style={{ letterSpacing: '0.057em' }}>
              <MessageCircle className="w-4 h-4" /> Email Support
            </a>
            <a href="tel:18001234567" className="inline-flex items-center gap-2 bg-transparent text-[#1a211e] border border-[#1a211e] px-8 py-3.5 rounded text-[14px] font-bold uppercase no-underline hover:bg-[#1a211e] hover:text-white transition-all" style={{ letterSpacing: '0.057em' }}>
              Call 1800-123-4567
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
