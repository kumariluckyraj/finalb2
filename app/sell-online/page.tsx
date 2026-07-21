"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import LanguagePicker from "@/components/LanguagePicker";

const SELL_STRINGS = {

  heroBadge: "INDIA'S FASTEST GROWING MARKETPLACE",
  heroTitle1: "From Local Shop to",
  heroTitle2: "Crores of Customers",
  heroSub: "Start selling on B2World and grow your business with India's most trusted marketplace.",
  heroMeta: "✦ Zero listing fee, Secure payments, Pan India delivery",
  heroCta: "Start Selling - It's Free",
  heroPricing: "Pricing & Commissions →",


  whyLabel: "WHY B2WORLD",
  whyTitle: "Everything you need to sell online",


  feat1Title: "Crores of Customers",
  feat1Desc: "Reach millions of buyers across India and showcase your products to a massive audience.",
  feat2Title: "Simple Fee Structure",
  feat2Desc: "Transparent, easy-to-understand fees - you always know exactly what you pay.",
  feat3Title: "Low Business Costs",
  feat3Desc: "Minimal investment and operational costs to launch and grow your online store.",
  feat4Title: "Pan India Delivery",
  feat4Desc: "Deliver your products to customers across all states and pin codes effortlessly.",
  feat5Title: "Secure Payments",
  feat5Desc: "Receive timely, reliable payouts with safe payment processing every time.",
  feat6Title: "Seller Support 24/7",
  feat6Desc: "Expert guidance and dedicated assistance whenever you need help with your store.",


  stepsLabel: "GET STARTED",
  stepsTitle: "Start selling in 4 simple steps",
  stepsCta: "Create Your Seller Account",
  step1Title: "Create Account",
  step1Desc: "Sign up with your business and contact details in minutes.",
  step2Title: "Verify & Set Up",
  step2Desc: "Complete KYC and brand your store with logo and banner.",
  step3Title: "Add Products",
  step3Desc: "List products with images, pricing, descriptions, and stock.",
  step4Title: "Sell & Get Paid",
  step4Desc: "Go live, receive orders, and get secure timely payments.",

  testimonialsLabel: "SELLER STORIES",
  testimonialsTitle: "Trusted by lakhs of sellers",
  t1Quote: "B2World has multiplied my customer base. I'm reaching buyers I never could before!",
  t2Quote: "The platform is intuitive, fees are clear, and payments are always on time.",
  t3Quote: "Consistent growth since joining. The seller support team is outstanding!",
  t4Quote: "Listing products is simple and the reach is incredible. Highly recommended!",


  trustSeller: "Seller Protection Policy",
  trustOnboarding: "Fast Onboarding",
  trustDashboard: "Seller Dashboard & Analytics",
  trustGrowth: "Growth Programs",


  finalTitle: "Ready to grow your business?",
  finalSub: "Join 15 lakh+ sellers already thriving on B2World.",
  finalCta: "Register as Seller",
  finalPricing: "View Pricing",


  footerCopy: "© 2024 B2World Internet Private Limited - All rights reserved",


  languageLabel: "Language",
};

