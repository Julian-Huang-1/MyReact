

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
    }
}




let curRootTask;//用来保存Fiber树的根节点
let nextTask = null
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
        shouldYield = deadline.timeRemaining() < 1
    }
    if (nextTask)
        requestIdleCallback(taskLoop)
    if (!nextTask) {
        //统一挂载到真实dom上（更新视图）
        commitWork(curRootTask.child)
    }
}
function commitWork(task) {
    if (!task) return
    let parent = task.parent
    while (!parent.dom) {
        parent = parent.parent
    }
    if (task.effectTag === "update") {
        updateProps(task.dom, task.props, task.alternate?.props)
    } else if (task.effectTag === "placement") {
        if (task.dom) {
            parent.dom.append(task.dom)
        }
    }
    commitWork(task.child)
    commitWork(task.sibling)
}
function taskOfUnit(task) {
    // typeof task.type === "function" && console.log(task.id, task.alternate?.id);
    const ifFnComponent = typeof task.type === "function"
    if (!ifFnComponent) {
        if (!task.dom) {
            //创建真实dom
            const dom = task.type === "TEXT_ELEMENT"
                ? document.createTextNode("")
                : document.createElement(task.type)
            task.dom = dom

            updateProps(dom, task.props, {})
        }
    }
    let oldChildTask = task.alternate?.child

    // 初始化子节点
    const children = ifFnComponent
        ? [task.type(task.props)]
        : task.props.children
    let prevChild = null
    children.forEach((child, index) => {
        const isSameType = oldChildTask && oldChildTask.type === child.type

        let childTask = null;
        if (isSameType) {
            childTask = new Fiber({
                type: child.type,
                props: child.props,
                child: null,
                sibling: null,
                parent: task,
                dom: oldChildTask.dom,
                effectTag: "update",
                alternate: oldChildTask
            })
        } else {
            if (child) {
                childTask = new Fiber({
                    type: child.type,
                    props: child.props,
                    child: null,//第一个子任务
                    sibling: null,//右边第一个兄弟 
                    parent: task,
                    dom: null,//真实dom
                    effectTag: "placement",
                })
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
    if (task.child) return task.child
    if (task.sibling) return task.sibling

    let parent = task
    while (parent) {
        if (parent.sibling) return parent.sibling
        else parent = parent.parent
    }
    // return task.parent?.sibling
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


const React = {
    createElement,
    render
}

export default React