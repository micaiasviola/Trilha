const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export interface DepthScrollOptions {
  length?: number
  smoothing?: number
  wheelSpeed?: number
  touchSpeed?: number
  velocityDamping?: number
  velocityMax?: number
  source?: 'capture' | 'page'
  captureMode?: 'always' | 'while-hovered' | 'until-bounds'
  invert?: boolean
  parallax?: boolean
  snap?: boolean
  snapDelay?: number
  /** Discrete wheel: each wheel gesture advances exactly one layer (no skipping). */
  wheelStep?: boolean
  /** Min ms gap between wheel events to treat them as a *new* gesture. */
  stepGap?: number
  /** Min accumulated wheel delta (px) before a step fires (filters jitter). */
  stepThreshold?: number
  keyboard?: boolean
  layerCount?: number
  writeCssVars?: boolean
  autoPauseOffscreen?: boolean
  onUpdate?: (s: { progress: number; velocity: number; velocityAbs: number; current: number }) => void
  onLayerChange?: (index: number) => void
}

type ResolvedOptions = Required<DepthScrollOptions>

export class DepthScrollEngine {
  target: HTMLElement
  inputTarget: EventTarget
  o: ResolvedOptions
  targetValue: number
  current: number
  previous: number
  velocity: number
  progress: number
  activeLayer: number
  isHovered: boolean
  isVisible: boolean
  running: boolean
  sleeping: boolean
  idleFrames: number
  rafId: number | null
  touchY: number
  lastInputTime: number
  pointerTarget: { x: number; y: number }
  pointer: { x: number; y: number }
  reducedMotion: boolean
  private _io?: IntersectionObserver
  // last values written to CSS vars — dedupe to skip redundant style recalc
  private _w: { p: number; v: number; s: number; px: number; py: number }
  // discrete-wheel gesture state (wheelStep mode)
  private _wheelLastTs: number
  private _wheelAccum: number
  private _wheelFired: boolean

  constructor(target: HTMLElement, options: DepthScrollOptions = {}) {
    this.target = target
    const isRoot =
      target === document.body || target === (document.documentElement as HTMLElement)
    this.inputTarget = isRoot ? window : target

    this.o = {
      length: 1000,
      smoothing: 0.08,
      wheelSpeed: 1,
      touchSpeed: 1.8,
      velocityDamping: 0.12,
      velocityMax: 1.5,
      source: 'capture',
      captureMode: isRoot ? 'always' : 'until-bounds',
      invert: false,
      parallax: true,
      snap: false,
      snapDelay: 160,
      wheelStep: false,
      stepGap: 220,
      stepThreshold: 20,
      keyboard: false,
      layerCount: 0,
      writeCssVars: true,
      autoPauseOffscreen: true,
      onUpdate: null as unknown as ResolvedOptions['onUpdate'],
      onLayerChange: null as unknown as ResolvedOptions['onLayerChange'],
      ...options,
    }

    this.targetValue = 0
    this.current = 0
    this.previous = 0
    this.velocity = 0
    this.progress = 0
    this.activeLayer = -1
    this.isHovered = false
    this.isVisible = true
    this.running = false
    this.sleeping = false
    this.idleFrames = 0
    this.rafId = null
    this.touchY = 0
    this.lastInputTime = 0
    this.pointerTarget = { x: 0, y: 0 }
    this.pointer = { x: 0, y: 0 }
    this._w = { p: NaN, v: NaN, s: NaN, px: NaN, py: NaN }
    this._wheelLastTs = 0
    this._wheelAccum = 0
    this._wheelFired = false

    this.reducedMotion =
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches

    this._tick = this._tick.bind(this)
    this._onWheel = this._onWheel.bind(this)
    this._onTouchStart = this._onTouchStart.bind(this)
    this._onTouchMove = this._onTouchMove.bind(this)
    this._onPointerMove = this._onPointerMove.bind(this)
    this._onPointerEnter = this._onPointerEnter.bind(this)
    this._onPointerLeave = this._onPointerLeave.bind(this)
    this._onVisibility = this._onVisibility.bind(this)
    this._onKeyDown = this._onKeyDown.bind(this)
  }

