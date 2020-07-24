import React, { useContext, useEffect, useRef, useCallback } from 'react'
import hoistStatics from 'hoist-non-react-statics'
import 'intersection-observer'
// import { primeTrack } from '@root/utils'
import useSharedRef from './useSharedRef'

const defaultImpressionThreshold = 0.5
const defaultMinimumViewTime = 1000 // 1000ms
const ImpressionContext = React.createContext({ current: null })

export const useImpression = (targetRef) => {
  const observerRef = useContext(ImpressionContext)


  useEffect(() => {
    const observer = observerRef.current
    const target = targetRef.current

    if (!observer || !target) return

    observer.observe(target)

    return () => {
      observer.unobserve(target)
    }
  }, [])
}

export const withImpression = (ComposedComponent) => {
  const WithImpressionWrapper = React.forwardRef((props, forwardedRef) => {
    const ref = useSharedRef(null, [forwardedRef])
    useImpression(ref)
    return <ComposedComponent ref={ref} {...props} />
  })

  if (process.env.NODE_ENV !== 'production') {
    const name =
      ComposedComponent.displayName || ComposedComponent.name || 'Unknown'
      WithImpressionWrapper.displayName = `withImpression(${name})`
  }

  return hoistStatics(WithImpressionWrapper, ComposedComponent)
}

export default function ImpressionProvider ({
  children,
  viewAreaCoveragePercentThreshold = defaultImpressionThreshold,
  minimumViewTime = defaultMinimumViewTime,
}) {
  const observerRef = useRef(null)
  useEffect(() => {
    const hasImpressionTargetSet = new Set()
    const candidateImpressionTimeHandlernMap = new Map()
    const observer = new window.IntersectionObserver((entries) => {
      window.requestIdleCallback(() => {
        entries.forEach(entry => {
          if (hasImpressionTargetSet.has(entry.target)) return

          if (entry.intersectionRatio > viewAreaCoveragePercentThreshold) {
            const timeHandler = setTimeout(() => {
              candidateImpressionTimeHandlernMap.delete(entry)
              // mark, impression only once
              hasImpressionTargetSet.add(entry.target)
              // upload track data
              console.log(entry.target)
            }, minimumViewTime)

            candidateImpressionTimeHandlernMap.set(entry.target, timeHandler)
          } else {
            if (candidateImpressionTimeHandlernMap.has(entry.target)) {
              clearTimeout(candidateImpressionTimeHandlernMap.get(entry.target))
              candidateImpressionTimeHandlernMap.delete(entry.target)
            }
          }
        })
      })
    }, {
      threshold: viewAreaCoveragePercentThreshold
    })
    observerRef.current = {
      observe: observer.observe.bind(observer),
      unobserve: (target) => {
        // 避免内存泄漏
        hasImpressionTargetSet.delete(target)
        observer.observe(target)
      }
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return <ImpressionContext.Provider value={observerRef}>
    {children}
  </ImpressionContext.Provider>
}
