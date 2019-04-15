///Encoding: UTF-8 without signature(BOM)
///New-line char: ~~Unicode line separator (LS, \u2028)~~
///	Windows CRLF
///https://github.com/mnms/DouyuDummy
/***以下代码除了极小部分特别说明的之外全都是原创
欢迎引用和学习，但请至少注明引用自本处，也欢迎讨论**

**Javascript除了没有类型检查这点极其蛋疼之外
真的是越写越得劲儿！非常自由**

#### 几种结构写法的比较
- JSON写法最简练，而且JSON里面居然可以声明class！很强大！
	~~问题是**结构内不能互相调用**，这样一来就不能用来主要使用了，只能写数据~~
	**更正**：JSON之内是可以互相调用的，问题在于不能在声明时调用，而可以写成函数，声明后调用
	JSON可以写值，可以写函数，但就是不能直接赋一个JSON内的函数调用另一个值得到的结果，这个局限还是很大的
	还有个问题就是没有local scope，调用时必须要从根写起，啰嗦，不适合做深层结构
	还有不能一次多个赋值`[a,b]:[1,2]`
- const f=(()=>{...})()强大，符合函数式风格，除了写法奇怪，还算不错
- class啰嗦，并且**不能嵌套**，也是只能做数据
*/
var dummy=()=>{
	//const runTests=false ///写完之后发觉并没什么用……因为测试一般都是剪一段代码控制台运行，剪出的代码最重要是尽可能减少有依赖……
	//const test=(f,force)=>{if(force||runTests)f()}
	//const forceTest=f=>test(f,true)
	//test(()=>console.log("just test!"))
	//forceTest(()=>console.log("a forced test!"),true)
	///ES6 Iterators, RxJS, IxJS and the Async Iterators proposal https://blog.scottlogic.com/2016/06/29/es6-iterators.html
	const array={
		zip:(a,b)=>a.map((a,i) =>[a,b[i]])
	}
	const testArray={
		testZip:async()=>{
			const a=[1,2,3],b=["a","b","c"],c=array.zip(a,b)
			for await(const i of c)console.log(i)
		}
	}
	class iter{
		//Just copied from https://stackoverflow.com/a/53159921/2537458, thanks to @MartyO256
		static map(iterable,callback){
			return {
				[Symbol.iterator](){
					const iterator=iterable[Symbol.iterator]()
					return{
						next(){
							const r=iterator.next()
							if(r.done)return r;else{return{value:callback(r.value),done:false}}
						}
					}
				}
			}
		}
	}
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
		const take=async function*(l,count){for(let i=0;i<count;i++)yield(await l.next()).value}
		///@deprecated 生成器迭代后会关闭，下面有解释
		const takeThroughIterate=async function*(l,count){for await(const i of l){if(count-->0)yield i;else break}}
		///发现了什么？对不是async函数也可以await，就是说处理异步迭代的代码可以直接处理非异步的
		///那是不是**所有非异步代码都直接是异步的**呢？？
		///所以可能要把完全没必要异步的函数重写成非异步的
		const numbers=function*(){let i=0;while(true)yield i++}
		const logTest=async l=>{for await(const i of l)console.log(i)}
		let runTest=false
		///**调用异步函数时，不管这个被调用到的函数里面是否await了，如果调用的函数需要等被调用的函数的话，一定要在调用函数中写await**
		///还是刚刚理解到这一点……
		const testTake=runTest&&await logTest(take(numbers(),5))
		const tryRecursive=async function*(i=0)/*试试递归*/{console.count("tryRecursive");yield i++;yield*tryRecursive(i)} ///TODO: 查查看有没有更好写法
		///经过测试迭代比递归快很多，大概只用了十几分之一时间，可能是因为优先权
		const testTryRecursive=runTest&&await logTest(take(tryRecursive(),11))
		const tryIterate=async function*()/*试试迭代*/{let i=0;while(true){console.count("tryIterate");yield i++}}
		const testTryIterate=runTest&&await logTest(take(tryIterate(),11))

		const map=async function*(a,f){for await(const b of a)yield f(b)}
		const testMap=runTest&&await logTest(map(take(numbers(),5),c=>`茶树：${c}`))
		const filter=async function*(l,f){for await(const i of l){if(f(i))yield i}}
		const testFilter=runTest&&await logTest(filter(take(numbers(),11),c=>c%2==0))
		const filterOutUnfedineds=async function*(l){yield*filter(l,i=>i!=undefined)}
		const testFilterUndefineds=runTest&&await logTest(filterOutUnfedineds(map(take(numbers(),11),c=>c%2==0?`双数：${c}！`:undefined)))
		///@deprecated remomend to use filterUndedineds explicitly, 这行是留下备忘、作参考的
		const collect=async function*(a,f){yield*filterOutUnfedineds(map(a,f))}
		const testCollect=runTest&&await logTest(collect(take(numbers(),11),c=>c%2==0?`双数：${c}！`:undefined))
		///scan with state, like F# Seq.scan.
		///@deprecated 实际用到的不是这条，白写了……还是留下备忘，作参考
		const reduce=async function*(l,f,initial=0){let memory=initial;for await(const i of l){const[r,state]=f(i,memory);memory=state;yield r}}
		const testReduce=runTest&&await logTest(reduce(take(numbers(),11),(i,s)=>[i+s,i+s]))
		
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
			/////依时间段进行打包，把每个时间段中的水包装
			//const packageByTime=()=>{}
			///似乎`setTimeout`就是异步的，区别是Promise可以await，setTimeout不能
			const promiseTimeout=(delay=1e3,f=()=>{})=>new Promise((resolve,reject)=>setTimeout(()=>resolve(f()),delay))
			const testPromisedTimeout=runTest&&console.log(await promiseTimeout(1e3,()=>"delay returned"))
			const tryDelayYieldNumbersOld=async function*(interval=1e3){
				for await(const i of tryRecursive())yield await promiseTimeout(interval,()=>i)}
			const tryDelayYieldNumbers=async function*(interval=1e3){
				for await(const i of tryRecursive())(await promiseTimeout(interval),yield i)}
			const testDelayYieldNumbers=runTest&&await logTest(take(tryDelayYieldNumbers(),5))
			const testDelayYieldNumbers_Resuming=runTest&&(()=>{
				const a=tryDelayYieldNumbers(8e2)
				for(i=3;i--;i>0)console.log(a.next().value)
				for(i=4;i--;i>0)console.log(a.next().value)})()
			const testDelayYieldNumbers_Resuming_NotFitting_Failed=runTest&&(async()=>{
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
			const testPromiseRace=runTest&&(async()=>{
				const a=tryDelayYieldNumbers(6e3)
				let pause,promiseToPause=new Promise(resolve=>{pause=resolve})
				console.trace(await Promise.race([a.next(),promiseToPause]))
				pause()
			})()
			runTest=true
			///失败，此方案的问题是**Promise rase不能自动reject**，需要显性操作reject
			///之后问题的关键是reject
			////JS pause yield
			////JS yield rejected again
			////JS promise rejected again
			const testDelayYieldNumbers_PausingResumingWithPromiseRace=runTest&&(async()=>{
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
			const testTryRearrange=runTest&&await logTest(take(tryRearrange(),5))
			const tryRearrange2=async function*(){
				var m=[];
				(async()=>{for await(const i of tryDelayYieldNumbers())m.push(i)})()
				while(true){
					await promiseTimeout(3000)
					yield m
					m=[]
				}
			}
			const testTryRearrange2=runTest&&await logTest(take(tryRearrange2(),5))
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
			const testMultipleLoops=runTest&&(async()=>{
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
			const testPreload=runTest&&console.log(await promiseTimeout(3e3,preload(tryDelayYieldNumbers())))
			const tryRearrange3=async function*(){
				const a=tryDelayYieldNumbers()
				console.log(1)
				yield(await promiseTimeout(1e4,preload(a)))
				console.log(1)
				yield(await promiseTimeout(1e4,preload(a)))
				console.log(1)
				yield(await promiseTimeout(1e4,preload(a)))
			}
			const testTryRearrange3=runTest&&await logTest(tryRearrange3())
			const tryRearrange4=async function*(){
				const a=tryDelayYieldNumbers(888)
				while(true){yield(await promiseTimeout(3e3,preload(a)))}}
			///TODO:当前问题：每一组都会跳一个
			///要改下生成器，等待和`yield`不能一个操作
			const testTryRearrange4=runTest&&await logTest(tryRearrange4())
		//})()
	})()
	const douyu={
		gifts:(()=>{
			class Gift{constructor(name,quantifier,id,score=1){this.name=name;this.quantifier=quantifier,this.id=id,this.score=score}}
			const a={
				///可以开宝箱领的
				弱鸡:["只","344fe065475cc90728b7744818ffe2b5",2], ///经验+2 亲密度+2
				小熊:["只","27c9b64d43d1726acbe9e256bc4f2c5d"], ///.1翅 1人民币=1鱼翅=1000鱼丸=10经验
				赞:["枚",["42669592fba5a9c067614dee8feea7de","593454a87af9f5a0b0075ee96e6abebf"]],
				呵呵:["枚","61414e3b96e9e6112ee6cdb8bc7f4f3a"],
				香吻:["枚","ab8d2f5b9cb715c3b56fc803a79bc8db"],
				棒棒哒:["枚","ab5248d6a26da27076613affb8f6e77e"],
				荧光棒:["根","c78bd03226f8cc00d60122bf9260490c"],
				通行证:["张","a1c5aafd104537d89ba1d2d5f8620ef2"], ///车队通行证
				辣眼睛:["个","c669ecfe9e550924163df2d5f35d074d"],
				///付费的
				飞机:["架","296d39b7951a249d6f640ed58cfacb67",1000], ///100翅 各+1000
				办卡:["张","4388bdce84df1cb6965d592726ecf8b3",60], ///6翅
				小飞碟:["支","45fbb13ed057bcb19e33137cf3f24ad5",10], ///1翅
				幸运水晶:["颗","513e9396081c85f3c081675a0740e20b"], ///.1翅 各+1
				鱼丸:["碗","66e19302ad32726d602a04e38c5cc726"], ///100鱼丸 各+1
				///抽奖的
				太空卡:["张","f3e206359deffbdee0a0cdbccbab704b",60], ///太空旅行卡 ///6翅
				棒棒糖:["根","d331dce3ee6817a2e89e78472749c49c",10], ///星空棒棒糖 ///1翅 贡献+10 经验+10 亲密度+10
				小星星:["颗","5163e0b5c3d9b33cf2ab0ff9d02a0956"], ///星星 ///.1翅 各+1
			}
			return Object.keys(a).map(k=>{const i=a[k];i.unshift(k);return new Gift(...i)})
		})(),
		giftsOriginData:{
///可以开宝箱领的
"https://gfs-op.douyucdn.cn/dygift/1606/344fe065475cc90728b7744818ffe2b5.gif?x-oss-process=image/format,webp":["只","弱鸡"], ///经验+2 亲密度+2
"https://gfs-op.douyucdn.cn/dygift/1704/27c9b64d43d1726acbe9e256bc4f2c5d.gif?x-oss-process=image/format,webp":["只","小熊"], ///.1翅 1人民币=1鱼翅=1000鱼丸=10经验
"https://gfs-op.douyucdn.cn/dygift/2018/11/29/42669592fba5a9c067614dee8feea7de.gif?x-oss-process=image/format,webp":["枚","赞"],
"https://gfs-op.douyucdn.cn/dygift/1705/593454a87af9f5a0b0075ee96e6abebf.gif?x-oss-process=image/format,webp":["枚","赞"],
"https://gfs-op.douyucdn.cn/dygift/1612/61414e3b96e9e6112ee6cdb8bc7f4f3a.gif?x-oss-process=image/format,webp":["枚","呵呵"],
"https://gfs-op.douyucdn.cn/dygift/1612/ab8d2f5b9cb715c3b56fc803a79bc8db.gif?x-oss-process=image/format,webp":["枚","香吻"],
"https://gfs-op.douyucdn.cn/dygift/1704/ab5248d6a26da27076613affb8f6e77e.gif?x-oss-process=image/format,webp":["枚","棒棒哒"],
"https://gfs-op.douyucdn.cn/dygift/1705/c78bd03226f8cc00d60122bf9260490c.gif?x-oss-process=image/format,webp":["根","荧光棒"],
"https://gfs-op.douyucdn.cn/dygift/2018/11/16/a1c5aafd104537d89ba1d2d5f8620ef2.png?x-oss-process=image/format,webp":["张","通行证"], ///车队通行证
"https://gfs-op.douyucdn.cn/dygift/1704/c669ecfe9e550924163df2d5f35d074d.gif?x-oss-process=image/format,webp":["个","辣眼睛"],
///付费的
"https://gfs-op.douyucdn.cn/dygift/2018/11/27/296d39b7951a249d6f640ed58cfacb67.gif?x-oss-process=image/format,webp":["架","飞机"], ///100翅 各+1000
"https://gfs-op.douyucdn.cn/dygift/2018/11/27/4388bdce84df1cb6965d592726ecf8b3.gif?x-oss-process=image/format,webp":["张","办卡"], ///6翅
"https://gfs-op.douyucdn.cn/dygift/2018/12/26/45fbb13ed057bcb19e33137cf3f24ad5.gif?x-oss-process=image/format,webp":["支","小飞碟"], ///1翅
"https://gfs-op.douyucdn.cn/dygift/2018/12/26/513e9396081c85f3c081675a0740e20b.png?x-oss-process=image/format,webp":["颗","幸运水晶"], ///.1翅 各+1
"https://gfs-op.douyucdn.cn/dygift/2018/12/18/66e19302ad32726d602a04e38c5cc726.gif?x-oss-process=image/format,webp":["碗","鱼丸"], ///100鱼丸 各+1
///抽奖的
"https://gfs-op.douyucdn.cn/dygift/1808/f3e206359deffbdee0a0cdbccbab704b.gif?x-oss-process=image/format,webp":["张","太空卡"], ///太空旅行卡 ///6翅
"https://gfs-op.douyucdn.cn/dygift/1808/d331dce3ee6817a2e89e78472749c49c.gif?x-oss-process=image/format,webp":["根","棒棒糖"], ///星空棒棒糖 ///1翅 贡献+10 经验+10 亲密度+10
"https://gfs-op.douyucdn.cn/dygift/1808/5163e0b5c3d9b33cf2ab0ff9d02a0956.gif?x-oss-process=image/format,webp":["颗","小星星"], ///星星 ///.1翅 各+1
		},
		getGiftIdFromUrl:url=>(a=url.lastIndexOf("."),url.slice(url.lastIndexOf("/",a)+1,a)),
		testGetGiftIdFromUrl:()=>(a=douyu.getGiftIdFromUrl("https://gfs-op.douyucdn.cn/dygift/1808/5163e0b5c3d9b33cf2ab0ff9d02a0956.gif?x-oss-process=image/format,webp")
			,console.assert(a=="5163e0b5c3d9b33cf2ab0ff9d02a0956",a)),
		//,testGetGiftIdFromUrl2:()=>{a=array.zip(douyu.gifts,douyu.giftsOriginData)
		//	for(const[b,c]of a)console.assert(a==douyu.getGiftIdFromUrl(b))}
		getGiftfromUrl:a=>(id=douyu.getGiftIdFromUrl(a),douyu.gifts.find(i=>i.id instanceof Array?i.id.includes(id):i.id==id)||
			(console.error(a),{name:"礼物",quantifier:"个",score:Number.MAX_SAFE_INTEGER})),
		testGetGiftfromUrl:()=>[
			douyu.getGiftfromUrl("42669592fba5a9c067614dee8feea7de"),
			douyu.getGiftfromUrl("296d39b7951a249d6f640ed58cfacb67")]}
	const room=(()=>{
		const id=Number(window.location.pathname.substring(1))
		const name=id==5095833?"雷哥直播间":id==678804?"亚男老师的音乐直播间":
			id==217331?"表哥直播间":id==5074415?"半支烟直播间":id==6119609?"编程直播间":"直播间"//肉球
		let get=a=>document.getElementsByClassName(a)[0]
		const chat=(()=>{
			class Welcome{constructor(user){this.user=user}}
			class Gift{constructor(user,[quantity,gift]){this.user=user;this.gift=gift,this.quantity=quantity,this.quantifier=gift.quantifier}}
			const list=(()=>{
				const list=get("Barrage-list")
				const welcome=a=>{
					if(a.classList.contains("Barrage-userEnter")){
						const b=a.lastElementChild
						console.assert(b.tagName=="SPAN",b)
						console.assert(b.className=="Barrage-text",b)
						console.assert(b.innerText=="欢迎来到本直播间",b)
						return new Welcome(b.previousElementSibling.title)
					}
				}
				const gift=a=>{
					if(a.classList.contains("Barrage-message")){
						const b=a.lastElementChild
						console.assert(b.tagName=="SPAN",b)
						console.assert(b.className=="Barrage-text",b)
						console.assert(b.innerText.trim().startsWith("赠送给主播"),b)
						console.assert(b.firstElementChild.tagName=="IMG",b)
						const parseGift=douyu.getGiftfromUrl
						const make=a=>[a.lastElementChild.tagName=="SPAN"?Number(a.lastElementChild.innerText.substring(1)):1,parseGift(a.firstElementChild.src)]
						return new Gift(b.previousElementSibling.title,make(b))
					}
				}
				const sort=a=>{
					console.assert(a.tagName=="LI"&&a.classList.contains("Barrage-listItem"))
					const sort=a=>{
						const isSystemMessage=a.tagName=="A"&&a.className=="Barrage-notice Barrage-notice--red"
						if(!isSystemMessage){
							console.assert(a.tagName=="DIV",a)
							return welcome(a)||gift(a)
						}
					}
					return sort(a.lastElementChild)
				}
				///learned from https://stackoverflow.com/a/35718902/2537458, thanks to @Volune
				const eventIterator=(target,eventName)=>{
					class Controller{
						next(){return new Promise(resolve=>target.addEventListener(eventName,function f(e) {
							target.removeEventListener(eventName, f)
							resolve({value:e.target,done:false})
						}))}
						[Symbol.asyncIterator](){return{next:()=>this.next()}}
					}
					return new Controller()
				}
				const testEventIterator=async()=>{
					document.body.insertAdjacentHTML("beforeEnd","<input/>")
					const t=document.body.lastChild;
					for await(const a of eventIterator(t,"input"))console.log(a)
				}
				const onMessageReceived=()=>{
					const a=eventIterator(list,"DOMNodeInserted")
					return asyncIterator.collect(a,sort)
				}
				const testOnMessageReceived=async()=>{
					for await(const a of onMessageReceived())console.log(a)
				}
				return onMessageReceived()
			})()
			//注意此方法不会自动检查是否能发言 要明确检查冷却时间等
			let speak=(()=>{
				let input=get("ChatSend-txt")
				let sendButton=get("ChatSend-button")
				let send=a=>{
					input.value=a
					sendButton.click()
				}
				let getRoomMsgCd=()=>(!isNaN(Number(sendButton.innerText)))?Number(sendButton.innerText):0
				let canSend=()=>sendButton.className.toLocaleString().search("is-gray")==-1
				let test=()=>{
					send("[emot:dy108][emot:dy108]")
					console.log(getRoomMsgCd())
				}
				return{list,input,send,sendButton,canSend,getRoomMsgCd,test}
			})()
			return{list,speak,Welcome,Gift}
		})()
		///@deprecated
		Element.prototype.remove=function(){
			this.parentElement.removeChild(this)
		}
		let player=(()=>{
			let getPauseButton=()=>get("pause-c594e8")
			let pause=()=>getPauseButton().click()
			//let pausePlayerWhenLoaded=(()=>{
			//    while(!getPauseButton())await new Promise(r => setTimeout(r,500))
			//    getPauseButton().click()
			//})()
			return{pause}
		})()
		let danmuCloseButton=get("showdanmu-42b0ac") //关闭弹幕按钮
		let hideDanmu=()=>danmuCloseButton.click()
		let pageFullscreenButton=get("wfs-2a8e83") //关闭弹幕按钮
		let pageFullscreen=()=>pageFullscreenButton.click()
		let getBackpackPopup=()=>get("Backpack JS_Backpack") //背包弹窗
		let isShowingBackpack=()=>getBackpackPopup()!=undefined
		let getBubbleBox=()=>get("bubble-box-418e1e") //颜值主播右下角的点赞泡泡动画
		class user{
			static isEditingMessage(){return chat.speak.input.value!=""}
			static isOpeningBackpack(){return isShowingBackpack()}
			static isOperating(){return user.isEditingMessage()||user.isOpeningBackpack()}
		}
		return{name,player,chat,hideDanmu,pageFullscreen,user,
			danmu:get("comment-37342a danmu-6e95c1"), //聊天弹幕区
			broadcast:get("broadcastDiv-af5699"), //广播弹幕区
			//let video=get("layout-Player-videoEntity"), //视频区
			video:get("_32G4lrnklPDotWjRQmof27"), //video标签
			aside:get("layout-Player-aside"), //右侧栏(聊天和上面的贡献榜)
			backpack:get("PlayerToolbar-backpackArea") //背包按钮
		}
	})()
	///增强直播间 降低CPU占用 放大聊天栏
	const enhanceControl=()=>{
		let a=room
		let optimizeCpuUsage=()=>{
			a.player.pause()
			//a.video.remove() //对CPU占用影响不明显 只要暂停就行了
			a.hideDanmu()
			a.broadcast.remove()
		}
		let enlargeChatlist=()=>{
			///默认宽度363
			//a.aside.style.width="444px"
			///直播间顶端工具栏（推流码、主播积分等）的zIndex是200
			//a.aside.style.zIndex=1111
			//a.aside.style.position="fixed"
			//a.backpack.style.zIndex=1111
			room.pageFullscreen()
		}
		//压缩聊天列表内容
		let compactChatlist=()=>{
			//ul.Barrage-list#js-barrage-list 消息列表
			//ul.Barrage-list#js-barrage-list li.Barrage-listItem 消息
			//ul.Barrage-list#js-barrage-list li.Barrage-listItem div.Barrage-notice--normalBarrage 聊天消息
			//ul.Barrage-list#js-barrage-list li.Barrage-listItem div.Barrage-userEnter.Barrage-userEnter--default 欢迎消息

			//span.Barrage-hiIcon 最前面的“Hi” 好像是欢迎信息专有的 可以不隐藏
			//a.Medal 最前面的奖章（“第一次”）
			//a.FansMedal is-made Barrage-icon js-fans-hover js-fans-dysclick //特殊粉丝牌“蘑菇”、“大马猴”等，有点奇怪 这个有element style-display，需要用!important

			//.Barrage-icon
			//span.Barrage-icon.Barrage-icon--roomAdmin 房管牌
			//span.Barrage-icon.Barrage-noble 贵族牌
			//div.FansMedal level-29 js-fans-dysclick Barrage-icon 粉丝牌

			//span.UserLevel UserLevel--3 用户牌
			//span.Motor 车牌
			//span.Barrage-nickName.Barrage-nickName--blue.js-nick 用户名
			//span.Barrage-content 信息内容

			//以下是有padding的消息条目
			//div.js-noblefloating-barragecont.Barrage-notice--noble 贵族
			//div.js-fansfloating-barragecont.Barrage--paddedBarrage 粉丝
			document.head.insertAdjacentHTML("beforeEnd",
				'<style>ul.Barrage-list#js-barrage-list li.Barrage-listItem{margin:2px 0}'+
				'a.Medal,.Barrage-icon{display:none}a.Barrage-icon{display:none !important}'+
				'span.UserLevel{display:none}span.Motor{display:none}'+
				'div.js-noblefloating-barragecont.Barrage-notice--noble,'+
				'div.js-fansfloating-barragecont.Barrage--paddedBarrage{padding:0 10px}</style>')
		}
		//聊天消息强制单行“溢出显示”
		let sortMessagesToSingleline=()=>{
			///!!!!关键问题是一个元素的overflow-y=scroll或者hidden时，其overflow-x只能auto，设置为visible无效！
			///解决也很简单，两层容器，内层放Y滚动条，宽度自适应，外层再切掉内层一部分宽度
			let a=
				'div.Barrage-main>div:first-child>div:first-child{white-space:nowrap;text-align:right;overflow-x:unset!important;'+
					'left:unset!important;'+ ///解开宽度设置 重置为自适应宽度
					//'pointer-events:none;'+ ///修正被屏蔽的视频区工具栏右侧按钮
				'}'
			///之后吧上面的overflow hidden全重置
			a+=
				'div.layout-Player-asideMain,div.Barrage,div.Barrage-main{overflow:unset}'+
				'div.Barrage-main>div:first-child{overflow:unset !important}'
			//let setUsernameAndTextBackground='span.Barrage-nickName,span.Barrage-content{background:rgba(248,248,248,.9)}'
			a+='li.Barrage-listItem{float:right;clear:both}' ///修正消息背景色条长度到和文字一致，默认是整个列表的宽度
			let compactChatlistHeight=
				'div.js-noblefloating-barragecont.Barrage-notice--noble,'+
				'div.js-fansfloating-barragecont.Barrage--paddedBarrage,'+
				'div[class^="Barrage-userEnter is-noble Barrage-userEnter--"]'+
					'{padding:0 10px}'+
				'ul.Barrage-list#js-barrage-list li.Barrage-listItem{margin:2px 0}'
			let bringControlBarFront='div.controlbar-f41e38{z-index:2}'
			document.head.insertAdjacentHTML("beforeEnd",`<style>${a}${compactChatlistHeight}${bringControlBarFront}</style>`)
		}
		/*optimizeCpuUsage();*/enlargeChatlist();sortMessagesToSingleline()
	}
	///滚动发弹幕
	const batchSendMessage=async(messages,interval=2*1000)=>{
		////自动刷弹幕
		let count=0
		const log=delay=>console.log("#"+count++ +" "+delay)
		const fakeNaturalTypingDelay=(minDelay,maxDelay=minDelay*1.5)=>(console.count(),minDelay+Math.random()*(maxDelay-minDelay+1))
		const send=room.chat.speak.send,input=room.chat.speak.input,user=room.user
		const batchSendMessage=(messages,minDelay,maxDelay,instantStart=true)=>{
			let autoSendMsg
			let stop=()=>{console.log("STOP");clearTimeout(autoSendMsg)}
			let send1=(messages,minDelay,maxDelay,instantStart=false)=>{
				let canSend=room.chat.send.canSend
				if(!canSend())return
				let getRoomMsgCd=room.chat.send.getRoomMsgCd
				let next=()=>messages.next().value
				if(instantStart)send(next())
				let roomMsgCd=getRoomMsgCd()
				let setIntervalTime=fakeNaturalTypingDelay(minDelay,maxDelay)
				let realIntervalTime=roomMsgCd>setIntervalTime?roomMsgCd:setIntervalTime;
				log(realIntervalTime)
				autoSendMsg=setTimeout(function(){send1(messages,minDelay,maxDelay,true)},realIntervalTime*1000+300)
			}
			console.log("START")
			send1(messages,minDelay,maxDelay,instantStart)
			return{stop}
		}
		const batchSendMessage2=(messages,minDelay,maxDelay,instantStart=true)=>{
			let delaySend
			let send=(messages,minDelay,maxDelay)=>{
				let canSend=room.chat.send.canSend
				if(!canSend())return
				let getRoomMsgCd=room.chat.send.getRoomMsgCd
				let roomSend=room.chat.send.send
				let fakeNaturalTypingDelay=()=>minDelay+Math.random()*(maxDelay-minDelay+1)
				let next=()=>messages.next().value
				if(instantStart)roomSend(next())
				let roomMsgCd=getRoomMsgCd()
				let setIntervalTime=fakeNaturalTypingDelay()
				let realIntervalTime=roomMsgCd>setIntervalTime?roomMsgCd:setIntervalTime;
				log(realIntervalTime)
				delaySend=setTimeout(function(){send(messages,minDelay,maxDelay)},realIntervalTime*1000+300)
			}
			console.log("START")
			instantStart?send(messages,minDelay,maxDelay):delaySend=setTimeout(function(){send(messages,minDelay,maxDelay)},realIntervalTime*1000+300)
			let stop=()=>{console.log("STOP");clearTimeout(delaySend)}
			return{stop}
		}
		const testBatchSendMessage=()=>batchSendMessage([
				"[emot:dy108][emot:dy108]",
				"[emot:dy121][emot:dy121]",
				"[emot:dy002][emot:dy002]",
				"[emot:dy101][emot:dy101]",
				"[emot:dy109][emot:dy109]",
				"[emot:dy115][emot:dy115]"
			][Symbol.iterator](),5,11)
		let stop
		const start=()=>stop=dummy.batchSendMessage(data,22,11).stop
		const resume=()=>stop=dummy.batchSendMessage(data,22,11,instantStart=false).stop
		/*
		在右下角显示一个图标 控制开始 暂停
		*/
		let addControlIcon=(()=>{
			document.body.insertAdjacentHTML("beforeEnd",
				`<div id="js-hulala-tool" style="
				position:fixed;right:.5em;bottom:.5em;
				font-size:66px;cursor:wait;z-index: 10000;">
				🚀</div>`)
			document.body.lastChild.onmouseenter=()=>start()
			document.body.lastChild.onmouseleave=()=>stop()
		})
		/*
		-[√]用户发弹幕时暂停
			-[√]当用户在消息框输入内容时 暂停
			-[√]当用户清空消息框的内容时 继续
			-[!]当用户通过按回车键 或者点发送按钮发送消息后 继续
			两种实现方案
				监听输入、发送事件 或者 反复检测输入框是否有内容
				第一个方案更细致 但做起来麻烦 先做第二个方案
		*/
		const pauseWhenUserTypingMessage=(source,interval)=>{
			/*@deprecated
			-监听输入、发送事件
				-[√]当用户在消息框输入时 暂停
				-[√]当用户清空消息框的文字时 继续
				-[?]当用户通过按回车键 或者点发送按钮发送消息后 继续
					这个方案会有问题 就是当监听到用户按回车 或者发送按钮后
					可能成功发送消息 也有可能失败
					要确认是否成功 就要延迟一段时间 等斗鱼程序尝试发送之后进行确认
					有些繁琐
			*/
			let input=room.chat.send.input
			let solutionThroughListeningEvents=()=>{
				input.addEventListener("input",()=>input.value==""?resume():stop())
				room.chat.send.sendButton.addEventListener("click",()=>console.log("click"))
			}
			/*
			每n秒钟检测一次输入框 如有有文字就暂停
				之后再清空了文字（可能是删除了 也可能是发送完消息）就重新模拟输入时间 开始自动发
				用async iterator、generator实现
				参考
					https://dev.to/nestedsoftware/the-iterators-are-coming-symboliterator-and-symbolasynciterator-in-javascript-hj
					https://dev.to/nestedsoftware/asynchronous-generators-and-pipelines-in-javascript--1h62
			*/
			let resolutionThroughWatchingInput=(source,interval)=>{
				let checkInputStateFrequently=(target,checkInterval=1000)=>{
					class Controller{
						constructor(input){
							this.input=input
						}
						next(){return new Promise(a=>setTimeout(()=>a({value:this.input.value!="",done:false}),checkInterval))}
						[Symbol.asyncIterator](){return{next:()=>this.next()}}
					}
					return new Controller(target)
				}
				let testCheckInputStateFrequently=async()=>{
					document.body.insertAdjacentHTML("beforeEnd","<input/>")
					const iter=checkInputStateFrequently(document.body.lastChild)
					for await(const value of iter)console.log(value)
				}
				let tickOnIdleDuration=(source,timer=()=>fakeNaturalTypingDelay(5*1000))=>{
					let idleStartedOn//无输入内容开始时间
					let isRecentlyInputing=()=>idleStartedOn==undefined
					let rememberInputing=()=>{idleStartedOn=undefined}
					let startIdle=()=>idleStartedOn=Date.now()+timer()
					let intervalTicked=()=>Date.now()>=idleStartedOn
					let f=async function*(inputStating){
						for await(var isInputing of inputStating) {
							if(isInputing)rememberInputing()
							else if(isRecentlyInputing())startIdle()
								else if(intervalTicked())(startIdle(),yield undefined)
						}
					}
					return f(source)
				}
				let testTickOnIdleDuration=async()=>{
					document.body.insertAdjacentHTML("beforeEnd","<input/>")
					const b=checkInputStateFrequently(document.body.lastChild)
					const c=tickOnIdleDuration(b)
					for await(const value of c)console.log(value)
				}
				//testCheckInputStateFrequently()
				//testTickOnIdleDuration()
				const b=checkInputStateFrequently(source,1000/3)
				return tickOnIdleDuration(b,()=>fakeNaturalTypingDelay(interval))
			}
			/*@deprecated
			-反复检测输入框是否有内容
				在自动弹幕时
					每次发送之前检测用户是否正在输入弹幕
						如果在输入 暂停
						开始检测用户是否发送完了弹幕 或者删除了正在输入的弹幕
							每秒监测一次输入框
							确认后 继续发送弹幕
			*/
			//let resolution3=(()=>{

			//})()
			return resolutionThroughWatchingInput(source,interval)
		}
		/*
			同一时间只能做一件事的优先级策略
			像在晴朗多云天气 从行驶的飞机 向下看
			透过四层云层 以垂直方向看地面

			四层云层任何一层如果有云 就会遮挡住地面
			上面三层任何一层如果有云 就会遮住最下面一层
			以此类推
		*/
		const prioritize=(interval)=>{
			//const watchingCloudStack=(...levels)=>{for(const state of levels)if(state)return state}
			//const testWatchingCloudStack=()=>console.assert(watchingCloudStack(false,undefined,"Bling!",false)=="Bling!")
			const isSpeakCooling=()=>room.chat.speak.getRoomMsgCd()>0
			const isUserOperating=room.user.isOperating
			const outOfControlConditions=()=>isSpeakCooling()||isUserOperating()
			const checkFrequently=(check,checkInterval=1000)=>{
				class Controller{
					constructor(check){
						this.check=check
					}
					next(){return new Promise(resolve=>setTimeout(()=>resolve({value:check(),done:false}),checkInterval))}
					[Symbol.asyncIterator](){return{next:()=>this.next()}}
				}
				return new Controller(check)
			}
			const testCheckFrequently=async()=>{
				const a=checkFrequently(outOfControlConditions)
				for await(const b of a)console.log(b)
			}
			const tickOnIdleDuration=(source,timer=()=>fakeNaturalTypingDelay(5*1000))=>{
				let idleStartedOn//无输入内容开始时间
				let isRecentlyInputing=()=>idleStartedOn==undefined
				let rememberInputing=()=>{idleStartedOn=undefined}
				let startIdle=()=>idleStartedOn=Date.now()+timer()
				let intervalTicked=()=>Date.now()>=idleStartedOn
				let f=async function*(inputStating){
					for await(var isInputing of inputStating) {
						if(isInputing)rememberInputing()
						else if(isRecentlyInputing())startIdle()
							else if(intervalTicked())(startIdle(),yield undefined)
					}
				}
				return f(source)
			}
			const testTickOnIdleDuration=async()=>{
				const a=checkFrequently(outOfControlConditions)
				const c=tickOnIdleDuration(a)
				for await(const value of c)console.log(value)
			}
			const a=checkFrequently(outOfControlConditions,1000/3)
			return tickOnIdleDuration(a,()=>fakeNaturalTypingDelay(interval))
		}
		const autoAnswering=async function*(){
			///一层adapter，接收消息，缓存，依优先权排序后放出
			const prioritize=async function*(a){
				const calc=a=>{
					const thanking=a=>a.score
					a instanceof room.chat.Welcome?0:a instanceof room.chat.Gift?thanking(a):console.error(a)}
				const f=async function*(){
					let data;
					///load data
					yield data.sort((a,b)=>a.priority-b.priority)}
				for await(const i of a)yield[i,calc(i)]}
			const answer=a=>{
				const friends={
					"Biu优秀饲养员kimi":"嫂子",
					"君岑876000":"阿姨",
					"Biu雷哥616":"雷哥",
					"倾城娱乐丶大龙":"大龙",
					"Biu雨声":"雨声",
					//"Biu守卫者龙猫队616":"官方猫·猫队", ///雨声说这不是猫队
					"Biu我不是臭榴莲":"榴莲",
					"BIU绿豆芽":"豆芽",
					"Biuye夜":"夜夜",
					"BIU李":"小李姐姐",
					"Biu泥狗带":"狗带",

					"哎呦小菲菲":"灰灰",
					"至十五":"十五",
					"两点一个竖":"竖心儿",
					"Tb王小兔手作":"表姐",
					"蚕蛹胖儿":"蚕胖儿",
					"猪小小儒雅随和":"小小猪",
					"翰墨音缘520":"音缘",
					"安如香喵Kissing":"香喵",
					"天地人脉 ":"天地",
					"早睡早起520":"呼噜噜",
				}
				const welcome=a=>(friend=friends[a.user])?`欢迎${friend}回到${room.name}！`:`欢迎「${a.user}」来到${room.name}！点点关注刷刷礼物爱你哟`
				const thanking=a=>(
					//gift=a.quantity>1?a.quantity+a.quantifier+a.gift:a.gift, //+"一"+a.quantifier,
					gift=(a.quantity>1?a.quantity+a.quantifier:"")+a.gift.name,
					(friend=friends[a.user])?`谢谢${friend}的${gift}！${friend}辛苦啦嚒嚒哒`:`谢谢「${a.user}」的${gift}！嚒嚒哒爱你哟`
				)
				return a instanceof room.chat.Welcome?welcome(a):a instanceof room.chat.Gift?thanking(a):console.error(a)
			}
			for await(const a of prioritize(room.chat.list))yield answer(a[0])
			//const z=(async()=>{for await(const a of room.chat.list)yield answer(a)})
			//return prioritize(z)
		}
		const ticks=prioritize(interval)
		;(async()=>{for await(const _ of ticks)send(messages.next().value)})()
		;(async()=>{for await(const a of autoAnswering())send(a)})()
		//;(async()=>{
		//	const f=(i,s)=>{
		//	const a=autoAnswering()
		//	for await(const i of a)send(i)
		//})()
		//const finalResult = [
		//	(async()=>{for await(const _ of ticks)send(messages.next().value)})(),
		//	(async()=>{for await(const a of autoAnswering())send(a)})()
		//]
		//await Promise.all([
		//	(async()=>{for await(const _ of ticks)send(messages.next().value)})(),
		//	(async()=>{for await(const a of autoAnswering())send(a)})()
		//])
		//for await(const a of autoAnswering())console.log(a)
	}
	const messages=(()=>{
		var range=(startAt=0,end)=>[...Array(end-startAt).keys()].map(i => i + startAt)
		let map=iter.map
		let interweave=function*(...sources){
			let sources2=sources.map(([a,b],_)=>[a,b])
			while(true){
				for(const[source,rate] of sources2){
					let a=source
					for(let i=0;i<rate;i++){
						let b=a.next()
						if(b.done)return
						else yield b.value
						}}}}
		let testInterweave=()=>{
			let a=interweave([[["M","F"][Symbol.iterator](),1],[["Jack","Bob","Rock","Lisa"][Symbol.iterator](),2],[["数学","物理","化学","语文","英语","历史"][Symbol.iterator](),3]])
			for(const b of a)console.trace(b)
		}
		let format=a=>"🚀×"+(++a)
		let numbers=function*() {
			let i=0
			while(true) {
				yield i++
			}
		}
		let repeat=function*(a){
			let i=0
			while(true)yield a[i++%a.length]
		}
		let numberToEmoji=a=>"[emot:dy"+a+"]"
		//Array.prototype.repeat=repeat
		let 数字=map(numbers(),format)[Symbol.iterator]()
		let 表情=repeat(range(101,137).concat(range(1,17)).map(String).map(a=>a.padStart(3,"0")).map(numberToEmoji))
		let repeatSlogan=a=>map(表情,b=>b+a)[Symbol.iterator]()
		let 雷哥口播2=repeat([
			"好的欢迎各位在北京时间的晚上的八点二十七分依然守候在雷狗蛋的斗鱼直播间！",
			"人生路漫漫 欢乐永相伴 每天与大家不见不散！",
			"记得按时吃饭 记得开心常伴 好男人就是我 我就是雷小锅！",
		])
		let 雷哥=repeat([
			"欢迎来到猎户星座M78星云MLGB星球的雷哥直播间",
			"今晚完结 麦克菲尔德消失的JJ 和 隐形守护者",
			"消失的JJ已完结",
		])
		let 口播=[
			"新来的同学们点点关注·我是刚来斗鱼的新主播以后常驻·刚来斗鱼直播三天·感谢大家的礼物！",
			"我是单机主机主播·帮忙点点关注·我会继续努力直播·不会停下脚步！",
			"总有粉丝说我眼瞎智商低磨叽没脸皮·其实他们不懂我是胖帅牛皮强无敌！",
			"从来斗鱼时每天直播十来个小时·下午五点到午时·希望大家多支持！",
			"没办卡的同学办个卡·加入粉丝团里棒棒的·粉丝徽章六级可以变色·背包里的荧光棒不要吝啬！",
			"刷礼物让你更嘚瑟·粉丝徽章十五级变橙色·可以进到房管群里乐一乐！",
			"点点关注不会迷路·感谢各位新来同学的关注·谢谢大家·MUUA·MUUA·MUUA·MUUA·MUUA！",
		]
		let 从军记=[
			"官方猫带雷狗蛋远征武装突袭三！路过同学点点关注不要错过！",
			"武装突袭三是以真实、完整模拟军事行动为目的的大型多人在线角色扮演游戏",
			"喜欢的朋友可以今天结束后，优酷搜索“雷狗蛋从军记”观看大量好看的往期录像！"
		]
		return{
			表情:[表情,33*1000],
			组合:[interweave([雷哥,3],[表情,11]),3*1000],
			组合2:[interweave([表情,9],[数字,1]),3*1000],
			雷哥:{
				口播:[interweave([repeat(口播),口播.length],[表情,5]),22*1000],
				舔狗:[repeat([
					"劳驾兄弟我找综合游戏技术大师Biu雷哥！",
					"是综合游戏技术大师Biu雷哥直播间吗？",
					"听说这是综合游戏技术大师Biu雷哥的直播间！",
					"综合游戏技术大师，真是太技术！太大师了！"
				]),11*1000],
				雷食记:[repeat([
					"欢迎来到猎户座M78星球MLGB星球的雷哥直播间",
					"欢迎大家收看全斗鱼唯一真人美食真人生存类节目！",
					"阅尽人生百态 我的嫂子冰雪聪明 美丽大方 倾国倾城 温柔如水",
					"不知道今天嫂子会给雷哥带来什么样的挑战？",
					"欢迎来到贝尔·格里尔斯·雷的雷食记直播间",
					//"吃遍天下美食 嫂子做的最好！",
					//"川鲁闽浙粤淮扬 不如嫂子小厨房！",
					//"我的天看着就好吃！",
					//"真担心这辈子都吃不到这么好吃的食物！",
					//"真是太黯然！太销魂了！"
				].concat(口播)),11*1000],
				嫂子:[repeatSlogan(["我的嫂子美丽大方！倾国倾城！温柔如水！"]),22*1000],
				户外:[repeatSlogan(["大家好！今天不播游戏了，雷大爷生病住院，雷哥正在赶去医院的路上。同学们点点关注刷刷礼物，感谢大家的支持！"]),33*1000],
				抽奖:[repeat(["#关注 感谢小李姐姐"]),500],
				狗蛋从军记:[interweave([repeat(从军记),从军记.length],[表情,5],[repeat(口播),口播.length],[表情,5]),11*1000],
			},
			公益:[repeatSlogan("鱼你同行，造梦公益！"),11*1000],
		}
	})()
	enhanceControl()
	batchSendMessage.apply(null,messages.雷哥.户外)
	const test=()=>{
		room.chat.send.test()
		messages.test()
	}
	return{test}
}
dummy()
