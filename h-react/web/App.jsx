import React from "../core/React.js"


export function App() {
    const [count, setCount] = React.useState(10)
    function handle() {
        setCount((c) => c + 1)
    }
    return <div>{count}
        <button onClick={handle}>click</button>
    </div>
}
