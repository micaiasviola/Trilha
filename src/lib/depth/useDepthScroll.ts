'use client'

import { useEffect, useRef } from 'react'
import { DepthScrollEngine, type DepthScrollOptions } from './depthScrollEngine'

export function useDepthScroll(options: DepthScrollOptions = {}) {
  const ref = useRef<HTMLElement | null>(null)
  const engineRef = useRef<DepthScrollEngine | null>(null)
  const optsRef = useRef(options)
  optsRef.current = options // keep callbacks fresh without re-creating the engine

  const { length, layerCount, source, captureMode, snap, keyboard } = options

  useEffect(() => {
    if (typeof window === 'undefined' || !ref.current) return
    const engine = new DepthScrollEngine(ref.current, {
      ...optsRef.current,
      onUpdate: (s) => optsRef.current.onUpdate?.(s),
      onLayerChange: (i) => optsRef.current.onLayerChange?.(i),
    })
    engineRef.current = engine
    engine.start()
    return () => engine.destroy()
  }, [length, layerCount, source, captureMode, snap, keyboard]) // eslint-disable-line react-hooks/exhaustive-deps

  return { ref, engine: engineRef }
}
