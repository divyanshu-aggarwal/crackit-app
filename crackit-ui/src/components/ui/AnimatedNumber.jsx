import { useEffect, useState } from 'react'

export default function AnimatedNumber({ value = 0, duration = 1000, suffix = '' }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let startTime = null
    const startValue = 0
    const endValue = Number(value) || 0

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const current = Math.round(startValue + (endValue - startValue) * progress)

      setDisplay(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return (
    <span>
      {display}{suffix}
    </span>
  )
}