
import React from 'react'
import useSharedRef from './useSharedRef'
import hoistStatics from 'hoist-non-react-statics'

export const withHooks = <T, P>(useHooks: (props: P & T, ref?: React.Ref) => (T | undefined), option = { withRef: false }) => (
  ComposedComponent: React.ElementType<P>
): React.ElementType<P & T> => {
  // TODO ref type
  const WithHookPureFunctionWrapper = (props: P & T) => {
    const restProps = useHooks(props)
    return React.createElement(
      ...(restProps ? restProps as any : props)
    )
  }
  const WithHookClassWrapper = React.forwardRef<any, any>((props: P & T, forwardedRef: React.Ref) => {
    const ref = useSharedRef(null, [forwardedRef])
    const restProps = useHooks(props, ref)
    return React.createElement(ComposedComponent, {
      ...(restProps ? restProps : props),
      ref,
    })
  })

  const WithHookWrapper = option.withRef ? WithHookClassWrapper : WithHookPureFunctionWrapper

  if (process.env.NODE_ENV !== 'production') {
    const name = typeof ComposedComponent === 'string'
    ? ComposedComponent
    : ComposedComponent.displayName || ComposedComponent.name || 'Unknown'
    WithHookWrapper.displayName = `withHooks(${useHooks.name || ''})(${name})`
  }

  return typeof ComposedComponent === 'string'
    ? WithHookWrapper
    : hoistStatics(WithHookWrapper, ComposedComponent)
}

export default withHooks
