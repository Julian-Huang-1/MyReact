

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

const React = {
    createElement,
}

export default React