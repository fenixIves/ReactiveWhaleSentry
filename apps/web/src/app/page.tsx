"use client";
import Navigation from "@/app/components/Navigation";
import Hero from "@/sections/Hero";
import Features from "@/sections/Features";
import Technology from "@/sections/Technology";
import Pricing from "@/sections/Pricing";
import Contact from "@/sections/Contact";
import Footer from "@/sections/Footer";
import './App.css';
import OceanBackground from "@/app/components/OceanBackground";
import { useEffect, useState } from "react";




export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);


  return (
    <div className={`relative min-h-screen bg-black transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>

        <OceanBackground />

        <div className="noise-overlay" />

        <Navigation />

        <main className="relative z-10">
          <Hero />
          <Features />
          <Technology />
          <Pricing />
          <Contact />
        </main>

        <Footer />

    </div>
  );
}
