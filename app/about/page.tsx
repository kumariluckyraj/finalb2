"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white font-sans text-[#1a211e]">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: '60vh' }}>
        <Image
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&q=80"
          alt="About B2World"
          fill
          sizes="100vw"
          style={{ objectFit: "cover" }}
          className="absolute inset-0"
        />
        <div className="absolute inset-0 bg-[#0c0c0c]/70" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 py-24 min-h-[60vh]">
          <h1
            className="display-serif text-white m-0 mb-6 max-w-[800px]"
            style={{ fontSize: 'clamp(40px, 6vw, 72px)' }}
          >
            Empowering Commerce in India
          </h1>
          <p className="text-white/80 text-[18px] m-0 max-w-[600px] leading-relaxed">
            B2World is more than just a marketplace. We are a platform that connects millions of buyers and sellers across the country, creating opportunities and fostering growth.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="display-serif text-[32px] md:text-[48px] mb-8">Our Mission</h2>
              <p className="text-[#1a211e]/70 text-[16px] leading-relaxed mb-6">
                To democratize commerce in India by providing a world-class platform that enables anyone, anywhere, to start and grow their business online. We believe in the power of technology to bridge gaps and create equal opportunities for all.
              </p>
              <p className="text-[#1a211e]/70 text-[16px] leading-relaxed">
                Since our inception, we have been committed to delivering unparalleled value to our customers, ensuring a seamless and secure shopping experience with access to a vast array of high-quality products.
              </p>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32d7?w=800&q=80"
                alt="Our Mission"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-24 text-center">
        <h2 className="display-serif text-[36px] mb-6">Join Our Journey</h2>
        <p className="text-[#1a211e]/70 text-[16px] max-w-[500px] mx-auto mb-10">
          Whether you want to shop for the best products or grow your business as a seller, B2World is here for you.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push("/products")}
            className="bg-[#1a211e] text-white border-none px-8 py-3.5 rounded text-[14px] font-bold uppercase cursor-pointer transition-opacity hover:opacity-90"
            style={{ letterSpacing: '0.057em' }}
          >
            Start Shopping
          </button>
          <button
            onClick={() => router.push("/sell-online")}
            className="bg-transparent text-[#1a211e] border border-[#1a211e] px-8 py-3.5 rounded text-[14px] font-bold uppercase cursor-pointer transition-all hover:bg-[#1a211e] hover:text-white"
            style={{ letterSpacing: '0.057em' }}
          >
            Become a Seller
          </button>
        </div>
      </section>
    </div>
  );
}
