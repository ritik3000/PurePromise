"use client";

import { BackgroundEffects } from "./BackgroundEffects";
import { HeroHeader } from "./HeroHeader";
import { Features } from "./Features";
import { Testimonials } from "./Testimonials";
import { ImageCarousel } from "./ImageCarousel";
import { SignInButton, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollIndicator } from "./ScrollIndicator";
import { StatsSection } from "./StatsSection";
import { HowItWorks } from "./HowItWorks";
// import { TrustedBy } from "./TrustedBy";

export function Hero() {
  return (
    <div className="dark:bg-[hsl(260,18%,4%)]">
      <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-950 via-purple-950/90 to-neutral-950 text-white overflow-hidden">
        <BackgroundEffects />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 mt-10">
          <HeroHeader />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-16 space-y-32"
          >
            {/* <TrustedBy /> */}

            <section className="relative">
              <div className="absolute rounded-3xl inset-0 dark:bg-gradient-to-b from-transparent via-black/5 to-black/20 pointer-events-none" />
              <ImageCarousel />
            </section>

            <HowItWorks />

            <StatsSection />

            <section id="features" className="relative">
              <div className="absolute inset-0 dark:bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
              <Features />
            </section>

            <section className="relative">
              <div className="absolute inset-0 dark:bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
              <Testimonials />
            </section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative py-20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/15 via-pink-500/15 to-amber-500/10 blur-3xl dark:from-rose-500/20 dark:via-pink-500/20 dark:to-amber-500/15" />
              <div className="relative text-center max-w-3xl mx-auto space-y-8">
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 dark:from-rose-400 dark:via-pink-400 dark:to-amber-300 bg-clip-text text-transparent">
                  Start Creating Your Pre-Wedding Photos Today
                </h2>
                <p className="text-muted-foreground text-xl">
                  Join couples who have already created beautiful
                  pre-wedding memories with our AI technology.
                </p>

                <SignedOut>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                      asChild
                      size="lg"
                      className="group bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg shadow-rose-900/20"
                    >
                      <SignInButton mode="modal">
                        <span className="flex items-center">
                          Get Started Free
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </SignInButton>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="text-black dark:text-white"
                      onClick={() =>
                        document
                          .getElementById("features")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                    >
                      Learn More
                    </Button>
                  </div>
                </SignedOut>

                  <div className="pt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex items-center text-rose-400 dark:text-rose-300">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Free to use
                    </span>
                    <span className="hidden sm:inline text-muted-foreground">•</span>
                    <span className="flex items-center text-pink-400 dark:text-pink-300">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Get started in seconds
                    </span>
                  </div>
                </div>
              </div>
            </motion.section>
          </motion.div>
        </div>

        <ScrollIndicator />
      </div>
    </div>
  );
}
