import React from "../core/React.js"


export function App() {
    const [count, setCount] = React.useState(10)
    function handle() {
        setCount((c) => c + 1)
    }
    React.useEffect(() => {
        console.log("init");
    }, [])
    return <div>{count}
        <button onClick={handle}>click </button>
        <App2></App2>
        <App3></App3>
    </div>
}

function App2() {
    console.log(2);
    const [count, setCount] = React.useState(10)
    function handle() {
        setCount((c) => c + 1)
    }
    React.useEffect(() => {
        console.log("init");
    }, [])
    return <div>{count}
        <button onClick={handle}>click App2</button>
    </div>
}

function App3() {
    console.log(3);
    const [count, setCount] = React.useState(10)
    function handle() {
        setCount((c) => c + 1)
    }
    React.useEffect(() => {
        console.log("init");
    }, [])
    return <div>{count}
        <button onClick={handle}>click App3</button>
    </div>
}