  start() {
    if (this.running) return
    this.running = true
    this.sleeping = false
    this.idleFrames = 0
    this._bind()
    this.rafId = requestAnimationFrame(this._tick)
  }

  destroy() {
    this.running = false
    if (this.rafId) cancelAnimationFrame(this.rafId)
    this.rafId = null
    this._unbind()
    this._io?.disconnect()
  }

  private _bind() {
    if (this.o.source === 'capture') {
      this.inputTarget.addEventListener('wheel', this._onWheel as EventListener, { passive: false })
      this.inputTarget.addEventListener('touchstart', this._onTouchStart as EventListener, { passive: true })
      this.inputTarget.addEventListener('touchmove', this._onTouchMove as EventListener, { passive: false })
    }
    if (this.o.parallax && !this.reducedMotion) {
      this.target.addEventListener('pointermove', this._onPointerMove)
    }
    if (this.o.keyboard) {
      this.inputTarget.addEventListener('keydown', this._onKeyDown as EventListener)
    }
    this.target.addEventListener('pointerenter', this._onPointerEnter)
    this.target.addEventListener('pointerleave', this._onPointerLeave)
    document.addEventListener('visibilitychange', this._onVisibility)

    if (this.o.autoPauseOffscreen && 'IntersectionObserver' in window) {
      this._io = new IntersectionObserver(
        ([entry]) => this._setVisible(entry.isIntersecting),
        { threshold: 0 },
      )
      this._io.observe(this.target)
    }
  }

  private _unbind() {
    this.inputTarget.removeEventListener('wheel', this._onWheel as EventListener)
    this.inputTarget.removeEventListener('touchstart', this._onTouchStart as EventListener)
    this.inputTarget.removeEventListener('touchmove', this._onTouchMove as EventListener)
    this.target.removeEventListener('pointermove', this._onPointerMove)
    this.target.removeEventListener('pointerenter', this._onPointerEnter)
    this.target.removeEventListener('pointerleave', this._onPointerLeave)
    this.inputTarget.removeEventListener('keydown', this._onKeyDown as EventListener)
    document.removeEventListener('visibilitychange', this._onVisibility)
  }

  /** Resume the loop after sleep/offscreen — called from every input path. */
  private _wake() {
    if (!this.running) return
    this.sleeping = false
    this.idleFrames = 0
    if (this.isVisible && this.rafId == null) {
      this.rafId = requestAnimationFrame(this._tick)
    }
  }

