import 'intersection-observer'

const defaultViewAreaCoveragePercentThreshold = 0.5
const defaultMinimumViewTime = 1000 // 1000ms

const thresholdDeta = 0.001 // if scroll slowly, entry.intersectionRatio will exqual to viewAreaCoveragePercentThreshold

export type getDataType<T> = {
  (): T;
}

export type ProxyIntersectionObserverType = {
  observe: <T>(target: Element, getData?: getDataType<T>) => void;
  unobserve: (target: Element) => void;
  disconnect: () => void;
}

export function createImpressionObserver<T>(
  track: (data: T) => void,
  {
    viewAreaCoveragePercentThreshold = defaultViewAreaCoveragePercentThreshold,
    minimumViewTime = defaultMinimumViewTime,
  }
): ProxyIntersectionObserverType {
  const hasImpressionTargetSet = new Set()
  const candidateImpressionMap = new Map()
  const impressionGetDataMap = new Map()
  const observer = new window.IntersectionObserver((entries) => {
    // wait for expose
    entries.forEach(entry => {
      if (entry.intersectionRatio >= (viewAreaCoveragePercentThreshold - thresholdDeta)) {
        // expose the same target only once
        if (hasImpressionTargetSet.has(entry.target)) return

        const timeHandler = setTimeout(() => {
          // if unobserve or disconnect, the candidateImpressionMap will be cleared
          // not expose data for this scene
          if (!candidateImpressionMap.has(entry.target)) return

          // upload track data
          const getData = impressionGetDataMap.get(entry.target)
          track(typeof getData === 'function' ? getData() : undefined)

          candidateImpressionMap.delete(entry.target)
          // mark, impression only once
          hasImpressionTargetSet.add(entry.target)
        }, minimumViewTime)

        candidateImpressionMap.set(entry.target, timeHandler)
      } else {
        if (candidateImpressionMap.has(entry.target)) {
          clearTimeout(candidateImpressionMap.get(entry.target))
          candidateImpressionMap.delete(entry.target)
        }
      }
    })
  }, { threshold: viewAreaCoveragePercentThreshold })
  return {
    observe: <T>(target: Element, getData?: getDataType<T>) => {
      observer.observe(target)

      impressionGetDataMap.set(target, getData)
    },
    unobserve: (target: Element) => {
      observer.unobserve(target)

      candidateImpressionMap.delete(target)
      hasImpressionTargetSet.delete(target)
      impressionGetDataMap.delete(target)
    },
    disconnect: () => {
      observer.disconnect()

      candidateImpressionMap.clear()
      hasImpressionTargetSet.clear()
      impressionGetDataMap.clear()
    }
  }
}