function useCountUp(target: number, duration = 1500, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

export default function SellOnlinePage() {
  const router = useRouter();


  const { t, isTranslating } = useTranslation("sell", SELL_STRINGS);

  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);


  const features = [
    { icon: "Users", title: t("feat1Title"), desc: t("feat1Desc") },
    { icon: "Dollar", title: t("feat2Title"), desc: t("feat2Desc") },
    { icon: "Box", title: t("feat3Title"), desc: t("feat3Desc") },
    { icon: "Truck", title: t("feat4Title"), desc: t("feat4Desc") },
    { icon: "Lock", title: t("feat5Title"), desc: t("feat5Desc") },
    { icon: "Headphones", title: t("feat6Title"), desc: t("feat6Desc") },
  ];

  const steps = [
    { n: 1, title: t("step1Title"), desc: t("step1Desc"), color: "#1a211e" },
    { n: 2, title: t("step2Title"), desc: t("step2Desc"), color: "#1a211e" },
    { n: 3, title: t("step3Title"), desc: t("step3Desc"), color: "#1a211e" },
    { n: 4, title: t("step4Title"), desc: t("step4Desc"), color: "#1a211e" },
  ];

  const testimonials = [
    { quote: t("t1Quote"), name: "Rajesh Kumar",  store: "Kumar Electronics",  avatar: "RK" },
    { quote: t("t2Quote"), name: "Priya Sharma",  store: "Sharma Handicrafts", avatar: "PS" },
    { quote: t("t3Quote"), name: "Rahul Verma",   store: "Verma Fashion",      avatar: "RV" },
    { quote: t("t4Quote"), name: "Anita Gupta",   store: "Gupta Home Decor",   avatar: "AG" },
  ];

  const trustItems = [
    { icon: "Shield", text: t("trustSeller") },
    { icon: "Bolt", text: t("trustOnboarding") },
    { icon: "Chart", text: t("trustDashboard") },
    { icon: "Trophy", text: t("trustGrowth") },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setActiveStep(s => (s + 1) % steps.length), 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      background: "#f8fafc",
      minHeight: "100vh",
     
      opacity: isTranslating ? 0.85 : 1,
      transition: "opacity 0.2s",
    }}>

      <section style={{
        background: "#1a211e",
        padding: "0",
        overflow: "hidden",
        position: "relative",
      }}>
      
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.08)",
            width: `${200 + i * 160}px`,
            height: `${200 + i * 160}px`,
            top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          }} />
        ))}

        <div style={{
          maxWidth: "1200px", margin: "0 auto",
          padding: "64px 24px 56px",
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center", position: "relative", zIndex: 1,
        }}>
     
          <div style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "#fff", borderRadius: "20px",
            padding: "5px 16px", fontSize: "12px",
            fontWeight: 600, marginBottom: "20px",
            letterSpacing: "0.5px", backdropFilter: "blur(8px)",
          }}>
            {t("heroBadge")}
          </div>

          <h1 style={{
            color: "#fff", fontSize: "clamp(28px, 5vw, 52px)",
            fontWeight: 800, lineHeight: 1.15,
            marginBottom: "16px", letterSpacing: "-0.5px",
          }}>
            {t("heroTitle1")}<br />
            <span style={{ color: "#1a211e" }}>{t("heroTitle2")}</span>
          </h1>

          <p style={{
            color: "rgba(255,255,255,0.82)", fontSize: "16px",
            maxWidth: "520px", lineHeight: 1.7, marginBottom: "8px",
          }}>
            {t("heroSub")}
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginBottom: "36px" }}>
            {t("heroMeta")}
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => router.push("/sell-online/signup")}
              style={{
                background: "#1a211e",
                color: "#fff", border: "none",
                padding: "13px 32px", borderRadius: "4px",
                fontSize: "15px", fontWeight: 700,
                cursor: "pointer", letterSpacing: "0.3px",
                boxShadow: "none",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(20,184,166,0.45)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(20,184,166,0.35)"; }}
            >
              {t("heroCta")}
            </button>
            <button
              onClick={() => router.push("/sell-online/pricing-commission")}
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "#fff", border: "1px solid rgba(255,255,255,0.35)",
                  padding: "13px 28px", borderRadius: "4px",
                fontSize: "14px", fontWeight: 600,
                cursor: "pointer", backdropFilter: "blur(8px)",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            >
              {t("heroPricing")}
            </button>
          </div>

          <div style={{ marginTop: "28px" }}>
            <LanguagePicker variant="dark" />
          </div>

          <div style={{ marginTop: "24px" }}>
            <button
              onClick={() => router.push("/sell-online/onboarding")}
              style={{
                background: "transparent",
                color: "rgba(255,255,255,0.7)",
                border: "none",
                fontSize: "13px",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
            >
              Already registered? Complete your seller setup →
            </button>
          </div>
        </div>
      </section>

   
      <section style={{ padding: "60px 24px", background: "#fff" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ color: "#1a211e", fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", marginBottom: "8px" }}>
              {t("whyLabel")}
            </div>
            <h2 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 800, color: "#1a211e" }}>
              {t("whyTitle")}
            </h2>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px",
          }}>
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "4px",
                  padding: "24px",
                  background: "#fff",
                  transition: "box-shadow 0.2s, transform 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "none"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{
                  width: "48px", height: "48px",
                  background: "#ccfbf1", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "22px", marginBottom: "14px",
                }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, color: "#1a211e", fontSize: "15px", marginBottom: "6px" }}>{f.title}</h3>
                <p style={{ color: "#475569", fontSize: "13px", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

  
      <section style={{ padding: "60px 24px", background: "#f8fafc" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ color: "#1a211e", fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", marginBottom: "8px" }}>
              {t("stepsLabel")}
            </div>
            <h2 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 800, color: "#1a211e" }}>
              {t("stepsTitle")}
            </h2>
          </div>


          <div style={{ display: "flex", gap: "0", alignItems: "flex-start", overflowX: "auto", paddingBottom: "8px" }}>
            {steps.map((s, i) => (
              <div key={s.n} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minWidth: "160px" }}>
                {/* Number + connector */}
                <div style={{ display: "flex", alignItems: "center", width: "100%", marginBottom: "16px" }}>
                  {i > 0 && (
                    <div style={{
                      flex: 1, height: "2px",
                      background: i <= activeStep ? s.color : "#e2e8f0",
                      transition: "background 0.4s",
                    }} />
                  )}
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "50%",
                    background: i <= activeStep ? s.color : "#e2e8f0",
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: "16px", flexShrink: 0,
                    transition: "background 0.4s",
                    boxShadow: i === activeStep ? `0 0 0 6px ${s.color}22` : "none",
                  }}>{s.n}</div>
                  {i < steps.length - 1 && (
                    <div style={{
                      flex: 1, height: "2px",
                      background: i < activeStep ? steps[i + 1].color : "#e2e8f0",
                      transition: "background 0.4s",
                    }} />
                  )}
                </div>
                <div style={{ textAlign: "center", padding: "0 8px" }}>
                  <div style={{ fontWeight: 700, color: "#1a211e", fontSize: "13px", marginBottom: "4px" }}>{s.title}</div>
                  <div style={{ color: "#475569", fontSize: "12px", lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <button
              onClick={() => router.push("/sell-online/signup")}
              style={{
                  background: "#1a211e", color: "#fff",
                  border: "none", padding: "13px 36px",
                  borderRadius: "4px", fontSize: "14px",
                  fontWeight: 700, cursor: "pointer",
                  letterSpacing: "0.3px",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  boxShadow: "none",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(20,184,166,0.45)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(20,184,166,0.35)"; }}
            >
              {t("stepsCta")}
            </button>
          </div>
        </div>
      </section>


      <section style={{ padding: "60px 24px", background: "#fff" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ color: "#1a211e", fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", marginBottom: "8px" }}>
              {t("testimonialsLabel")}
            </div>
            <h2 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 800, color: "#1a211e" }}>
              {t("testimonialsTitle")}
            </h2>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
            gap: "16px",
          }}>
            {testimonials.map((item, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "4px",
                  padding: "24px",
                  background: "#fff",
                  transition: "box-shadow 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
              >
          
                <div style={{ color: "#1a211e", fontSize: "14px", marginBottom: "12px" }}>(5 stars)</div>
                <p style={{
                  color: "#1a211e", fontSize: "14px",
                  lineHeight: 1.7, marginBottom: "16px",
                  fontStyle: "italic",
                }}>"{item.quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "50%",
                    background: "#1a211e", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "13px",
                  }}>{item.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#1a211e", fontSize: "13px" }}>{item.name}</div>
                    <div style={{ color: "#1a211e", fontSize: "12px" }}>{item.store}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{
          maxWidth: "900px", margin: "0 auto",
          display: "flex", flexWrap: "wrap",
          justifyContent: "center", gap: "0",
          padding: "0 24px",
        }}>
          {trustItems.map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "18px 28px",
              borderRight: i < trustItems.length - 1 ? "1px solid #e2e8f0" : "none",
              color: "#1a211e", fontSize: "13px", fontWeight: 600,
            }}>
              <span style={{ fontSize: "18px" }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </section>

  
      <section style={{
        background: "#1a211e",
        padding: "60px 24px", textAlign: "center",
      }}>
        <h2 style={{ color: "#fff", fontSize: "clamp(22px,3vw,34px)", fontWeight: 800, marginBottom: "12px" }}>
          {t("finalTitle")}
        </h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", marginBottom: "32px" }}>
          {t("finalSub")}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => router.push("/sell-online/signup")}
            style={{
              background: "#1a211e", color: "#fff",
              border: "none", padding: "14px 40px",
              borderRadius: "4px", fontSize: "15px",
              fontWeight: 700, cursor: "pointer",
              boxShadow: "none",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(20,184,166,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(20,184,166,0.35)"; }}
          >
            {t("finalCta")}
          </button>
          <button
            onClick={() => router.push("/sell-online/pricing-commission")}
            style={{
              background: "transparent", color: "#fff",
              border: "1px solid rgba(255,255,255,0.4)",
              padding: "14px 32px", borderRadius: "4px",
              fontSize: "14px", fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            {t("finalPricing")}
          </button>
        </div>
      </section>

    
      <div style={{
        background: "#1a211e", color: "#94a3b8",
        textAlign: "center", padding: "20px 16px",
        fontSize: "12px",
      }}>
   
        <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center" }}>
          <LanguagePicker variant="dark" />
        </div>
        {t("footerCopy")}
      </div>
    </div>
  );
}