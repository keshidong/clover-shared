# impressionjs
Used for html element exposure tracking, you can define exposure requirements, such as minimum exposure time.

## Usage

### 1. install package

`npm install impressionjs --save`

or use `yarn`

`yarn add impressionjs --save`

### 2. import and observer html element target
```javascript
import createImpressionObserver from 'impressionjs'
const impressionObserver = createImpressionObserver((elementTarget, getData) => {
    const { dataset } = elementTarget
    // getData is Lazy evaluation for get the lastest data
    console.log('track', elementTarget, dataset, getData())
})

// ...
// observe element target
const elTarget = getElementById('example-item')
impressionObserver.observe(elTarget, () => {
    // transmit data
    return {
        // ...
        timeStamp: new Date().getTime()
    }
})
// unobserve specific element target which maybe unmount from root view
impressionObserver.unobserve(elTarget)

// disconnect for destroy impression observer
impressionObserver.disconnect()
```

### 3. Use `Set` and `Map` polyfills if need.
Find `Set` support coverage 
http://kangax.github.io/compat-table/es6/#test-Set

Find `Map` support coverage
http://kangax.github.io/compat-table/es6/#test-Map

polyfills for `Set` and `Map`
```javascript
import 'core-js/features/set'
import 'core-js/features/map'
```
