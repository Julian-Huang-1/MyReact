import React from "./React"
export default {
    createRoot(container) {
        return {
            render(vel) {
                React.render(vel, container)
            }
        }
    }
}