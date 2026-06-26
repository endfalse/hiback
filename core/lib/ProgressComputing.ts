/**
 * @description 进度计算模块，用于多组件加载进度的统一展示
 * @author kongjing
 * @date 2024.11.11
 * 
 * @example
 * ```typescript
 * import { ProgressComputing } from 'hiback'
 * 
 * // 创建实例
 * const progress = new ProgressComputing({
 *   growthRate: 0.3,
 *   deviation: 0.5,
 *   interval: 100,
 *   onProgress: (percent) => {
 *     console.log('当前进度:', percent)
 *   }
 * })
 * 
 * // 记录组件
 * progress.record('component1', 30)
 * progress.record('component2', 30)
 * progress.record('component3', 40)
 * 
 * // 开始动画
 * progress.start('component1')
 * 
 * // 组件加载完成
 * progress.finish('component1')
 * progress.finish('component2')
 * progress.finish('component3')
 * 
 * // 获取当前进度
 * console.log(progress.percentage)
 * 
 * // 销毁实例
 * progress.destroy()
 * ```
 */

export interface ProgressComputingOptions {
  /** 增长速率，默认 0.3 */
  growthRate?: number
  /** 完成偏差阈值，默认 0.5 */
  deviation?: number
  /** 动画间隔(ms)，默认 100 */
  interval?: number
  /** 进度变化回调 */
  onProgress?: (percent: number) => void
  /** 完成回调 */
  onComplete?: () => void
}

interface ComponentProgress {
  /** 组件唯一标识 */
  uid: string
  /** 权重值 */
  total: number
  /** 当前加载值 */
  loaded: number
  /** 动画步数计数 */
  step: number
  /** 是否已记录完成 */
  isFinished: boolean
  /** 动画是否已完成 */
  isComplete: boolean
}

export default class ProgressComputing {
  /** 组件进度列表 */
  private components: Record<string, ComponentProgress> = {}
  /** 组件uid列表（按添加顺序） */
  private componentUids: string[] = []
  /** 当前正在动画的组件uid */
  private animatingUid: string | null = null
  /** 动画定时器 */
  private animationTimer: number | null = null
  /** 增长速率 */
  private growthRate: number
  /** 完成偏差阈值 */
  private deviation: number
  /** 动画间隔 */
  private interval: number
  /** 进度变化回调 */
  private onProgress: ((percent: number) => void) | null = null
  /** 完成回调 */
  private onComplete: (() => void) | null = null
  /** 是否已完成 */
  private isCompleted: boolean = false
  /** 是否已销毁 */
  private isDestroyed: boolean = false
  /** 上一次通知的进度值，避免重复通知相同值 */
  private lastNotifiedPercent: number = -1

  /**
   * 构造函数
   * @param options 配置选项，或兼容旧版本的 growthRate
   * @param deviation 兼容旧版本的偏差值
   * @param interval 兼容旧版本的间隔值
   */
  constructor(
    optionsOrGrowthRate: ProgressComputingOptions | number = {},
    deviation?: number,
    interval?: number
  ) {
    let options: ProgressComputingOptions = {}

    // 处理旧版调用方式
    if (typeof optionsOrGrowthRate === 'number') {
      options = {
        growthRate: optionsOrGrowthRate,
        deviation: deviation ?? 0.5,
        interval: interval ?? 300
      }
    } else {
      options = optionsOrGrowthRate
    }

    this.growthRate = options.growthRate ?? 0.3
    this.deviation = options.deviation ?? 0.5
    this.interval = options.interval ?? 100
    this.onProgress = options.onProgress ?? null
    this.onComplete = options.onComplete ?? null
  }

  /**
   * 记录需要加载的组件
   * @param uid 组件唯一标识
   * @param weight 权重值，越大该组件占比越高
   */
  public record(uid: string, weight: number = 100): void {
    if (this.isDestroyed || this.isCompleted) {
      return
    }

    if (this.components[uid]) {
      console.warn(`[ProgressComputing] Component "${uid}" already exists`)
      return
    }

    this.components[uid] = {
      uid,
      total: Math.max(1, weight),
      loaded: 0,
      step: 0,
      isFinished: false,
      isComplete: false
    }
    this.componentUids.push(uid)
  }

