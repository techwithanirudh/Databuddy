"use client"

import { useEffect, useRef } from "react"

export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    let animationId: number

    // Set canvas dimensions
    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }

    // Create stars
    const stars: { x: number; y: number; size: number; alpha: number; twinkleSpeed: number }[] = []
    const initStars = () => {
      stars.length = 0
      for (let i = 0; i < 200; i++) {
        const size = Math.random() * 1.8
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: size,
          alpha: Math.random() * 0.6 + 0.1,
          twinkleSpeed: Math.random() * 0.01
        })
      }
    }

    // Apply fish-eye distortion to create a globe effect
    const applyFishEye = (x: number, y: number, centerX: number, centerY: number, radius: number, strength: number) => {
      const dx = x - centerX
      const dy = y - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < radius) {
        // Calculate the fish-eye effect
        const distortionFactor = 1 - Math.pow(distance / radius, 2) * strength
        const distortedX = centerX + dx * distortionFactor
        const distortedY = centerY + dy * distortionFactor
        return { x: distortedX, y: distortedY }
      }
      
      return { x, y }
    }

    // Create nebula gradients with darker blue/teal tones
    let nebulae = [
      { 
        x: width * 0.2, 
        y: height * 0.3, 
        radius: width * 0.4, 
        color1: 'rgba(56, 189, 248, 0.1)',
        color2: 'rgba(56, 189, 248, 0)'
      },
      { 
        x: width * 0.8, 
        y: height * 0.7, 
        radius: width * 0.5, 
        color1: 'rgba(22, 78, 99, 0.08)',
        color2: 'rgba(22, 78, 99, 0)'
      },
      { 
        x: width * 0.5, 
        y: height * 0.1, 
        radius: width * 0.3, 
        color1: 'rgba(34, 211, 238, 0.07)',
        color2: 'rgba(34, 211, 238, 0)'
      }
    ]

    const velocities = [
      { x: 0.02, y: 0.015 },
      { x: -0.02, y: 0.025 },
      { x: 0.015, y: -0.02 }
    ]

    const boundaries = {
      x: { min: width * 0.1, max: width * 0.9 },
      y: { min: height * 0.1, max: height * 0.9 }
    }

    // Draw globe with fish-eye effect
    const drawGlobe = (now: number) => {
      const GRID_SPACING = 30
      
      // Globe parameters
      const centerX = width * 0.75
      const centerY = height * 0.5
      const radius = Math.min(width, height) * 0.3
      const strength = 0.5
      
      // Calculate rotation based on time
      const rotation = now * 0.00005
      
      // Draw the globe grid
      const rows = Math.ceil(radius * 2 / GRID_SPACING) + 4
      const cols = Math.ceil(radius * 2 / GRID_SPACING) + 4
      
      // Calculate the start position to center the grid on the globe center
      const startX = centerX - (cols * GRID_SPACING) / 2
      const startY = centerY - (rows * GRID_SPACING) / 2
      
      // Draw dots and lines with moderate opacity
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          // Apply rotation to simulate globe rotation
          const originalX = startX + i * GRID_SPACING
          const originalY = startY + j * GRID_SPACING
          
          // Calculate distance from center for culling
          const dx = originalX - centerX
          const dy = originalY - centerY
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          // Skip if too far from globe center
          if (distance > radius * 1.3) continue
          
          // Apply fish-eye distortion
          const { x, y } = applyFishEye(originalX, originalY, centerX, centerY, radius, strength)
          
          // Skip if outside canvas
          if (x < 0 || x > width || y < 0 || y > height) continue
          
          // Determine opacity based on position on globe
          // Front-facing dots should be brighter
          const normalizedDistance = distance / radius
          const baseOpacity = 0.12 * (1 - normalizedDistance)
          
          // Adjust opacity based on longitude to simulate 3D
          const longitude = Math.atan2(dy, dx) + rotation
          const longitudeFactor = (Math.cos(longitude) + 1) / 2
          const finalOpacity = baseOpacity * (longitudeFactor * 0.7 + 0.3)
          
          if (finalOpacity <= 0.01) continue
          
          // Draw dots
          const dotSize = (i % 4 === 0 && j % 4 === 0) ? 1.5 : 1
          ctx.fillStyle = `rgba(56, 189, 248, ${finalOpacity + 0.08})`
          ctx.beginPath()
          ctx.arc(x, y, dotSize, 0, Math.PI * 2)
          ctx.fill()
          
          // Draw horizontal lines
          if (i < cols - 1) {
            const nextOriginalX = startX + (i + 1) * GRID_SPACING
            const nextOriginalY = startY + j * GRID_SPACING
            
            // Skip if next point is too far from center
            const nextDx = nextOriginalX - centerX
            const nextDy = nextOriginalY - centerY
            const nextDistance = Math.sqrt(nextDx * nextDx + nextDy * nextDy)
            
            if (nextDistance <= radius * 1.3) {
              const next = applyFishEye(nextOriginalX, nextOriginalY, centerX, centerY, radius, strength)
              
              // Only draw if both points are visible
              if (next.x >= 0 && next.x <= width && next.y >= 0 && next.y <= height) {
                ctx.beginPath()
                ctx.strokeStyle = `rgba(56, 189, 248, ${finalOpacity * 0.4})`
                ctx.lineWidth = 0.5
                ctx.moveTo(x, y)
                ctx.lineTo(next.x, next.y)
                ctx.stroke()
              }
            }
          }
          
          // Draw vertical lines
          if (j < rows - 1) {
            const nextOriginalX = startX + i * GRID_SPACING
            const nextOriginalY = startY + (j + 1) * GRID_SPACING
            
            // Skip if next point is too far from center
            const nextDx = nextOriginalX - centerX
            const nextDy = nextOriginalY - centerY
            const nextDistance = Math.sqrt(nextDx * nextDx + nextDy * nextDy)
            
            if (nextDistance <= radius * 1.3) {
              const next = applyFishEye(nextOriginalX, nextOriginalY, centerX, centerY, radius, strength)
              
              // Only draw if both points are visible
              if (next.x >= 0 && next.x <= width && next.y >= 0 && next.y <= height) {
                ctx.beginPath()
                ctx.strokeStyle = `rgba(56, 189, 248, ${finalOpacity * 0.4})`
                ctx.lineWidth = 0.5
                ctx.moveTo(x, y)
                ctx.lineTo(next.x, next.y)
                ctx.stroke()
              }
            }
          }
        }
      }
      
      // Add subtle glow around the globe
      const gradientRadius = radius * 1.5
      const glow = ctx.createRadialGradient(
        centerX, centerY, radius * 0.8,
        centerX, centerY, gradientRadius
      )
      glow.addColorStop(0, 'rgba(56, 189, 248, 0.03)')
      glow.addColorStop(1, 'rgba(56, 189, 248, 0)')
      
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(centerX, centerY, gradientRadius, 0, Math.PI * 2)
      ctx.fill()
    }

    const drawStars = (now: number) => {
      stars.forEach(star => {
        // Create smooth twinkling effect using time
        const flicker = Math.sin(now * star.twinkleSpeed) * 0.3 + 0.7
        const alpha = star.alpha * flicker
        
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Create larger accent stars
    const accentStars: { x: number; y: number; size: number; color: string; glow: string; pulse: number; pulseSpeed: number }[] = []
    const initAccentStars = () => {
      accentStars.length = 0
      for (let i = 0; i < 15; i++) {
        const size = 2 + Math.random() * 2.5
        accentStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: size,
          color: "rgba(56, 189, 248, 0.6)",
          glow: "rgba(56, 189, 248, 0.1)",
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.001 + Math.random() * 0.002
        })
      }
    }

    const drawAccentStars = (now: number) => {
      accentStars.forEach(star => {
        // Create a pulsing effect
        const pulse = Math.sin(star.pulse + now * star.pulseSpeed) * 0.2 + 0.8
        
        // Main star
        ctx.fillStyle = star.color
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size * pulse, 0, Math.PI * 2)
        ctx.fill()
        
        // Glow effect
        ctx.fillStyle = star.glow
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size * 3 * pulse, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Shooting stars
    const shootingStars: { x: number; y: number; length: number; speed: number; angle: number; alpha: number; width: number }[] = []
    
    const createShootingStar = () => {
      if (Math.random() > 0.988) {
        const angle = Math.random() * Math.PI * 2
        shootingStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: Math.random() * 80 + 20,
          speed: Math.random() * 6 + 8,
          angle: angle,
          alpha: 0.8,
          width: Math.random() * 1.5 + 1
        })
      }
    }

    const drawShootingStars = () => {
      // Create a new array with just the active shooting stars
      const activeStars: typeof shootingStars = []
      
      shootingStars.forEach(star => {
        star.alpha -= 0.01
        star.x += Math.cos(star.angle) * star.speed
        star.y += Math.sin(star.angle) * star.speed
        
        if (star.alpha <= 0) return // Skip to next star
        
        activeStars.push(star) // Keep this star
        
        // Create gradient trail
        const gradient = ctx.createLinearGradient(
          star.x, star.y,
          star.x - Math.cos(star.angle) * star.length, 
          star.y - Math.sin(star.angle) * star.length
        )
        
        gradient.addColorStop(0, `rgba(56, 189, 248, ${star.alpha * 0.8})`)
        gradient.addColorStop(1, `rgba(56, 189, 248, 0)`)
        
        ctx.globalAlpha = star.alpha
        ctx.strokeStyle = gradient
        ctx.lineWidth = star.width
        ctx.beginPath()
        ctx.moveTo(star.x, star.y)
        ctx.lineTo(
          star.x - Math.cos(star.angle) * star.length,
          star.y - Math.sin(star.angle) * star.length
        )
        ctx.stroke()
        ctx.globalAlpha = 1
      })
      
      // Replace the original array with just the active stars
      shootingStars.length = 0
      shootingStars.push(...activeStars)
    }

    const animate = (timestamp: number) => {
      ctx.clearRect(0, 0, width, height)
      
      // Background gradient - much darker blue tones
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
      bgGradient.addColorStop(0, 'rgb(1, 3, 15)')
      bgGradient.addColorStop(0.5, 'rgb(2, 8, 28)')
      bgGradient.addColorStop(1, 'rgb(0, 4, 12)')
      
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)
      
      // Create separate buffer for nebulae to avoid overdraw
      const nebulaCanvas = document.createElement('canvas')
      nebulaCanvas.width = width
      nebulaCanvas.height = height
      const nebulaCtx = nebulaCanvas.getContext('2d')
      
      if (nebulaCtx) {
        // Draw nebulae to buffer
        nebulae.forEach((nebula, i) => {
          const velocity = velocities[i]
          
          // Update position with slight movement
          nebula.x += velocity.x
          nebula.y += velocity.y
          
          // Boundary check and reverse direction
          if (nebula.x <= boundaries.x.min || nebula.x >= boundaries.x.max) {
            velocities[i].x *= -1
          }
          if (nebula.y <= boundaries.y.min || nebula.y >= boundaries.y.max) {
            velocities[i].y *= -1
          }
          
          // Draw nebula
          const radialGradient = nebulaCtx.createRadialGradient(
            nebula.x, nebula.y, 0,
            nebula.x, nebula.y, nebula.radius
          )
          
          radialGradient.addColorStop(0, nebula.color1)
          radialGradient.addColorStop(1, nebula.color2)
          
          nebulaCtx.fillStyle = radialGradient
          nebulaCtx.fillRect(0, 0, width, height)
        })
        
        // Add nebula buffer to main canvas once
        ctx.drawImage(nebulaCanvas, 0, 0)
      }
      
      // Draw the globe
      drawGlobe(timestamp)
      
      // Draw stars with time-based animation
      drawStars(timestamp)
      
      // Draw accent stars with time-based animation
      drawAccentStars(timestamp)
      
      // Create and draw shooting stars
      createShootingStar()
      drawShootingStars()
      
      animationId = requestAnimationFrame(animate)
    }

    // Initialize and start animation
    const init = () => {
      resize()
      initStars()
      initAccentStars()
      animationId = requestAnimationFrame(animate)
    }
    
    init()
    
    // Handle resize
    const handleResize = () => {
      // Cancel the existing animation frame
      cancelAnimationFrame(animationId)
      
      // Update dimensions
      resize()
      initStars()
      initAccentStars()
      
      // Update nebulae positions and boundaries on resize
      nebulae = [
        { 
          x: width * 0.2, 
          y: height * 0.3, 
          radius: width * 0.4, 
          color1: 'rgba(56, 189, 248, 0.1)', 
          color2: 'rgba(56, 189, 248, 0)' 
        },
        { 
          x: width * 0.8, 
          y: height * 0.7, 
          radius: width * 0.5, 
          color1: 'rgba(22, 78, 99, 0.08)', 
          color2: 'rgba(22, 78, 99, 0)' 
        },
        { 
          x: width * 0.5, 
          y: height * 0.1, 
          radius: width * 0.3, 
          color1: 'rgba(34, 211, 238, 0.07)', 
          color2: 'rgba(34, 211, 238, 0)' 
        }
      ]
      
      boundaries.x = { min: width * 0.1, max: width * 0.9 }
      boundaries.y = { min: height * 0.1, max: height * 0.9 }
      
      // Restart animation
      animationId = requestAnimationFrame(animate)
    }
    
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10"
    />
  )
}

