"use client";

const VALUES = [
  {
    title: "Free Delivery",
    sub: "On orders above ₹499. We ship across all of India with tracking on every order.",
    img: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&q=80",
  },
  {
    title: "Easy Returns",
    sub: "7-day hassle-free returns. No questions asked — we stand behind every product.",
    img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
  },
  {
    title: "Secure Payments",
    sub: "100% protected checkout with end-to-end encryption and trusted payment partners.",
    img: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80",
  },
];

export default function TrustBadges() {
  return (
    <section className="py-16 md:py-24 bg-[#eef1f0]">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10">
        {/* Section heading */}
        <h2
          className="display-serif text-[#1a211e] m-0 mb-12"
          style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}
        >
          Why B2World —
        </h2>

        {/* 3-column editorial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VALUES.map((v) => (
            <div key={v.title} className="group">
              {/* Image */}
              <div className="aspect-[4/3] overflow-hidden rounded-lg mb-5 bg-[#e0e0e0]">
                <img
                  src={v.img}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              {/* Text */}
              <h3 className="text-[20px] font-bold text-[#1a211e] m-0 mb-2 uppercase tracking-[0.03em]">
                {v.title}
              </h3>
              <p className="text-[15px] text-[#606562] m-0 leading-relaxed">
                {v.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