  /**
   * 标记组件加载完成（会立即将该组件进度置为100%）
   * @param uid 组件唯一标识
   */
  public finish(uid: string): void {
    if (this.isDestroyed || this.isCompleted) {
      return
    }

    const component = this.components[uid]
    if (!component) {
      console.warn(`[ProgressComputing] Component "${uid}" not found`)
      return
    }

    if (component.isFinished) {
      return
    }

    // 立即完成该组件的进度
    component.isFinished = true
    component.loaded = component.total
    component.isComplete = true

    // 如果当前正在动画的是该组件，切换到下一个
    if (this.animatingUid === uid) {
      this.startNextAnimation()
    }

    this.notifyProgress()
    this.checkComplete()
  }

  /**
   * 开始进度动画
   * @param uid 从哪个组件开始，如果不指定则从第一个未完成的开始
   */
  public start(uid?: string): void {
    if (this.isDestroyed || this.isCompleted) {
      return
    }

    // 如果有动画正在进行，先停止
    this.stopAnimation()

    let targetUid = uid

    // 如果没有指定uid，找第一个未完成的组件
    if (!targetUid) {
      for (let i = 0; i < this.componentUids.length; i++) {
        const compUid = this.componentUids[i]
        const comp = compUid ? this.components[compUid] : null
        if (comp && !comp.isComplete) {
          targetUid = compUid
          break
        }
      }
    }

    if (!targetUid) {
      this.checkComplete()
      return
    }

    this.animateStart(targetUid)
  }

  /**
   * 暂停动画
   */
  public pause(): void {
    this.stopAnimation()
  }

  /**
   * 重置所有进度
   */
  public reset(): void {
    this.stopAnimation()
    this.isCompleted = false
    this.lastNotifiedPercent = -1
    this.animatingUid = null

    // 重置所有组件状态
    for (let i = 0; i < this.componentUids.length; i++) {
      const uid = this.componentUids[i]
      const comp = uid ? this.components[uid] : null
      if (comp) {
        comp.loaded = 0
        comp.step = 0
        comp.isFinished = false
        comp.isComplete = false
      }
    }

    this.notifyProgress()
  }

  /**
   * 销毁实例，清理资源
   */
  public destroy(): void {
    this.stopAnimation()
    this.components = {}
    this.componentUids = []
    this.onProgress = null
    this.onComplete = null
    this.isDestroyed = true
    this.isCompleted = false
  }

  /**
   * 获取当前进度百分比 (0-100)
   */
  public get percentage(): number {
    if (this.componentUids.length === 0) {
      return 0
    }

    let totalWeight = 0
    let totalLoaded = 0

    for (let i = 0; i < this.componentUids.length; i++) {
      const uid = this.componentUids[i]
      const comp = uid ? this.components[uid] : null
      if (comp) {
        totalWeight += comp.total
        totalLoaded += comp.loaded
      }
    }

    if (totalWeight <= 0) {
      return 0
    }

    const percent = Math.min(100, Math.max(0, Math.floor((totalLoaded / totalWeight) * 100)))

    // 更新完成状态
    if (percent === 100) {
      this.isCompleted = true
    }

    return percent
  }

  /**
   * 检查是否已完成
   */
  public get completed(): boolean {
    return this.isCompleted
  }

  /**
   * 设置进度变化回调
   */
  public setOnProgress(callback: (percent: number) => void): void {
    this.onProgress = callback
  }

  /**
   * 设置完成回调
   */
  public setOnComplete(callback: () => void): void {
    this.onComplete = callback
  }

  /**
   * @deprecated 请使用 record() 方法
   * 向后兼容的旧方法
   */
  public recordComponent(uid: string, total: number): void {
    this.record(uid, total)
  }

  /**
   * @deprecated 请使用 finish() 方法
   * 向后兼容的旧方法
   */
  public finishComponent(uid: string): void {
    this.finish(uid)
  }

  /**
   * @deprecated 请使用 start() 方法
   * 向后兼容的旧方法
   */
  public aniamteStart(uid: string): void {
    this.start(uid)
  }

