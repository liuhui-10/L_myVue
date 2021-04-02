
const compileUtil = {
    getval(expr, vm) {
        return expr.split(".").reduce((data, currentVal) => {
            return data[currentVal]
        }, vm.$data)
    },
    getTextVal(expr, vm) {
        return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
            return this.getval(args[1], vm)
        })
    },
    setVal(expr, vm, inputVal) {
        return expr.split(".").reduce((data, currentVal, index, arr) => {
            if (index == arr.length - 1) {
                data[currentVal] = inputVal
            }
            return data[currentVal]
        }, vm.$data)
    },
    // expr:变量名 msg
    text(node, expr, vm) {
        let val
        if (expr.indexOf("{{") !== -1) {
            val = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
                new Watcher(vm, args[1], () => {
                    this.updater.textUpdater(node, this.getTextVal(expr, vm))
                })
                return this.getval(args[1], vm)
            })
        } else {
            new Watcher(vm, expr, (newVal) => {
                this.updater.textUpdater(node,newVal)
            })
            val = this.getval(expr, vm)
        }
        this.updater.textUpdater(node, val)
    },
    html(node, expr, vm) {
        let val = this.getval(expr, vm)
        new Watcher(vm, expr, (newVal) => {
            this.updater.htmlUpdater(node, newVal)
        })
        this.updater.htmlUpdater(node, val)
    },
    model(node, expr, vm) {
        let val = this.getval(expr, vm)
        new Watcher(vm, expr, (newVal) => {
            this.updater.modelUpdater(node, newVal)
        })
        node.addEventListener("input", (e) => {
            this.setVal(expr, vm, e.target.value)
        })
        this.updater.modelUpdater(node, val)
    },
    on(node, expr, vm, eventName) {
        let fn = vm.$options.methods && vm.$options.methods[expr]
        node.addEventListener(eventName, fn.bind(vm), false)
    },
    bind(node, expr, vm, attrName) {
        let val = this.getval(expr, vm)
        node.setAttribute(attrName, val)
    },
    updater: {
        textUpdater(node, value) {
            node.textContent = value
        },
        htmlUpdater(node, value) {
            node.innerHTML = value
        },
        modelUpdater(node, value) {
            node.value = value
        }
    }
}

class Compile {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el)
        this.vm = vm
        // 获取文档碎片对象，放入内存中减少页面的回流和重绘
        const fragment = this.node2Fragment(this.el)
        // 指令解析
        this.compile(fragment)

        // 添加到根元素
        this.el.appendChild(fragment)
    }
    compile(f) {
        let childNodes = [...f.childNodes]
        childNodes.forEach(item => {
            if (this.isElementNode(item)) {
                // 编译元素节点
                // console.log("元素节点")
                this.compileElement(item)
            } else {
                // 编译文本节点
                // console.log("文本节点")
                this.compileText(item)
            }
            // 如果还有子元素继续调用compile方法，实现递归
            if (item.childNodes && item.childNodes.length) {
                this.compile(item)
            }
        })
    }
    compileElement(node) {
        let attrs = [...node.attributes]
        attrs.forEach(item => {
            let { name, value } = item

            if (this.isDirtctive(name)) {
                // 使用split 分割字符串筛选指令
                let [, dirctive] = name.split("-")
                //    筛选是不是事件或者bind
                let [dirNmae, eventName] = dirctive.split(":")
                compileUtil[dirNmae](node, value, this.vm, eventName)
                //    删除标签上的指令
                node.removeAttribute("v-" + dirctive)
            } else if (this.isEventName(name)) {
                let [, eventName] = name.split("@")
                compileUtil["on"](node, value, this.vm, eventName)
            } else if (this.isAttrName(name)) {
                let [, eventName] = name.split(":")
                compileUtil["bind"](node, value, this.vm, eventName)
            }
        })
    }
    compileText(node) {
        let content = node.textContent
        if (/\{\{(.+?)\}\}/.test(content)) {
            compileUtil["text"](node, content, this.vm)
        }
    }
    isAttrName(attrName) {
        return attrName.startsWith(":")
    }
    isEventName(eventName) {
        return eventName.startsWith("@")
    }
    // 检查属性是不是以v-开头 startsWith字符串方法判断以什么开头
    isDirtctive(attrName) {
        return attrName.startsWith("v-")
    }
    isElementNode(node) {
        return node.nodeType === 1
    }
    node2Fragment(node) {
        // 创建文档碎片对象
        let f = document.createDocumentFragment();
        let firstChild
        while (firstChild = node.firstChild) {
            f.appendChild(firstChild)
        }
        return f
    }
}
class MVue {
    constructor(options) {
        this.$el = options.el
        this.$data = options.data
        this.$options = options
        if (this.$el) {
            // 实现观察者
            new Observer(this.$data)
            // 解析器
            new Compile(this.$el, this)

            this.proxyData(this.$data)
        }
    }
    proxyData(data){
        for(let key in data){
            Object.defineProperty(this,key,{
                get(){
                    return data[key]
                },
                set(newVal){
                    data[key] = newVal
                }
            })
        }
    }

}