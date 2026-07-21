"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

const POSITIONS = [
  { title: "Senior Frontend Engineer", dept: "Engineering", location: "Bangalore, India" },
  { title: "Product Marketing Manager", dept: "Marketing", location: "Mumbai, India" },
  { title: "UX/UI Designer", dept: "Design", location: "Remote" },
  { title: "Data Scientist", dept: "Data & Analytics", location: "Bangalore, India" },
];

export default function CareersPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white font-sans">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: '60vh' }}>
        <Image
          src="https://images.unsplash.com/photo-1522071901873-411886a10004?w=1600&q=80"
          alt="Careers at B2World"
          fill
          sizes="100vw"
          style={{ objectFit: "cover" }}
          className="absolute inset-0 opacity-40"
        />
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 py-24 min-h-[60vh]">
          <h1
            className="display-serif m-0 mb-6 max-w-[800px]"
            style={{ fontSize: 'clamp(40px, 6vw, 72px)' }}
          >
            Build the Future of Commerce
          </h1>
          <p className="text-white/70 text-[18px] m-0 max-w-[600px] leading-relaxed">
            Join our team of passionate individuals dedicated to shaping the digital economy and creating meaningful impact for millions.
          </p>
        </div>
      </section>

      {/* Culture Section */}
      <section className="py-20 md:py-32 bg-white text-[#1a211e]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10">
          <div className="text-center mb-16">
            <h2 className="display-serif text-[36px] md:text-[48px] mb-6">Life at B2World</h2>
            <p className="text-[#1a211e]/70 text-[16px] max-w-[700px] mx-auto leading-relaxed">
              We foster a culture of innovation, collaboration, and continuous learning. Here, your ideas matter, and your work directly contributes to our shared success.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Innovation First", desc: "We encourage bold ideas and empower you to experiment and push boundaries." },
              { title: "Inclusive Environment", desc: "Diversity is our strength. We celebrate different perspectives and backgrounds." },
              { title: "Growth Opportunities", desc: "We invest in your development with mentorship and continuous learning programs." }
            ].map((perk, i) => (
              <div key={i} className="p-8 border border-[#e0e0e0] rounded-lg hover:shadow-lg transition-shadow">
                <h3 className="text-[20px] font-bold mb-4">{perk.title}</h3>
                <p className="text-[#1a211e]/70 text-[15px] leading-relaxed">{perk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 md:py-32">
        <div className="max-w-[1000px] mx-auto px-5 md:px-10">
          <h2 className="display-serif text-[36px] md:text-[48px] mb-12 text-center">Open Positions</h2>
          
          <div className="flex flex-col gap-4">
            {POSITIONS.map((job, i) => (
              <div key={i} className="group flex flex-col md:flex-row md:items-center justify-between p-8 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                <div>
                  <h3 className="text-[20px] font-bold mb-2 group-hover:text-blue-400 transition-colors">{job.title}</h3>
                  <div className="flex gap-4 text-white/50 text-[14px]">
                    <span>{job.dept}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                  </div>
                </div>
                <button className="mt-4 md:mt-0 text-[14px] font-bold uppercase tracking-wider text-white/70 group-hover:text-white transition-colors">
                  Apply Now →
                </button>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-white/50 text-[15px] mb-6">Don&apos;t see a role that fits? We are always looking for great talent.</p>
            <button
              className="bg-white text-[#1a211e] border-none px-8 py-3.5 rounded text-[14px] font-bold uppercase cursor-pointer transition-opacity hover:opacity-90"
              style={{ letterSpacing: '0.057em' }}
            >
              Send Open Application
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