  /**
   * 开始单个组件的动画
   */
  private animateStart(uid: string): void {
    const component = this.components[uid]
    if (!component || component.isComplete) {
      this.startNextAnimation()
      return
    }

    this.animatingUid = uid
    this.runAnimation(uid)
  }

  /**
   * 执行动画循环
   */
  private runAnimation(uid: string): void {
    if (this.isDestroyed) {
      return
    }

    const component = this.components[uid]
    if (!component) {
      this.startNextAnimation()
      return
    }

    // 如果组件已标记完成，立即完成
    if (component.isFinished) {
      component.loaded = component.total
      component.isComplete = true
      this.notifyProgress()
      this.startNextAnimation()
      return
    }

    // 检查是否已接近完成
    if (Math.abs(component.loaded - component.total) < this.deviation) {
      component.loaded = component.total
      component.isComplete = true
      this.notifyProgress()
      this.startNextAnimation()
      return
    }

    // 计算下一步的进度
    component.step++
    component.loaded = this.boundedFunction(component.step, component.total, this.growthRate)

    this.notifyProgress()

    // 继续下一帧
    this.animationTimer = window.setTimeout(() => {
      this.runAnimation(uid)
    }, this.interval)
  }

  /**
   * 启动下一个组件的动画
   */
  private startNextAnimation(): void {
    if (this.isDestroyed) {
      return
    }

    // 先找已finish但还没动画完成的组件
    for (let i = 0; i < this.componentUids.length; i++) {
      const uid = this.componentUids[i]
      const comp = uid ? this.components[uid] : null
      if (comp && comp.isFinished && !comp.isComplete) {
        // 立即完成
        comp.loaded = comp.total
        comp.isComplete = true
        this.notifyProgress()
      }
    }

    // 找下一个未完成的组件
    let nextUid: string | null = null
    let foundCurrent = false

    for (let i = 0; i < this.componentUids.length; i++) {
      const uid = this.componentUids[i]
      if (!uid) continue

      if (uid === this.animatingUid) {
        foundCurrent = true
        continue
      }

      const comp = this.components[uid]
      if (foundCurrent && comp && !comp.isComplete) {
        nextUid = uid
        break
      }
    }

    // 如果没找到，从头再找
    if (!nextUid) {
      for (let i = 0; i < this.componentUids.length; i++) {
        const uid = this.componentUids[i]
        const comp = uid ? this.components[uid] : null
        if (comp && !comp.isComplete) {
          nextUid = uid || null
          break
        }
      }
    }

    if (nextUid) {
      this.animateStart(nextUid)
    } else {
      this.animatingUid = null
      this.checkComplete()
    }
  }

  /**
   * 停止当前动画
   */
  private stopAnimation(): void {
    if (this.animationTimer !== null) {
      clearTimeout(this.animationTimer)
      this.animationTimer = null
    }
    this.animatingUid = null
  }

  /**
   * 边界函数，用于计算渐进式增长
   * 使用指数增长函数，初始快，逐渐变慢
   */
  private boundedFunction(step: number, maxValue: number, rate: number): number {
    return maxValue * (1 - Math.exp(-rate * step))
  }

  /**
   * 通知进度变化
   */
  private notifyProgress(): void {
    if (!this.onProgress) {
      return
    }

    const percent = this.percentage

    // 只有当进度变化时才通知
    if (percent !== this.lastNotifiedPercent) {
      this.lastNotifiedPercent = percent
      this.onProgress(percent)
    }
  }

  /**
   * 检查是否全部完成
   */
  private checkComplete(): void {
    if (this.isCompleted && this.onComplete) {
      // 确保所有组件都是100%
      for (let i = 0; i < this.componentUids.length; i++) {
        const uid = this.componentUids[i]
        const comp = uid ? this.components[uid] : null
        if (comp) {
          comp.loaded = comp.total
          comp.isComplete = true
        }
      }
      
      this.notifyProgress()
      this.stopAnimation()
      
      // 异步调用完成回调，避免同步问题
      setTimeout(() => {
        if (this.onComplete && !this.isDestroyed) {
          this.onComplete()
        }
      }, 0)
    }
  }
}