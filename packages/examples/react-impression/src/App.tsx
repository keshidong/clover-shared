import React from 'react'
import { ImpressionProvider, withImpression } from '@clover-shared/react-impression'

console.log(ImpressionProvider)
function App () {
    return <ImpressionProvider>
        <div>
            hello world!
        </div>
    </ImpressionProvider> 
}

export default App

// function List () {
//     return (
//         <div>
//             <Item />
//             <Item />
//             <Item />
//             <Item />
//             <Item />
//             <Item />
//             <Item />
//         </div>
//     )
// }

// const Item = withImpression((data) => {
//     console.log('data', data)
// })('div')
