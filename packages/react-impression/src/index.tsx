import React, { useContext, useEffect, useRef, useCallback } from 'react'
import hoistStatics from 'hoist-non-react-statics'
import { createImpressionObserver, ProxyIntersectionObserverType } from '@clover-shared/impression'
import { useSharedRef } from '@clover-shared/react-hooks'

import 'intersection-observer'

const ImpressionContext = React.createContext<React.RefObject<ProxyIntersectionObserverType>>({ current: null })

export const useImpression = (targetRef: React.RefObject<Element>, cb: () => void) => {
  const observerRef = useContext(ImpressionContext)

  const cbRef = useRef(cb)
  cbRef.current = cb
  const stableCb = useCallback(() => {
    cbRef.current()
  }, [])
  

  useEffect(() => {
    const observer = observerRef.current
    const target = targetRef.current

    if (!observer || !target || !(target instanceof Element)) return

    observer.observe(target, stableCb)

    return () => {
      observer.unobserve(target)
    }
  }, [observerRef, targetRef])
}

type impressionDataType<P> = { impressionData: P }
type onImression<P> = (impressionData: P) => void
export const withImpression = <P, T extends {}>(onImression: onImression<P>) => (
  ComposedComponent: string | React.ComponentClass<React.ComponentPropsWithoutRef<any> & { ref: React.RefObject<Element> }>
) => {
  const WithImpressionWrapper = React.forwardRef<Element, impressionDataType<P> & React.HTMLAttributes<Element> & T>((props, forwardedRef) => {
    const ref = useSharedRef<null | Element>(null, [forwardedRef])
    const { impressionData, ...restProps } = props
    useImpression(ref, () => { onImression(impressionData) })
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
  viewAreaCoveragePercentThreshold?: number;
  minimumViewTime?: number;
}

export function ImpressionProvider<T> ({
  children,
  viewAreaCoveragePercentThreshold,
  minimumViewTime,
}: ImpressionProviderPropsType<T>) {
  const observerRef = useRef<null | ProxyIntersectionObserverType>(null)
  useEffect(() => {
    const impressionObserver = createImpressionObserver({ viewAreaCoveragePercentThreshold, minimumViewTime })
    observerRef.current = impressionObserver

    return impressionObserver.disconnect
  }, [viewAreaCoveragePercentThreshold, minimumViewTime])

  console.log('React', React)
  return <ImpressionContext.Provider value={observerRef}>
    {children}
  </ImpressionContext.Provider>
}
