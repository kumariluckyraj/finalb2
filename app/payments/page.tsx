"use client";
import { CreditCard, Smartphone, Building, Banknote, Shield, Lock, Headphones } from "lucide-react";

const paymentMethods = [
  {
    icon: <CreditCard className="w-7 h-7" />,
    title: "Credit & Debit Cards",
    description: "Visa, Mastercard, RuPay, and American Express",
    detail: "Secure payments with 3D Secure authentication. All major domestic and international cards accepted.",
  },
  {
    icon: <Smartphone className="w-7 h-7" />,
    title: "UPI",
    description: "Google Pay, PhonePe, Paytm, BHIM",
    detail: "Pay directly from your bank account using any UPI app. Instant confirmation and no extra charges.",
  },
  {
    icon: <Building className="w-7 h-7" />,
    title: "Net Banking",
    description: "All major banks supported",
    detail: "Secure redirect to your bank&apos;s net banking portal. Supported banks include SBI, HDFC, ICICI, Axis, and 40+ more.",
  },
  {
    icon: <Banknote className="w-7 h-7" />,
    title: "Cash on Delivery",
    description: "Pay when you receive",
    detail: "Pay in cash at your doorstep. Available on orders up to ₹50,000. A nominal convenience fee may apply.",
  },
  {
    icon: <Smartphone className="w-7 h-7" />,
    title: "EMI",
    description: "No-cost EMI options available",
    detail: "Convert your purchase into easy monthly installments with 0% interest. Available on cards from HDFC, ICICI, Axis, and SBI.",
  },
  {
    icon: <Banknote className="w-7 h-7" />,
    title: "B2World Wallet",
    description: "SuperCoins & Store Credit",
    detail: "Use your B2World wallet balance and SuperCoins for seamless checkout. Earn coins on every purchase and redeem them later.",
  },
];

export default function PaymentsPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#1a211e]">
      <section className="relative bg-[#0c0c0c] overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-20 md:py-28 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-6">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <h1 className="display-serif m-0 mb-4 text-white" style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>
            Payment Options
          </h1>
          <p className="text-white/70 text-[16px] max-w-[600px] mx-auto leading-relaxed">
            Choose from multiple secure payment methods. We partner with trusted payment gateways to keep your transactions safe.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10">
          <h2 className="display-serif m-0 mb-4 text-center text-[#1a211e]" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
            Ways to Pay
          </h2>
          <p className="text-[#606562] text-[15px] text-center max-w-[500px] mx-auto mb-12 leading-relaxed">
            All transactions are encrypted and processed through PCI DSS compliant gateways.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentMethods.map((method) => (
              <div key={method.title} className="border border-[#e0e0e0] rounded p-8 bg-white hover:border-[#1a211e] transition-colors">
                <div className="w-12 h-12 rounded-full bg-[#eef1f0] flex items-center justify-center text-[#1a211e] mb-5">
                  {method.icon}
                </div>
                <h3 className="text-[18px] font-bold text-[#1a211e] m-0 mb-1">{method.title}</h3>
                <p className="text-[14px] font-medium text-[#606562] m-0 mb-3">{method.description}</p>
                <p className="text-[14px] text-[#606562] leading-relaxed m-0">{method.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eef1f0] py-16 md:py-24">
        <div className="max-w-[900px] mx-auto px-5 md:px-10">
          <h2 className="display-serif m-0 mb-8 text-center text-[#1a211e]" style={{ fontSize: 'clamp(28px, 4vw, 36px)' }}>
            Payment Security
          </h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4 bg-white p-6 rounded border border-[#e0e0e0]">
              <div className="w-10 h-10 rounded-full bg-[#eef1f0] flex items-center justify-center text-[#1a211e] shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#1a211e] m-0 mb-1">PCI DSS Compliant</h3>
                <p className="text-[14px] text-[#606562] leading-relaxed m-0">We adhere to the highest security standards. Your payment data is encrypted and never stored on our servers.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-white p-6 rounded border border-[#e0e0e0]">
              <div className="w-10 h-10 rounded-full bg-[#eef1f0] flex items-center justify-center text-[#1a211e] shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#1a211e] m-0 mb-1">256-bit SSL Encryption</h3>
                <p className="text-[14px] text-[#606562] leading-relaxed m-0">Every transaction is secured with bank-grade SSL encryption, ensuring your information stays private.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-white p-6 rounded border border-[#e0e0e0]">
              <div className="w-10 h-10 rounded-full bg-[#eef1f0] flex items-center justify-center text-[#1a211e] shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#1a211e] m-0 mb-1">24/7 Support</h3>
                <p className="text-[14px] text-[#606562] leading-relaxed m-0">Facing an issue with payment? Our support team is available around the clock to help resolve any concerns.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-[900px] mx-auto px-5 md:px-10 text-center">
          <h2 className="display-serif m-0 mb-4 text-[#1a211e]" style={{ fontSize: 'clamp(28px, 4vw, 36px)' }}>
            Have questions about payments?
          </h2>
          <p className="text-[#606562] text-[16px] max-w-[500px] mx-auto leading-relaxed mb-8">
            Visit our FAQ page for more details or reach out to our support team.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="/faq" className="bg-[#1a211e] text-white px-8 py-3.5 rounded text-[14px] font-bold uppercase no-underline hover:opacity-90 transition-opacity" style={{ letterSpacing: '0.057em' }}>
              View FAQ
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
