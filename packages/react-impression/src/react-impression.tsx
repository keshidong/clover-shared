import React, { useContext, useEffect, useRef, useCallback } from 'react'
import hoistStatics from 'hoist-non-react-statics'
import { createImpressionObserver, ProxyIntersectionObserverType } from '@clover-shared/impression'
import { useSharedRef } from '@clover-shared/react-hooks'

import 'intersection-observer'

const ImpressionContext = React.createContext<React.RefObject<ProxyIntersectionObserverType>>({ current: null })

export const useImpression = <T,>(targetRef: React.RefObject<Element>, data: T) => {
  const observerRef = useContext(ImpressionContext)
  const dataRef = useRef(data)
  dataRef.current = data

  useEffect(() => {
    const observer = observerRef.current
    const target = targetRef.current

    if (!observer || !target || !(target instanceof Element)) return

    observer.observe(target, () => dataRef.current)

    return () => {
      observer.unobserve(target)
    }
  }, [observerRef, targetRef])
}

type impressionDataType<P> = { impressionData: P }
export const withImpression = <P, T extends {}>(
  ComposedComponent: string | React.ComponentClass<React.ComponentPropsWithoutRef<any> & { ref: React.RefObject<Element> }>
) => {
  const WithImpressionWrapper = React.forwardRef<Element, impressionDataType<P> & React.HTMLAttributes<Element> & T>((props, forwardedRef) => {
    const ref = useSharedRef<null | Element>(null, [forwardedRef])
    const { impressionData, ...restProps } = props
    useImpression(ref, impressionData)
    return <ComposedComponent ref={ref} {...restProps} />
  })

  if (process.env.NODE_ENV !== 'production') {
    const name = typeof ComposedComponent === 'string'
    ? ComposedComponent
    : ComposedComponent.displayName || ComposedComponent.name || 'Unknown'
      WithImpressionWrapper.displayName = `withImpression(${name})`
  }

  return typeof ComposedComponent === 'string'
    ? WithImpressionWrapper
    : hoistStatics(WithImpressionWrapper, ComposedComponent)
}

type ImpressionProviderPropsType<T> = {
  children: React.ReactNode;
  track: (data: T) => void;
  viewAreaCoveragePercentThreshold?: number;
  minimumViewTime?: number;
}

export default function ImpressionProvider<T> ({
  children,
  track,
  viewAreaCoveragePercentThreshold,
  minimumViewTime,
}: ImpressionProviderPropsType<T>) {
  const observerRef = useRef<null | ProxyIntersectionObserverType>(null)
  const trackRef = useRef(track)
  trackRef.current = track

  const trackF = useCallback((data: T) => {
    trackRef.current(data)
  }, [])
  useEffect(() => {
    const impressionObserver = createImpressionObserver<T>(trackF, { viewAreaCoveragePercentThreshold, minimumViewTime })
    observerRef.current = impressionObserver

    return impressionObserver.disconnect
  }, [viewAreaCoveragePercentThreshold, minimumViewTime, trackF])

  return <ImpressionContext.Provider value={observerRef}>
    {children}
  </ImpressionContext.Provider>
}
