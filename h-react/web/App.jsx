import React from "../core/React.js"
import { Todos } from "./src/Todos.jsx"

export function App() {
    const [todo, setTodo] = React.useState("")
    return <div>
        <Todos></Todos>
    </div>
}



