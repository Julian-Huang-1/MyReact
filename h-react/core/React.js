

//虚拟dom结构实现
function createTextNode(text) {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: [],
        }
    }
}
/*
   <div id="1" style=""><p>hello1</p> <p>hello2</p></div>
   {
        type:"div"
        props:{
            id:"",
            style:"",
            children:[..]
        }
   }

*/
function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map((child) => {
                return (typeof child === "string" || typeof child === "number")
                    ? createTextNode(child)
                    : child
            }),
        }
    }
}


class Fiber {
    constructor(props) {
        this.type = props.type;
        this.props = props.props;
        this.child = props.child;//第一个子任务
        this.sibling = props.sibling;//右边第一个兄弟 
        this.parent = props.parent;
        this.dom = props.dom;//真实dom
        this.effectTag = props.effectTag;//渲染类型
        this.alternate = props.alternate;//指向另外一颗fiber树上的影子节点
        this.stateHooks = null;
        this.effectHooks = null;
    }
}

let FnTask; //用来保存函数Fiber节点
let curRootTask;//用来保存Fiber树的根节点
let nextTask = null
let deletions = []
function render(vel, container) {
    nextTask = new Fiber({
        type: null,
        props: { children: [vel] },
        child: null,
        sibling: null,
        parent: null,
        dom: container,
    })
    curRootTask = nextTask
    requestIdleCallback(taskLoop)//注册任务
}
function taskLoop(deadline) {
    let shouldYield = false
    while (!shouldYield && nextTask) {
        nextTask = taskOfUnit(nextTask)
        //找到结束位置
        if (curRootTask?.sibling?.type === nextTask?.type) {
            nextTask = undefined
        }
        shouldYield = deadline.timeRemaining() < 1
    }
    if (nextTask)
        requestIdleCallback(taskLoop)
    if (!nextTask) {
        commitRoot()
    }
}
function commitRoot() {
    deletions.forEach((task) => {
        commitDeletion(task)
    })
    deletions = []
    //统一挂载到真实dom上（更新视图）
    commitWork(curRootTask.child)
    commitEffectHooks()
}
function commitWork(task) {
    if (!task) return
    let parent = task.parent
    while (!parent.dom) {
        parent = parent.parent
    }
    if (task.effectTag === "update" && task.dom) {
        updateProps(task.dom, task.props, task.alternate?.props)
    } else if (task.effectTag === "placement") {
        if (task.dom) {
            parent.dom.append(task.dom)
        }
    }
    commitWork(task.child)
    commitWork(task.sibling)
}
function updateFnComponent(task) {
    //每次函数组件初始化 重置
    FnTask = task
    effectHooks = []
    stateHooks = []
    stateHookIndex = 0
    const children = [task.type(task.props)]
    initChildren(task, children)
}
function updateHostComponent(task) {
    if (!task.dom) {
        //创建真实dom
        createDom(task)
        updateProps(task.dom, task.props, {})
    }
    const children = task.props.children
    initChildren(task, children)
}

function initChildren(task, children) {
    let oldChildTask = task.alternate?.child
    // 初始化子节点
    let prevChild = null
    children.forEach((child, index) => {
        const isSameType = oldChildTask && oldChildTask.type === child.type
        let childTask = new Fiber({
            type: child.type,
            props: child.props,
            child: null,
            sibling: null,
            parent: task,
            dom: null,
        })
        if (isSameType) {
            childTask.dom = oldChildTask.dom
            childTask.effectTag = "update"
            childTask.alternate = oldChildTask
        } else {
            if (child) {
                childTask.effectTag = "placement"
            }
            if (oldChildTask) {
                deletions.push(oldChildTask)
            }
        }

        if (oldChildTask) {
            oldChildTask = oldChildTask.sibling
        }
        if (index === 0 || !prevChild) {
            task.child = childTask
        } else {
            prevChild.sibling = childTask

        }
        if (child) {
            prevChild = childTask
        }

    })
    while (oldChildTask) {
        deletions.push(oldChildTask)
        oldChildTask = oldChildTask.sibling
    }
}

