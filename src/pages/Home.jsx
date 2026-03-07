import React from "react";
import ParticlesBackground from "@/components/radio/ParticlesBackground";
import Header from "@/components/radio/Header";
import RadioPlayer from "@/components/radio/RadioPlayer";
import VideoStream from "@/components/radio/VideoStream";
import DJProfile from "@/components/radio/DJProfile";
import Footer from "@/components/radio/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white relative">
      <ParticlesBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <Header />

        <div className="space-y-6 md:space-y-8">
          {/* Radio Player - Full Width */}
          <section>
            <RadioPlayer />
          </section>

          {/* Video + DJ Profile Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <section>
              <VideoStream />
            </section>
            <section>
              <DJProfile />
            </section>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}