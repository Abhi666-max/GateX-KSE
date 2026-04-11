'use client'

import { cn } from "@/lib/utils"
import { ReactNode, useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

interface GlassCardProps {
  children: ReactNode
  className?: string
  hoverEffect?: boolean
  delay?: number
  glowColor?: "cyan" | "indigo" | "none"
}

export function GlassCard({
  children,
  className,
  hoverEffect = true,
  delay = 0,
  glowColor = "none",
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  // Smooth spring for the light reflection
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 })

  // Dynamic light reflection that follows the cursor
  const lightGradient = useTransform(
    [springX, springY],
    ([x, y]) =>
      `radial-gradient(600px circle at ${(x as number) * 100}% ${(y as number) * 100}%, rgba(255,255,255,0.04), transparent 60%)`
  )

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || !hoverEffect) return
    const rect = ref.current.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width)
    mouseY.set((e.clientY - rect.top) / rect.height)
  }

  const glowBorder =
    glowColor === "cyan"
      ? "ring-1 ring-primary/20"
      : glowColor === "indigo"
      ? "ring-1 ring-secondary/20"
      : ""

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      className={cn(
        "glass-card relative overflow-hidden",
        hoverEffect && "glass-card-hover cursor-default",
        glowBorder,
        className
      )}
    >
      {/* Dynamic light reflection layer */}
      {hoverEffect && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ background: lightGradient }}
        />
      )}
      {/* Top edge highlight */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">{children}</div>
    </motion.div>
  )
}
