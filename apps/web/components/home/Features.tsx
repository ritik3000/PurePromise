"use client";

import { motion } from "framer-motion";
import { Camera, Wand2, Users, Clock } from "lucide-react";

const features = [
  {
    icon: <Camera className="w-6 h-6" />,
    title: "Wedding-Ready Quality",
    description: "Professional pre-wedding couple photos generated in seconds",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: <Wand2 className="w-6 h-6" />,
    title: "Magic Editing",
    description: "Advanced AI tools to perfect every detail",
    gradient: "from-pink-500 to-rose-400",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Couple Collections",
    description: "Create stunning pre-wedding photos for couples",
    gradient: "from-amber-500 to-rose-500",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Instant Delivery",
    description: "Get your pre-wedding photos in minutes, not days",
    gradient: "from-rose-400 to-amber-400",
  },
];

export function Features() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.8 }}
      className="mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
    >
      {features.map((feature, index) => (
        <motion.div
          key={index}
          whileHover={{ y: -10 }}
          className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm hover:bg-rose-500/5 dark:hover:bg-white/10 transition-all duration-300 border dark:border-white/10 border-rose-200/30 dark:border-rose-500/10 group"
        >
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} p-0.5 mb-4 group-hover:scale-110 transition-transform duration-300`}
          >
            <div className="w-full h-full bg-neutral-950 dark:bg-neutral-900 rounded-[10px] flex items-center justify-center text-white">
              {feature.icon}
            </div>
          </div>
            <h3 className="text-xl font-semibold mb-2 dark:bg-gradient-to-r dark:from-white dark:to-neutral-300 bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
            {feature.title}
            </h3>
          <p className="text-muted-foreground">{feature.description}</p>
        </motion.div>
      ))}
    </motion.div>
  );
} 