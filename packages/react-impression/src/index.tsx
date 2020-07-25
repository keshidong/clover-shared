import React, { useContext, useEffect, useRef } from 'react'
import hoistStatics from 'hoist-non-react-statics'
import { createImpressionObserver, ProxyIntersectionObserverType, getDataType } from 'impressionjs'
import 'intersection-observer'
import useSharedRef, { InputRef } from './useSharedRef'


const ImpressionContext = React.createContext<{ current: null | ProxyIntersectionObserverType }>({ current: null })

export const useImpression = (targetRef: { current: null | Element }) => {
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


export const withImpression = (ComposedComponent: string | React.NamedExoticComponent<{ ref: InputRef<Element> } & React.ComponentPropsWithoutRef<any>>) => {
  const WithImpressionWrapper = React.forwardRef<Element>((props, forwardedRef) => {
    const ref = useSharedRef<null | Element>(null, [forwardedRef])
    useImpression(ref)
    return <ComposedComponent ref={ref} {...props} />
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

type ImpressionProviderPropsType = {
  children: React.ReactNode;
  track: (target: Element, getData: getDataType) => void;
  viewAreaCoveragePercentThreshold?: number;
  minimumViewTime?: number;
}
export default function ImpressionProvider ({
  children,
  track,
  viewAreaCoveragePercentThreshold,
  minimumViewTime,
}: ImpressionProviderPropsType) {
  const observerRef = useRef<null | ProxyIntersectionObserverType>(null)
  useEffect(() => {
    const impressionObserver = createImpressionObserver(track, { viewAreaCoveragePercentThreshold, minimumViewTime })
    observerRef.current = impressionObserver

    return impressionObserver.disconnect
  }, [])

  return <ImpressionContext.Provider value={observerRef}>
    {children}
  </ImpressionContext.Provider>
}
