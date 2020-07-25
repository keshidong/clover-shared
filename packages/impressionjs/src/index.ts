import 'intersection-observer'

const defaultViewAreaCoveragePercentThreshold = 0.5
const defaultMinimumViewTime = 1000 // 1000ms

export type getDataType = () => any
export type ProxyIntersectionObserverType = {
  observe: (target: Element, getData?: getDataType) => void;
  unobserve: (target: Element) => void;
  disconnect: () => void;
}

export function createImpressionObserver(
  track: (elementTarget: Element, getData: getDataType) => void,
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
      if (entry.intersectionRatio > viewAreaCoveragePercentThreshold) {
        // expose the same target only once
        if (hasImpressionTargetSet.has(entry.target)) return

        const timeHandler = setTimeout(() => {
          // if unobserve or disconnect, the candidateImpressionMap will be cleared
          // not expose data for this scene
          if (!candidateImpressionMap.has(entry.target)) return

          // upload track data
          track(entry.target, impressionGetDataMap.get(entry.target))
          // TODO test
          console.log(entry.target)

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
  })
  return {
    observe: (target: Element, getData?: getDataType) => {
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
