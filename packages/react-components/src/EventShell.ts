
import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'

// TODO: performance event pool with react context?
// TODO: avoid re-(add/remove)EventListener event
const EventShell = function ({ children, addEventListener }) {
    const refs: any[] = [];
    const _children = React.Children.map(children, (child, index: number) => {
      const _ref = React.createRef(null);
      refs[index] = _ref;
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { ref: _ref });
      } else {
        return child;
      }
    });
    useEffect(() => {
      const htmlElements = refs
        .map((_ref) => {
          return ReactDOM.findDOMNode(_ref.current);
        })
        .filter((htmlElement) => htmlElement !== null);
  
      const removeEventListeners = htmlElements.map((el) => {
        return addEventListener(el);
      });
      return () => {
        removeEventListeners.forEach((fn) => fn());
      };
    });

    return _children;
  };
  
  export default EventShell
