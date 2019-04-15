///Encoding: UTF-8 without signature(BOM)
///New-line char: Windows CRLF~~Unicode line separator (LS, \u2028)~~
///https://github.com/mnms/DouyuDummy
///以下代码除了极小部分特别说明的之外全都是原创，欢迎引用和学习，但请至少注明引用自本处，也欢迎讨论
const asyncIterator=(()=>{
	const learningAsync=(()=>{
		let tryAsync=(()=>{
			function rafAsync() {
				return new Promise(resolve => {
					//requestAnimationFrame(resolve) //faster than set time out
					setTimeout(resolve,500)
				})
			}
			function waitUntil(a){
				if(a) {
					return Promise.resolve(true);
				} else {
					return rafAsync().then(() => waitUntil(a));
				}
			}
			function checkElement(selector) {
				if(document.querySelector(selector)===null) {
					return rafAsync().then(() => checkElement(selector));
				} else {
					return Promise.resolve(true);
				}
			}
		})()
		const tryPromise=()=>{
			///Copied from https://coryrylan.com/blog/javascript-promises-versus-rxjs-observables
			const promise = new Promise(resolve => {
				setTimeout(() => {
					resolve('Hello from a Promise!');
				}, 2000);
			});
			promise.then(value => console.log(value));
		}
		const tryPromiseReject=()=>{}
		///备忘——同时运行多个async（可能——以及把普通函数异步执行）
		//;(async()=>{for await(const _ of ticks)send(messages.next().value)})()
		//;(async()=>{for await(const a of autoAnswering())send(a)})()
		//上面写法可能不会等待执行完毕，可能下面的会等待多个都执行完毕
		//await Promise.all([
		//	(async()=>{for await(const _ of ticks)send(messages.next().value)})(),
		//	(async()=>{for await(const a of autoAnswering())send(a)})()
		//])

		//备忘2——什么情况下需要写async、await
		//参见：https://dev.to/codeprototype/async-without-await-await-without-async--oom
		///一个函数返回Promise，和声明async，可能是等效的，二者选其一即可，也可以即声明async又返回Promise，这样没有什么特别只是罗嗦
		///await promise和promise.then也是等效的，当有返回值时const a=await promise和promise.then(a=>...)等效
		///对于async iterator可能也雷同，只要标了async，return或者yield出来的都是Promise
		const tryAsyncGenerator=(()=>{
			///尝试了一下async generator的写法，记录一下备忘
			///经过实验，async function*()不是得到一个async function，而是这个生成器的每个next()都会得到一个Promise
			const aa=async function*(){yield 1;yield 22;yield 333}
			//undefined
			const a1=await aa() ///**异步生成器不需要await**，异步生成器的每个`next()`才需要。这么写不会报错大概只是因为`await`不提供具体功能只是解释器标记，写了await会兼容不需要await的函数。
			//undefined
			a1.next()
			//Promise {<resolved>: {…}} ///**异步生成器的每个`next()`得到的是Promise**
			})()
	})()
	var ignoreTest=true
	///发现了什么？对不是async函数也可以await，就是说处理异步迭代的代码可以直接处理非异步的
	///那是不是**所有非异步代码都直接是异步的**呢？？
	///所以可能要把完全没必要异步的函数重写成非异步的
	const numbers=(()=>{
		const recursive=function*(i=0)/*递归*/{yield i++;yield*recursive(i)}
		///经过测试迭代比递归快很多，大概只用了十几分之一时间，可能是因为优先权
		const testTryRecursive=ignoreTest||(a=recursive(),
			b=a.next(),console.assert(JSON.stringify(b)==JSON.stringify({value:0,done:false}),b),
			b=a.next(),console.assert(JSON.stringify(b)==JSON.stringify({value:1,done:false}),b),
			b=a.next(),console.assert(JSON.stringify(b)==JSON.stringify({value:2,done:false}),b),
			b=a.next(),console.assert(JSON.stringify(b)==JSON.stringify({value:3,done:false}),b),
			b=a.next(),console.assert(JSON.stringify(b)==JSON.stringify({value:4,done:false}),b))
		const iterate=function*()/*迭代*/{i=0;while(true)yield i++} //需要特别注意外层不能有同名i的变量！
		const testTryIterate=ignoreTest||(a=iterate(),
			b=a.next(),console.assert(JSON.stringify(b)==JSON.stringify({value:0,done:false}),b),
			b=a.next(),console.assert(JSON.stringify(b)==JSON.stringify({value:1,done:false}),b),
			b=a.next(),console.assert(JSON.stringify(b)==JSON.stringify({value:2,done:false}),b),
			b=a.next(),console.assert(JSON.stringify(b)==JSON.stringify({value:3,done:false}),b),
			b=a.next(),console.assert(JSON.stringify(b)==JSON.stringify({value:4,done:false}),b))
		return recursive
	})()
	///@deprecated 生成器迭代后会关闭，下面有解释
	const takeThroughIterate=async function*(l,count){for await(const i of l){if(count-->0)yield i;else break}}
	const take=async function*(l,count){for(let i=0;i<count;i++)yield(await l.next()).value}
	///**调用异步函数时，不管这个被调用到的函数里面是否await了，如果调用的函数需要等被调用的函数的话，一定要在调用函数中写await**
	///还是刚刚理解到这一点……
	const testTake=ignoreTest||(a=take(numbers(),5),
		b=(await a.next()),console.assert(JSON.stringify(b)==JSON.stringify({value:0,done:false}),b),
		b=(await a.next()),console.assert(JSON.stringify(b)==JSON.stringify({value:1,done:false}),b),
		b=(await a.next()),console.assert(JSON.stringify(b)==JSON.stringify({value:2,done:false}),b),
		b=(await a.next()),console.assert(JSON.stringify(b)==JSON.stringify({value:3,done:false}),b),
		b=(await a.next()),console.assert(JSON.stringify(b)==JSON.stringify({value:4,done:false}),b),
		b=(await a.next()),console.assert(JSON.stringify(b)==JSON.stringify({value:undefined,done:true}),b),
		b=(await a.next()),console.assert(JSON.stringify(b)==JSON.stringify({value:undefined,done:true}),b),
		b=(await a.next()),console.assert(b.done!=false),b)
	
	const map=async function*(l,f,i=0){const a=await l.next();a.done||(yield f(a.value,i),yield*map(l,f,++i))}
	const testMap=ignoreTest||(a=(map(numbers(),(i,j)=>[i*11,j*222])),
		b=(await a.next()),console.assert(JSON.stringify(b)==JSON.stringify({value:[0,0],done:false}),b),
		b=(await a.next()),console.assert(JSON.stringify(b)==JSON.stringify({value:[11,222],done:false}),b),
		b=(await a.next()),console.assert(JSON.stringify(b)==JSON.stringify({value:[22,444],done:false}),b))
	//const iter=async function*(l,f){for await(const i of l)f(i)}
	const iter=async function(l,f,i=0){const a=await l.next();a.done||(f(a.value,i),await iter(l,f,++i))}
	const testIter=ignoreTest||(a=[],(await iter(take(numbers(),5),(i,j)=>a.push(i*10+j*2))),console.assert(a.length==5,a),
		console.assert(a[0]==0,a[0]),console.assert(a[1]==12,a[1]),console.assert(a[2]==24,a[2]))
	const filter=async function*(l,f){for await(const i of l){if(f(i))yield i}}
	const logTest=async l=>{for await(const i of l)console.log(i)}
	const testFilter=ignoreTest||await logTest(filter(take(numbers(),11),c=>c%2==0))
	const filterOutUnfedineds=async function*(l){yield*filter(l,i=>i!=undefined)}
	const testFilterUndefineds=ignoreTest||await logTest(filterOutUnfedineds(map(take(numbers(),11),c=>c%2==0?`双数：${c}！`:undefined)))
	///@deprecated remomend to use filterUndedineds explicitly, 这行是留下备忘、作参考的
	const collect=async function*(a,f){yield*filterOutUnfedineds(map(a,f))}
	const testCollect=ignoreTest||await logTest(collect(take(numbers(),11),c=>c%2==0?`双数：${c}！`:undefined))
	///scan with state, like F# Seq.scan.
	///@deprecated 实际用到的不是这条，白写了……还是留下备忘，作参考
	const reduce=async function*(l,f,initial=0){let memory=initial;for await(const i of l){const[r,state]=f(i,memory);memory=state;yield r}}
	const testReduce=ignoreTest||await logTest(reduce(take(numbers(),11),(i,s)=>[i+s,i+s]))
		
	///[流]模组，命名参考F#的STREAM，概念可能也一致，代码上没有参考（并不是不想参考，只是先自己写写看）
	///流在内部管理一个异步迭代
	///流就像一个水流，可以进行截断、积蓄、分流并流等
	///考虑实际上只是给[异步迭代]增加一个preload（或者cache）函数，preload之后的操作其实都不必在流模组内
	///所以就写在异步迭代下，哪些函数是流模组下的（哪些直接在异步迭代下）还会再推敲
	//const stream=(()=>{
		//class __{constructor(a){this.iter=a}}
		//const _=new __
		//const ofAsyncIterator=a=>_(a)
		//const testStreamOfAsyncIterator=()=>ofAsyncIterator()
		//const intercept/*截流*/=(stream,pool)=>{
		//	var m=[];
		//	(async()=>{for await(const i of stream)m.push(i)})()
		//	for await(const i of this.tryRecursive()){
		//		const result=await this.asyncDelay(i,3000)
		//		yield m
		//		m=[]
		//	}
		//}
		///似乎`setTimeout`就是异步的，区别是Promise可以await，setTimeout不能
		const promiseTimeout=(delay=1e3,f=()=>{})=>new Promise((resolve,reject)=>setTimeout(()=>resolve(f()),delay))
		const testPromisedTimeout=ignoreTest||console.log(await promiseTimeout(1e3,()=>"delay returned"))
		const tryDelayYieldNumbersOld=async function*(interval=1e3){
			for await(const i of tryRecursive())yield await promiseTimeout(interval,()=>i)}
		const tryDelayYieldNumbers=async function*(interval=1e3){
			for await(const i of tryRecursive())(await promiseTimeout(interval),yield i)}
		const testDelayYieldNumbers=ignoreTest||await logTest(take(tryDelayYieldNumbers(3e3),5))
		const tryIntervaledYieldingNumbers=async function*(interval=1e3){
			for await(const i of tryRecursive())(yield i,await promiseTimeout(interval))}
		ignoreTest=false
		const testIntervaledYieldingNumbers=ignoreTest||await logTest(take(tryIntervaledYieldingNumbers(3e3),5))
		const testDelayYieldNumbers_Resuming=ignoreTest||(()=>{
			const a=tryDelayYieldNumbers(8e2)
			for(i=3;i--;i>0)console.log(a.next().value)
			for(i=4;i--;i>0)console.log(a.next().value)})()
		const testDelayYieldNumbers_Resuming_NotFitting_Failed=ignoreTest||(async()=>{
			const a=tryDelayYieldNumbers(6e2)
			let m=[],endOn=Date.now()+3e3
			while(Date.now()<endOn)m.push((await a.next()).value) ///3/.6=5
			console.log(m)
			m=[],endOn=Date.now()+4e3
			///问题在这里产生了,即使等待时间已经过了,最后一次`await a.next()`仍然会被等待完成,要可以暂停当前await,下次再继续
			///大致有几个思路，一、先看看是否有内建的暂停/继续方法——查了一下，是没有的
			///二、或许也可以把等待和yield分开执行；
			///三、到时间时直接替换M，这条看起来可行性最好，但不确定会不会有对M的引用问题；
			///四、在while里通过setTimeout来break
			///五、next()之前检查是否已经超时，如果超时则break，并立即在下个迭代中yield，此方法扩展性不好
			///六、yield时如果已经超时了，暂存最后一个，下次yield
			///七、超时作为一个Promise，查询发现Promise有个rase函数，这条看来最靠谱，应该可以暂停，但不知道能否继续
			///- 现在遇到的问题是for await asynchronous generator出来的不是Promise！！
			///- 这就引申到一个有趣的问题：**async** generator还是generator with `next()` returns a Promise？两者会有什么区别吗？
			///	*测试发现这两个是一个东西*
			///- 此方案的问题是Promise rase不能自动reject，需要显性操作reject
			///八、应该比较容易实现的方式是做一个纯粹占时间的yield，再yield实际内容
			///- “When generator yields, it is paused, until iterator calls next() on it. Then the generator resumes the execution, until it yields again”[https://stackoverflow.com/a/45240956/5975828]
			///-	还是会有问题……实际（例如弹幕）是**不能预知等待时间的！**那要怎样yield等待时间？
			///九、或者可能就颠倒一下等待和yield数据？
			while(Date.now()<endOn)m.push((await a.next()).value) ///4/.6=6...4 本应执行6次,实际7次
			console.log(m)
			m=[],endOn=Date.now()+5e3
			while(Date.now()<endOn)m.push((await a.next()).value) ///5.4/.6=9
			console.log(m)})()
		///对咯！
		const testPromiseRace=ignoreTest||(async()=>{
			const a=tryDelayYieldNumbers(6e3)
			let pause,promiseToPause=new Promise(resolve=>{pause=resolve})
			console.trace(await Promise.race([a.next(),promiseToPause]))
			pause()
		})()
		///失败，此方案的问题是**Promise rase不能自动reject**，需要显性操作reject
		///之后问题的关键是reject
		////JS pause yield
		////JS yield rejected again
		////JS promise rejected again
		const testDelayYieldNumbers_PausingResumingWithPromiseRace=ignoreTest||(async()=>{
			const a=tryDelayYieldNumbers(6e2)
			let pause,promiseToPause=new Promise(resolve=>{pause=resolve})
			setTimeout(pause,3e3)
			console.log(await Promise.race([a.next(),promiseToPause]))
			console.log(await Promise.race([a.next(),promiseToPause]))
			console.log(await Promise.race([a.next(),promiseToPause]))
			console.log(await Promise.race([a.next(),promiseToPause]))
			///promiseToPause已经是resolved，所以从第五个开始后面不会迭代
			console.log(await Promise.race([a.next(),promiseToPause]))
			console.log(await Promise.race([a.next(),promiseToPause]))
			console.log(await Promise.race([a.next(),promiseToPause]))
			///重计，Promise不能reset：https://stackoverflow.com/a/26874028/5975828
			promiseToPause=new Promise(resolve=>{pause=resolve})
			setTimeout(pause,4e3)
			console.log(await Promise.race([a.next(),promiseToPause]))
			console.log(await Promise.race([a.next(),promiseToPause]))
			console.log(await Promise.race([a.next(),promiseToPause]))
			console.log(await Promise.race([a.next(),promiseToPause]))
			console.log(await Promise.race([a.next(),promiseToPause]))
			console.log(await Promise.race([a.next(),promiseToPause]))
			console.log(await Promise.race([a.next(),promiseToPause]))
			console.log(await Promise.race([a.next(),promiseToPause]))
			console.log(await Promise.race([a.next(),promiseToPause]))
			console.log(await Promise.race([a.next(),promiseToPause]))
			console.log(await Promise.race([a.next(),promiseToPause]))
			//const loop=async duration=>{
			//	console.log(await Promise.race([a.next(),promiseToPause]))
			//	setTimeout(pause,duration)
			//}
		})()
		const tryRearrange=async function*(){
			var m=[];
			(async()=>{for await(const i of tryDelayYieldNumbers())m.push(i)})()
			for await(const i of tryRecursive()){
				const result=await promiseTimeout(3000)
				yield m
				m=[]
			}
		}
		const testTryRearrange=ignoreTest||await logTest(take(tryRearrange(),5))
		const tryRearrange2=async function*(){
			var m=[];
			(async()=>{for await(const i of tryDelayYieldNumbers())m.push(i)})()
			while(true){
				await promiseTimeout(3000)
				yield m
				m=[]
			}
		}
		const testTryRearrange2=ignoreTest||await logTest(take(tryRearrange2(),5))
		///@deprecated “中断”迭代时会导致生成器关闭的问题
		const preloadThroughIterate=l=>{
			const m=[];let toBreak=false
			///这里会有个问题——怎样确定这个for await占用的资源是不是被释放了？
			;(async()=>{for await(const i of l){if(toBreak)break;else m.push(i)}})()
			return()=>(toBreak=true,[...m])}
		///这是个失败的尝试，这里有个问题卡了好几天
		///对异步迭代做for await，break后，该迭代会成`GeneratorStatus:closed`，不能再次迭代
		///（查了MDN，非异步迭代也是这样）
		///大量查询也没有找到close之后再open的方法，
		///也提了问题：https://stackoverflow.com/questions/55276664/how-to-reopen-asynciterator-after-broke-a-for-await-loop
		///这可能神作了……可能有很多涉及到的函数得重写一下
		const testMultipleLoops=ignoreTest||(async()=>{
			const l=tryDelayYieldNumbers()
			let count=3
			for await(const i of l){if(count-->0)console.log(i);else break}
			count=4
			for await(const i of l){if(count-->0)console.log(i);else break}
			count=5
			for await(const i of l){if(count-->0)console.log(i);else break}
		})()
		const preload=l=>{
			const m=[];let breakup=false
			///这里会有个问题——能确认这个for await占用的资源被释放了吗？
			;(async()=>{while(!breakup){m.push((await l.next()).value)}})()
			return()=>(breakup=true,m)
		}
		const testPreload=ignoreTest||console.log(await promiseTimeout(3e3,preload(tryDelayYieldNumbers())))
		const tryRearrange3=async function*(){
			const a=tryDelayYieldNumbers()
			console.log(1)
			yield(await promiseTimeout(1e4,preload(a)))
			console.log(1)
			yield(await promiseTimeout(1e4,preload(a)))
			console.log(1)
			yield(await promiseTimeout(1e4,preload(a)))
		}
		const testTryRearrange3=ignoreTest||await logTest(tryRearrange3())
		const tryRearrange4=async function*(){
			const a=tryDelayYieldNumbers(888)
			while(true){yield(await promiseTimeout(3e3,preload(a)))}}
		///TODO:当前问题：每一组都会跳一个
		///要改下生成器，等待和`yield`不能一个操作
		const testTryRearrange4=ignoreTest||await logTest(tryRearrange4())
	//})()
})()