  private _setVisible(v: boolean) {
    this.isVisible = v
    if (v) {
      if (this.running && this.rafId == null && !this.sleeping) {
        this.rafId = requestAnimationFrame(this._tick)
      }
    } else if (this.rafId != null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private _normalizeWheel(e: WheelEvent): number {
    if (e.deltaMode === 1) return e.deltaY * 16
    if (e.deltaMode === 2) return e.deltaY * window.innerHeight
    return e.deltaY
  }

  private _shouldCapture(delta: number): boolean {
    if (this.o.captureMode === 'always') return true
    if (!this.isHovered) return false
    if (this.o.captureMode === 'while-hovered') return true
    const atEnd = this.targetValue >= this.o.length - 0.5
    const atStart = this.targetValue <= 0.5
    if (delta > 0 && atEnd) return false
    if (delta < 0 && atStart) return false
    return true
  }

  private _addInput(delta: number): boolean {
    const signed = delta * (this.o.invert ? -1 : 1)
    if (!this._shouldCapture(signed)) return false
    this.targetValue = clamp(this.targetValue + signed, 0, this.o.length)
    this.lastInputTime = performance.now()
    this._wake()
    return true
  }

  /** Advance the target by one layer in `dir` (±1), clamped to the ends. */
  private _stepBy(dir: number) {
    if (this.o.layerCount < 2) return
    const step = this.o.length / (this.o.layerCount - 1)
    const curIdx = Math.round(this.targetValue / step)
    this.goTo(curIdx + (dir >= 0 ? 1 : -1))
  }

  private _onWheel(e: WheelEvent) {
    // Discrete mode: one wheel gesture = one layer. A "gesture" is a burst of
    // wheel events; a pause longer than stepGap starts a new one. This absorbs
    // trackpad inertia / fast spins into a single step so we never skip a card.
    if (this.o.wheelStep && this.o.layerCount > 1 && this.o.source === 'capture') {
      const raw = this._normalizeWheel(e)
      const dir = raw * (this.o.invert ? -1 : 1) >= 0 ? 1 : -1
      if (!this._shouldCapture(dir)) return // at a bound (until-bounds) → let page scroll
      e.preventDefault()
      const now = performance.now()
      if (now - this._wheelLastTs >= this.o.stepGap) {
        this._wheelAccum = 0
        this._wheelFired = false
      }
      this._wheelLastTs = now
      this._wheelAccum += raw * (this.o.invert ? -1 : 1)
      if (!this._wheelFired && Math.abs(this._wheelAccum) >= this.o.stepThreshold) {
        this._stepBy(this._wheelAccum >= 0 ? 1 : -1)
        this._wheelFired = true
      }
      return
    }

    const delta = this._normalizeWheel(e) * this.o.wheelSpeed
    if (this._addInput(delta)) e.preventDefault()
  }

  private _onTouchStart(e: TouchEvent) {
    this.touchY = e.touches[0]?.clientY ?? 0
  }

  private _onTouchMove(e: TouchEvent) {
    const y = e.touches[0]?.clientY ?? this.touchY
    const delta = (this.touchY - y) * this.o.touchSpeed
    if (this._addInput(delta)) e.preventDefault()
    this.touchY = y
  }

  private _onPointerMove(e: PointerEvent) {
    const r = this.target.getBoundingClientRect()
    this.pointerTarget.x = ((e.clientX - r.left) / r.width) * 2 - 1
    this.pointerTarget.y = -(((e.clientY - r.top) / r.height) * 2 - 1)
    this._wake()
  }

  private _onPointerEnter() { this.isHovered = true }

  private _onPointerLeave() {
    this.isHovered = false
    this.pointerTarget = { x: 0, y: 0 }
    this._wake()
  }

  private _onVisibility() { this._setVisible(!document.hidden) }

  private _pageProgress(): number {
    const r = this.target.getBoundingClientRect()
    const vh = window.innerHeight || 1
    return clamp((vh - r.top) / (vh + r.height), 0, 1)
  }

  private _writeVars() {
    if (!this.o.writeCssVars) return
    const s = this.target.style
    const vSigned = clamp(this.velocity / this.o.velocityMax, -1, 1)
    const vAbs = Math.abs(vSigned)
    const w = this._w
    // Only touch the DOM when a value actually changed at the written precision.
    if (Number.isNaN(w.p) || Math.abs(this.progress - w.p) >= 1e-5) {
      s.setProperty('--depth-progress', this.progress.toFixed(5))
      w.p = this.progress
    }
    if (Number.isNaN(w.v) || Math.abs(vSigned - w.v) >= 1e-4) {
      s.setProperty('--depth-velocity', vSigned.toFixed(5))
      w.v = vSigned
    }
    if (Number.isNaN(w.s) || Math.abs(vAbs - w.s) >= 1e-4) {
      s.setProperty('--depth-speed', vAbs.toFixed(5))
      w.s = vAbs
    }
    if (Number.isNaN(w.px) || Math.abs(this.pointer.x - w.px) >= 1e-4) {
      s.setProperty('--depth-pointer-x', this.pointer.x.toFixed(4))
      w.px = this.pointer.x
    }
    if (Number.isNaN(w.py) || Math.abs(this.pointer.y - w.py) >= 1e-4) {
      s.setProperty('--depth-pointer-y', this.pointer.y.toFixed(4))
      w.py = this.pointer.y
    }
  }

  private _atRest(): boolean {
    const settled =
      Math.abs(this.velocity) < 1e-4 &&
      Math.abs(this.current - this.targetValue) < 1e-3
    const pointerSettled =
      this.reducedMotion ||
      (Math.abs(this.pointer.x - this.pointerTarget.x) < 1e-3 &&
        Math.abs(this.pointer.y - this.pointerTarget.y) < 1e-3)
    // Stay awake through the snap window so the settle-to-nearest can still fire.
    const snapPending =
      this.o.snap &&
      this.o.layerCount > 1 &&
      this.o.source === 'capture' &&
      performance.now() - this.lastInputTime <= this.o.snapDelay
    return settled && pointerSettled && !snapPending
  }

  private _tick() {
    if (this.o.source === 'page') this.targetValue = this._pageProgress() * this.o.length

    if (this.o.snap && this.o.layerCount > 1 && this.o.source === 'capture') {
      const idle = performance.now() - this.lastInputTime > this.o.snapDelay
      if (idle && Math.abs(this.velocity) < 0.02) {
        const step = this.o.length / (this.o.layerCount - 1)
        this.targetValue = Math.round(this.targetValue / step) * step
      }
    }

    const ease = this.reducedMotion ? 1 : this.o.smoothing
    this.current = clamp(lerp(this.current, this.targetValue, ease), 0, this.o.length)

    const raw = this.current - this.previous
    this.velocity = clamp(
      lerp(this.velocity, raw, this.o.velocityDamping),
      -this.o.velocityMax,
      this.o.velocityMax,
    )
    if (Math.abs(this.velocity) < 1e-4) this.velocity = 0
    this.previous = this.current

    this.progress = this.o.length > 0 ? clamp(this.current / this.o.length, 0, 1) : 0

    if (!this.reducedMotion) {
      this.pointer.x = lerp(this.pointer.x, this.pointerTarget.x, 0.08)
      this.pointer.y = lerp(this.pointer.y, this.pointerTarget.y, 0.08)
    }

    this._writeVars()

    if (this.o.onUpdate) {
      const vSigned = clamp(this.velocity / this.o.velocityMax, -1, 1)
      this.o.onUpdate({ progress: this.progress, velocity: vSigned, velocityAbs: Math.abs(vSigned), current: this.current })
    }

    if (this.o.layerCount > 0) {
      const idx = Math.round(this.progress * (this.o.layerCount - 1))
      if (idx !== this.activeLayer) {
        this.activeLayer = idx
        this.o.onLayerChange?.(idx)
      }
    }

    // Idle → stop the loop entirely (capture mode); any input calls _wake().
    if (this.o.source === 'capture' && this._atRest()) {
      if (++this.idleFrames > 1) {
        this.sleeping = true
        this.rafId = null
        return
      }
    } else {
      this.idleFrames = 0
    }

    this.rafId = requestAnimationFrame(this._tick)
  }

  setOptions(patch: Partial<DepthScrollOptions>) { Object.assign(this.o, patch) }

  get signal() { return { progress: this.progress, velocity: this.velocity, pointer: this.pointer } }

  setProgress(p: number) {
    this.targetValue = clamp(p, 0, 1) * this.o.length
    this.lastInputTime = performance.now()
    this._wake()
  }

  goTo(index: number) {
    if (this.o.layerCount < 2) return
    const step = this.o.length / (this.o.layerCount - 1)
    this.targetValue = clamp(index * step, 0, this.o.length)
    this.lastInputTime = performance.now()
    this._wake()
  }

  next() { this.goTo(this.activeLayer + 1) }
  prev() { this.goTo(this.activeLayer - 1) }

  private _onKeyDown(e: KeyboardEvent) {
    if (this.o.captureMode !== 'always' && !this.isHovered) return
    if (['ArrowDown', 'PageDown', 'ArrowRight', ' ', 'Spacebar'].includes(e.key)) {
      e.preventDefault()
      this.next()
    } else if (['ArrowUp', 'PageUp', 'ArrowLeft'].includes(e.key)) {
      e.preventDefault()
      this.prev()
    }
  }
}
