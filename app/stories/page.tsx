"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

const STORIES = [
  {
    id: 1,
    title: "From Local Crafts to Global Reach",
    category: "Seller Success",
    image: "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&q=80",
    excerpt: "How a small artisan family in Jaipur scaled their traditional crafts business 10x using B2World's seller tools.",
    date: "July 12, 2026"
  },
  {
    id: 2,
    title: "Sustainability in eCommerce Delivery",
    category: "Initiatives",
    image: "https://images.unsplash.com/photo-1586528116311-ad8ed7c83a56?w=800&q=80",
    excerpt: "Our journey towards achieving 100% electric vehicle deliveries in top metro cities.",
    date: "June 28, 2026"
  },
  {
    id: 3,
    title: "Empowering Women Entrepreneurs",
    category: "Community",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80",
    excerpt: "Spotlighting the incredible women leading successful stores on our platform and inspiring others.",
    date: "June 15, 2026"
  },
  {
    id: 4,
    title: "The Tech Behind Our Recommendation Engine",
    category: "Technology",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
    excerpt: "A deep dive into how our machine learning models personalize your shopping experience.",
    date: "May 30, 2026"
  }
];

export default function StoriesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-[#1a211e] font-sans">
      {/* Header */}
      <section className="bg-[#f8f9fa] py-20 md:py-32 border-b border-[#e0e0e0]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 text-center">
          <h1
            className="display-serif m-0 mb-6"
            style={{ fontSize: 'clamp(40px, 6vw, 64px)' }}
          >
            B2World Stories
          </h1>
          <p className="text-[#1a211e]/70 text-[18px] m-0 max-w-[600px] mx-auto leading-relaxed">
            Discover the people, ideas, and technologies that are shaping the future of commerce with B2World.
          </p>
        </div>
      </section>

      {/* Featured Story */}
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10">
          <div className="group cursor-pointer flex flex-col md:flex-row gap-10 items-center bg-[#1a211e] text-white rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="relative w-full md:w-1/2 h-[300px] md:h-[450px] overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=1000&q=80"
                alt="Featured Story"
                fill
                style={{ objectFit: "cover" }}
                className="group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="w-full md:w-1/2 p-8 md:p-12">
              <div className="text-white/60 text-[13px] font-bold uppercase tracking-widest mb-4">
                Featured • Inside B2World
              </div>
              <h2 className="display-serif text-[32px] md:text-[42px] mb-6 leading-tight">
                Reimagining the Shopping Experience for the Next Billion Users
              </h2>
              <p className="text-white/80 text-[16px] leading-relaxed mb-8">
                Learn how our design and engineering teams collaborated to build a more intuitive, accessible, and faster B2World app tailored for emerging markets.
              </p>
              <button className="text-white font-bold text-[14px] uppercase tracking-wider group-hover:text-blue-400 transition-colors flex items-center gap-2">
                Read Full Story <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stories Grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10">
          <h3 className="display-serif text-[32px] mb-12">Latest Articles</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
            {STORIES.map((story) => (
              <div key={story.id} className="group cursor-pointer">
                <div className="relative h-[300px] rounded-lg overflow-hidden mb-6">
                  <Image
                    src={story.image}
                    alt={story.title}
                    fill
                    style={{ objectFit: "cover" }}
                    className="group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="flex items-center gap-4 text-[13px] font-bold text-[#1a211e]/50 uppercase tracking-wider mb-3">
                  <span>{story.category}</span>
                  <span>•</span>
                  <span>{story.date}</span>
                </div>
                <h4 className="text-[24px] font-bold mb-3 group-hover:text-blue-600 transition-colors leading-snug">
                  {story.title}
                </h4>
                <p className="text-[#1a211e]/70 text-[15px] leading-relaxed line-clamp-2">
                  {story.excerpt}
                </p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <button
              className="bg-transparent text-[#1a211e] border border-[#1a211e] px-8 py-3.5 rounded text-[14px] font-bold uppercase cursor-pointer transition-all hover:bg-[#1a211e] hover:text-white"
              style={{ letterSpacing: '0.057em' }}
            >
              Load More Stories
            </button>
          </div>
        </div>
      </section>
      
      {/* Newsletter Signup */}
      <section className="py-20 bg-[#0c0c0c] text-white text-center">
        <div className="max-w-[600px] mx-auto px-5">
          <h2 className="display-serif text-[36px] mb-4">Never Miss a Story</h2>
          <p className="text-white/60 mb-8">Get the latest news and insights delivered straight to your inbox.</p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded outline-none text-white placeholder:text-white/40 focus:border-white/50"
            />
            <button
              className="bg-white text-[#1a211e] border-none px-6 py-3 rounded text-[14px] font-bold uppercase cursor-pointer transition-opacity hover:opacity-90"
              style={{ letterSpacing: '0.057em' }}
            >
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
