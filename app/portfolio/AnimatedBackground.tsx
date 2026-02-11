"use client"

import { motion } from "framer-motion"

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Animated illumination orbs */}
      <motion.div
        className="absolute h-[500px] w-[100vw] rounded-full bg-primary/20"
        style={{
          filter: "blur(100px)",
        }}
        animate={{
          x: ["-20%", "80%", "30%", "90%", "-20%"],
          y: ["-20%", "70%", "20%", "85%", "-20%"],
          scale: [1, 1.5, 1.2, 1.3, 1],
          opacity: [0.4, 0.7, 0.5, 0.6, 0.4],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute h-[400px] w-[400px] rounded-full bg-primary/25"
        style={{
          filter: "blur(90px)",
        }}
        animate={{
          x: ["100%", "10%", "70%", "-10%", "100%"],
          y: ["80%", "30%", "-5%", "60%", "80%"],
          scale: [1.2, 1, 1.4, 1.1, 1.2],
          opacity: [0.5, 0.8, 0.6, 0.7, 0.5],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      <motion.div
        className="absolute h-[450px] w-[450px] rounded-full bg-primary/15"
        style={{
          filter: "blur(120px)",
        }}
        animate={{
          x: ["50%", "-15%", "85%", "20%", "50%"],
          y: ["-10%", "50%", "90%", "15%", "-10%"],
          scale: [1, 1.3, 1.1, 1.4, 1],
          opacity: [0.3, 0.6, 0.4, 0.7, 0.3],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
    </div>
  )
}
