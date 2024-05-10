import React from "../../core/React"
export function Todos() {
    const [inputValue, setInputValue] = React.useState("")
    const [filter, setFilter] = React.useState("all")
    const [displayTodos, setDisplayTodos] = React.useState([])
    const [todos, setTodos] = React.useState([
        {
            title: "chifan",
            id: crypto.randomUUID(),
            status: "active"
        },
        {
            title: "heshui",
            id: crypto.randomUUID(),
            status: "active",
        },
        {
            title: "xiedaima",
            id: crypto.randomUUID(),
            status: "active",
        },
    ])
    React.useEffect(() => {
        const rowTodos = localStorage.getItem("todos")
        if (rowTodos) {
            setTodos(JSON.parse(rowTodos))
        }
    }, [])

    React.useEffect(() => {
        if (filter === "all") setDisplayTodos(todos)
        else if (filter === "active") {
            const newTodos = todos.filter((todo) => {
                return todo.status === "active"
            })
            setDisplayTodos(newTodos)
        } else if (filter === "done") {
            const newTodos = todos.filter((todo) => {
                return todo.status === "done"
            })
            setDisplayTodos(newTodos)
        }
    }, [filter, todos])


    function handleAdd() {
        setTodos((todos) => [
            ...todos,
            {
                title: inputValue,
                id: crypto.randomUUID(),
                status: "active",
            }])
        setInputValue("")
    }
    function removeTodo(id) {
        const newTodos = todos.filter((todo) => {
            return id !== todo.id
        })
        setTodos(newTodos)
    }
    function doneTodo(id) {
        console.log(id);
        const newTodos = todos.map((todo) => {
            if (id === todo.id) return {
                ...todo,
                status: "done"
            }
            return todo
        })
        setTodos(newTodos)
    }
    function cancel(id) {
        const newTodos = todos.map((todo) => {
            if (todo.id === id) {
                if ("done" === todo.status) return {
                    ...todo,
                    status: "active"
                }
            }
            return todo
        })
        setTodos(newTodos)
    }
    function handleSave() {
        localStorage.setItem("todos", JSON.stringify(todos))
    }

    return (
        <div>
            <h1>Todos</h1>
            <div>
                <input type="text" value={inputValue} onInput={(e) => {
                    setInputValue(() => e.target.value)
                }} />
                <button onClick={handleAdd}>add</button>
            </div>
            <div>
                <button onClick={handleSave}>save</button>
            </div>
            <div>
                <input type="radio" id="all" checked={filter === "all"} onChange={() => setFilter("all")} />
                <label htmlFor="all">all</label>

                <input type="radio" id="active" checked={filter === "active"} onChange={() => setFilter("active")} />
                <label htmlFor="active">active</label>

                <input type="radio" id="done" checked={filter === "done"} onChange={() => setFilter("done")} />
                <label htmlFor="done">done</label>
            </div>
            <ul>
                {
                    ...displayTodos.map((todo) => {
                        return <li>
                            <TodoItem
                                todo={todo}
                                removeTodo={removeTodo}
                                cancel={cancel}
                                doneTodo={doneTodo}
                            ></TodoItem>
                        </li>
                    })
                }
            </ul>
        </div>

    )
}

function TodoItem({ todo, removeTodo, cancel, doneTodo }) {
    return <div className={todo.status}>
        <div>{todo.title}</div>
        <button onClick={() => { removeTodo(todo.id) }}>remove</button>
        {todo.status === "done"
            ? (<button onClick={() => { cancel(todo.id) }}>cancle</button>)
            : (<button onClick={() => { doneTodo(todo.id) }}>done</button>)
        }
    </div>
}