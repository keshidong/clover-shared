import React, { useContext, useEffect, useRef, useCallback } from 'react'
import hoistStatics from 'hoist-non-react-statics'
import { createImpressionObserver, ProxyIntersectionObserverType } from '@clover-shared/impression'
import { useSharedRef } from '@clover-shared/react-hooks'

// https://stackoverflow.com/questions/384286/how-do-you-check-if-a-javascript-object-is-a-dom-object
//Returns true if it is a DOM node
function isNode(o){
  return (
    typeof Node === "object" ? o instanceof Node :
    o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
  )
}

//Returns true if it is a DOM element
function isElement(o){
  return (
    typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
    o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
  )
}

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
    let domElement = null
    if (target && !isNode(target)) {
      // eslint-disable-next-line react/no-find-dom-node
      const node = ReactDOM.findDOMNode(target)
      if (node && isElement(node)) {
        domElement = node
      }
    } else if (target && isElement(target)) {
      domElement = target
    }

    if (!observer || !domElement) return

    observer.observe(domElement, stableCb)

    return () => {
      observer.unobserve(domElement)
    }
  }, [observerRef, targetRef, stableCb])
}

type impressionDataType<P> = { trackData: P }
type onImression<P> = (trackData: P) => void
export const withImpression = <P, T extends {}>(onImression: onImression<P>) => (
  ComposedComponent: string | React.ComponentClass<React.ComponentPropsWithoutRef<any> & { ref: React.RefObject<Element> }>
) => {
  const WithImpressionWrapper = React.forwardRef<Element, impressionDataType<P> & React.HTMLAttributes<Element> & T>((props, forwardedRef) => {
    const ref = useSharedRef<null | Element>(null, [forwardedRef])
    const { trackData, ...restProps } = props
    useImpression(ref, () => { onImression(trackData) })
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

  return <ImpressionContext.Provider value={observerRef}>
    {children}
  </ImpressionContext.Provider>
}
