'use client'

import { Button } from "@/components/ui/button"
import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface NeonButtonProps extends ComponentProps<typeof Button> {
  glowColor?: "cyan" | "indigo"
}

export function NeonButton({ children, className, glowColor = "cyan", ...props }: NeonButtonProps) {
  const colors = glowColor === "cyan"
    ? {
        shadow: "shadow-[0_0_20px_rgba(0,245,255,0.25)]",
        hoverShadow: "hover:shadow-[0_0_40px_rgba(0,245,255,0.5)]",
        pulse: "rgba(0,245,255,0.6)",
        wave: "rgba(0,245,255,0.15)",
      }
    : {
        shadow: "shadow-[0_0_20px_rgba(99,102,241,0.25)]",
        hoverShadow: "hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]",
        pulse: "rgba(99,102,241,0.6)",
        wave: "rgba(99,102,241,0.15)",
      }

  return (
    <motion.div
      whileHover={{ scale: 1.015, y: -1 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="relative group"
    >
      {/* Glow pulse behind button */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
        style={{ background: colors.wave }}
      />
      <Button
        className={cn(
          "relative overflow-hidden transition-all duration-500 font-medium tracking-wide",
          colors.shadow,
          colors.hoverShadow,
          className
        )}
        {...props}
      >
        {/* Hover energy wave sweep */}
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </Button>
    </motion.div>
  )
}