function createDom(task) {
    const dom = task.type === "TEXT_ELEMENT"
        ? document.createTextNode("")
        : document.createElement(task.type)
    task.dom = dom
}
function taskOfUnit(task) {
    // typeof task.type === "function" && console.log(task.id, task.alternate?.id);
    const ifFnComponent = typeof task.type === "function"
    if (ifFnComponent) {
        updateFnComponent(task)
    } else {
        updateHostComponent(task)
    }

    if (task.child) return task.child
    if (task.sibling) return task.sibling

    let parent = task
    while (parent) {
        if (parent.sibling) return parent.sibling
        else parent = parent.parent
    }
}

function updateProps(dom, newProps, prevProps) {
    Object.keys(prevProps).forEach((key) => {
        if (key !== "children") {
            if (!(key in newProps)) {
                dom.removeAttribute(key)
            }
        }
    })

    Object.keys(newProps).forEach((key) => {
        if (key !== "children") {
            if (newProps[key] !== prevProps[key]) {
                if (key.startsWith("on")) {
                    const eventType = key.slice(2).toLowerCase()
                    dom.removeEventListener(eventType, prevProps[key])
                    dom.addEventListener(eventType, newProps[key])
                } else {
                    dom[key] = newProps[key]
                }
            }
        }
    })
}

let effectHooks;
function useEffect(callback, deps) {
    const effectHook = {
        callback,
        deps,
        cleanup: undefined
    }

    effectHooks.push(effectHook)
    FnTask.effectHooks = effectHooks
}
function commitEffectHooks() {
    function run(task) {
        if (!task) return
        if (!task.alternate) {
            task.effectHooks?.forEach((effectHook) => {
                effectHook.cleanup = effectHook.callback()
            })
        } else {
            task.effectHooks?.forEach((effectHook, index) => {
                const oldEffectHook = task.alternate?.effectHooks[index]
                const needUpdate = oldEffectHook.deps.some((oldDep, i) => {
                    return oldDep !== effectHook.deps[i]
                })

                needUpdate && (effectHook.cleanup = effectHook.callback())
            })
        }
        run(task.child)
        run(task.sibling)
    }

    function runCleanup(task) {
        if (!task) return
        task.alternate?.effectHooks?.forEach((effectHook) => {
            if (effectHook.deps.length > 0) {
                // console.log("taskid:", task.id);
                effectHook.cleanup && effectHook.cleanup()
            }
        })
        runCleanup(task.child)
        runCleanup(task.sibling)
    }
    runCleanup(curRootTask)
    run(curRootTask)
}
function commitDeletion(task) {
    if (task.dom) {
        let parent = task.parent
        while (!parent.dom) {
            parent = parent.parent
        }
        parent.dom.removeChild(task.dom)
    } else {
        commitDeletion(task.child)
    }
}

let stateHooks;
let stateHookIndex;
function useState(initial) {
    let currentTask = FnTask
    let oldHook = currentTask.alternate?.stateHooks[stateHookIndex]
    const stateHook = {
        state: oldHook ? oldHook.state : initial,
        queue: oldHook ? oldHook.queue : []
    }

    stateHook.queue.forEach((action) => {
        stateHook.state = typeof action === "function" ? action(stateHook.state) : action
    })
    stateHook.queue = []
    stateHooks.push(stateHook)
    stateHookIndex++
    currentTask.stateHooks = stateHooks

    function setState(action) {
        const eagerState = typeof action === "function" ? action(stateHook.state) : action
        if (eagerState === stateHook.state) return
        stateHook.queue.push(action)
        nextTask = new Fiber({
            ...currentTask,
            alternate: currentTask,
        })

        curRootTask = nextTask
        requestIdleCallback(taskLoop)

    }

    return [stateHook.state, setState]
}

const React = {
    createElement,
    render,
    useState,
    useEffect
}

export default React