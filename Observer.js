
class Watcher{
    constructor(vm,expr,cb){
        this.vm = vm
        this.expr = expr
        this.cb = cb
        this.oldVal = this.getOldVal()
    }
    getOldVal(){
        Dep.target = this
        let oldVal = compileUtil.getval(this.expr,this.vm)
        Dep.target = null
        return oldVal
    }
    update(){
        let newVal = compileUtil.getval(this.expr,this.vm)
        console.log(newVal)
        if(newVal !== this.oldVal){
            this.cb(newVal)
        }
    }
}


class Dep{
    constructor(){
        this.subs = []
    }
    // 收集观察者
    addSub(watcher){
        // console.log(watcher)
        this.subs.push(watcher)
    }
    // 通知变化
    notify(){
        console.log(this.subs)
        this.subs.forEach(w=>w.update())
    }
}


class Observer{
    constructor(data){
        this.observe(data)
    }
    observe(data){
        if(data && typeof data == "object" ){
            Object.keys(data).forEach(key=>{
                this.defineReactive(data,key,data[key])
            })
        }
    }
    defineReactive(data,key,value){
        
        this.observe(value);
        let dep = new Dep()
        Object.defineProperty(data,key,{
            enumerable:true,// 可枚举
            configurable:false, // 不能再define
            get(){
                // 订阅数据变化时，往Dep中添加观察者
                console.log(key)
                Dep.target && dep.addSub(Dep.target) && console.log(Dep.target)
                return value
            },
            set:(newVal)=>{
                this.observe(newVal)
                // console.log("设置")
                if(value !== newVal){
                    value = newVal
                }
                // 告诉Dep通知变化
                dep.notify()
            }
        })
    }
}