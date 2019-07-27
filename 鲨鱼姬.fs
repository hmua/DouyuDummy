namespace global
module private 学习FABLE=
    module 怎样用OBSERVABLE=
        module``翻译的C#代码``=
            ///参照https://docs.microsoft.com/en-us/dotnet/api/system.iobservable-1
            ///可以执行没问题
            open System
            open System.Collections.Generic
            type Location={Latitude:double;Longitude:double}
            type Unsubscriber(observers,observer)=
                let mutable _observers=observers:List<IObserver<Location>>
                let mutable _observer=observer:IObserver<Location>
                member t.Unsubscriber(observers,observer)=
                    _observers <- observers
                    _observer <- observer
                interface IDisposable with member t.Dispose()=
                                            if(not<|isNull _observer)&& _observers.Contains(_observer)then
                                                ignore<|_observers.Remove(_observer);
            type LocationUnknownException()=inherit Exception()
            type LocationTracker()=
              let observers = new List<IObserver<Location>>()
              interface IObservable<Location>with
                  member t.Subscribe(observer:IObserver<Location> ):IDisposable=
                    if (not<|observers.Contains(observer)) then observers.Add(observer);
                    upcast new Unsubscriber(observers, observer)
              member t.TrackLocation(loc:Option<Location>)=
                for observer in observers do
                    if Option.isNone loc then observer.OnError(LocationUnknownException());
                    else observer.OnNext(loc.Value)
              member t.EndTransmission()=
                for observer in observers.ToArray()do
                    if (observers.Contains(observer))then observer.OnCompleted()
                observers.Clear()
            type LocationReporter(name)=
               let instName=name
               let mutable unsubscriber=Unchecked.defaultof<IDisposable>
               member t.Name with get()=instName:string
               member t.Subscribe(provider:IObservable<Location>)=
                    if (provider <> null) then unsubscriber <- provider.Subscribe(t)
               member t.Unsubscribe()=unsubscriber.Dispose()
               interface IObserver<Location> with
                   member t.OnCompleted()=
                      Console.WriteLine("The Location Tracker has completed transmitting data to {0}.", t.Name);
                      t.Unsubscribe();
                   member t.OnError(e:Exception)=
                      Console.WriteLine("{0}: The location cannot be determined.", t.Name);
                   member t.OnNext(value:Location)=
                      Console.WriteLine("{2}: The current location is {0}, {1}", value.Latitude, value.Longitude, t.Name)
            // Define a provider and two observers.
            let provider =LocationTracker()
            let reporter1 =LocationReporter("FixedGPS");
            reporter1.Subscribe(provider);
            let reporter2 =LocationReporter("MobileGPS");
            reporter2.Subscribe(downcast provider);
        
            let lo la lo=Some<|{Latitude=la;Longitude=lo}
            provider.TrackLocation(lo 47.6456 -122.1312)
            reporter1.Unsubscribe();
            provider.TrackLocation(lo 47.6677 -122.1199)
            provider.TrackLocation(None);
            provider.EndTransmission()
        ///采编自https://msdn.microsoft.com/en-us/visualfsharpdocs/conceptual/control.observable-module-%5Bfsharp%5D
        module private``同样功能的F#用例``=
            open System
            open System.Diagnostics
            // Represents a stream of IObserver events.
            type ObservableSource<'T>() =

                let protect function1 =
                    let mutable ok = false
                    try 
                        function1()
                        ok <- true
                    finally
                        Debug.Assert(ok, "IObserver method threw an exception.")

                let mutable key = 0

                // Use a Map, not a Dictionary, because callers might unsubscribe in the OnNext
                // method, so thread-safe snapshots of subscribers to iterate over are needed.
                let mutable subscriptions = Map.empty : Map<int, IObserver<'T>>

                let next(obs) = 
                    subscriptions |> Seq.iter (fun (KeyValue(_, value)) -> 
                        protect (fun () -> value.OnNext(obs)))

                let completed() = 
                    subscriptions |> Seq.iter (fun (KeyValue(_, value)) -> 
                        protect (fun () -> value.OnCompleted()))

                let error(err) = 
                    subscriptions |> Seq.iter (fun (KeyValue(_, value)) -> 
                        protect (fun () -> value.OnError(err)))

                let thisLock = new obj()

                let obs = 
                    { new IObservable<'T> with
                        member this.Subscribe(obs) =
                            let key1 =
                                lock thisLock (fun () ->
                                    let key1 = key
                                    key <- key + 1
                                    subscriptions <- subscriptions.Add(key1, obs)
                                    key1)
                            { new IDisposable with 
                                member this.Dispose() = 
                                    lock thisLock (fun () -> 
                                        subscriptions <- subscriptions.Remove(key1)) } }

                let mutable finished = false

                // The source ought to call these methods in serialized fashion (from
                // any thread, but serialized and non-reentrant).
                member this.Next(obs) =
                    Debug.Assert(not finished, "IObserver is already finished")
                    next obs

                member this.Completed() =
                    Debug.Assert(not finished, "IObserver is already finished")
                    finished <- true
                    completed()

                member this.Error(err) =
                    Debug.Assert(not finished, "IObserver is already finished")
                    finished <- true
                    error err

                // The IObservable object returned is thread-safe; you can subscribe 
                // and unsubscribe (Dispose) concurrently.
                member this.AsObservable = obs

            // Create a source.
            let source = new ObservableSource<int>()

            // Get an IObservable from the source.
            let obs = source.AsObservable 

            // Add a simple subscriber.
            let unsubA = obs |> Observable.subscribe (fun x -> printfn "A: %d" x)

            // Send some messages from the source.
            // Output: A: 1
            source.Next(1)
            // Output: A: 2
            source.Next(2)

            // Add another subscriber. This subscriber has a filter.
            let unsubB =
                obs
                |> Observable.filter (fun num -> num % 2 = 0)
                |> Observable.subscribe (fun num -> printfn "B: %d" num)

            // Send more messages from the source.
            // Output: A: 3
            source.Next(3)
            // Output: A: 4
            //         B: 4
            source.Next(4)

            // Have subscriber A unsubscribe.
            unsubA.Dispose()
    
            // Send more messages from the source.
            // No output
            source.Next(5)
            // Output: B: 6
            source.Next(6)

            // If you use add, there is no way to unsubscribe from the event.
            obs |> Observable.add(fun x -> printfn "C: %d" x)

            // Now add a subscriber that only does positive numbers and transforms
            // the numbers into another type, here a string.
            let unsubD =
                obs |> Observable.choose (fun int1 ->
                         if int1 >= 0 then None else Some(int1.ToString()))
                    |> Observable.subscribe(fun string1 -> printfn "D: %s" string1)

            let unsubE =
                obs |> Observable.filter (fun int1 -> int1 >= 0)
                    |> Observable.subscribe(fun int1 -> printfn "E: %d" int1)

            let unsubF =
                obs |> Observable.map (fun int1 -> int1.ToString())
                    |> Observable.subscribe (fun string1 -> printfn "F: %s" string1)
        module private``使用事件``=
            ///以下采编自https://fsharpforfunandprofit.com/posts/concurrency-reactive/
            open System
            open System.Threading
            open Fable.Core
            open Browser
            let test()=
                /// create a timer and register an event handler,
                /// then run the timer for five seconds
                let createTimer timerInterval eventHandler =
                    // setup a timer
                    let timer = new System.Timers.Timer(float timerInterval)
                    timer.AutoReset <- true    
                    // add an event handler
                    timer.Elapsed.Add eventHandler
                    // return an async task
                    async {
                        // start timer...
                        timer.Start()
                        // ...run for five seconds...
                        do! Async.Sleep 5000
                        // ... and stop
                        timer.Stop()
                        }
                let basicHandler _ = console.log DateTime.Now
                // register the handler
                let basicTimer1 = createTimer 1000 basicHandler
                // run the task now
                ///Async.RunSynchronously Fable是不支持的，可以用Async.Start、StartImmediate
                ///会有点奇怪，直观来说Async.RunSynchronously不是等于js的await吗？
                ///也许从F#的异步体系来说，Async.RunSynchronously对JS是没有意义的
                Async.StartImmediate basicTimer1
            test()
        module private``使用Observable``=
            open System
            open Fable.Core
            let test()=
                let createTimerAndObservable timerInterval =
                    // setup a timer
                    let timer = new System.Timers.Timer(float timerInterval)
                    timer.AutoReset <- true
                    // events are automatically IObservable
                    // let observable = timer.Elapsed
                    // return an async task
                    let task = async {
                        timer.Start()
                        do! Async.Sleep 5000
                        timer.Stop()
                        }
                    // return a async task and the observable
                    (task, timer.Elapsed)
                // create the timer and the corresponding observable
                let basicTimer2 , timerEventStream = createTimerAndObservable 1000
                // register that everytime something happens on the
                // event stream, print the time.
                timerEventStream |> Observable.subscribe (fun _ -> printfn "tick %A" DateTime.Now)|>ignore
                // run the task now
                Async.StartImmediate basicTimer2
            test()
open System.Diagnostics.CodeAnalysis
[<SuppressMessage("FSharpLint.NameConventions", "TypeNames") >]
module private 鲨鱼姬=
    open Fable.Core
    [<Emit("console.assert($0)")>]
    let jsAssert a=jsNative
    [<Emit("console.assert($0,$1)")>]
    let jsAssertWithFeedback a b=jsNative
    open Fable.Core.JsInterop
    module room=
      module wrapper=
        open Browser.Dom
        open Browser.Types
        let id=int32<|window.location.pathname.[1..]
        jsAssert(id=6119609)
        let get a=document.getElementsByClassName(a).[0]
        module chat=
          type 欢迎(user)=
            member a.User=user
          type 感谢礼物(user,gift)=
            let q,g=gift
            member a.user=user
            member a.gift=g
            member a.quantity=q
            // member this.quantifier=gift.quantifier
            // member this.score=gift.score*quantity
          module list=
            let list=get("Barrage-list")
            let(|Welcome|_|)(a:Element)=
              if(a.classList.contains("Barrage-userEnter"))then
                let b=a?lastElementChild:HTMLSpanElement
                jsAssertWithFeedback(b.tagName="SPAN")b
                jsAssertWithFeedback(b.className="Barrage-text")b
                jsAssertWithFeedback(b.innerText="欢迎来到本直播间")b
                Some<|欢迎(b?previousElementSibling?title:string)
              else None
            let(|Gift|_|)(a:Element)=
              if(a.classList.contains("Barrage-message"))then
                let b=a?lastElementChild:HTMLSpanElement
                jsAssertWithFeedback(b.tagName="SPAN")b
                jsAssertWithFeedback(b.className="Barrage-text")b
                jsAssertWithFeedback(b.innerText.Trim().StartsWith("赠送给主播"))b
                jsAssertWithFeedback(b?firstElementChild?tagName="IMG")b
                //let parseGift image=douyu.getGiftfromUrl(image.src) TODO
                let parseGift image=null
                let quantity a=if a?lastElementChild?tagName="SPAN"then int32(a?lastElementChild?innerText?substring(1))else 1
                let make a=quantity(a),parseGift(a?firstElementChild)
                Some<|感谢礼物(b?previousElementSibling?title,make b)
              else None
            let sort(a:Element)=
              assert(a.tagName="LI"&&a.classList.contains("Barrage-listItem"))
              let sort(a:Element)=
                let isSystemMessage=a.tagName="A"&&a.className="Barrage-notice Barrage-notice--red"
                if(not isSystemMessage)then
                  jsAssertWithFeedback(a.tagName="DIV")a
                  match a with Welcome a->a:>obj|Gift a->a:>obj|_->failwith""
                else failwith""
              sort(a?lastElementChild)
            /////learned from https://stackoverflow.com/a/35718902/2537458, thanks to @Volune
            //let eventIterator(target,eventName)=
            //  class Controller{
            //    next(){return new Promise(resolve=>target.addEventListener(eventName,function f(e) {
            //      target.removeEventListener(eventName, f)
            //      resolve({value:e.target,done:false})
            //    }))}
            //    [Symbol.asyncIterator](){return{next:()=>this.next()}}
            //  }
            //  return new Controller()
            //}
            //let testEventIterator=passed=true||(async()=>{
            //  document.body.insertAdjacentHTML("beforeEnd","<input/>")
            //  const t=document.body.lastChild;
            //  for await(const a of eventIterator(t,"input"))console.log(a)
            //})()
            //let onMessageReceived()=
            //  let a=eventIterator(list,"DOMNodeInserted")
            //  return asyncIterator.map(a,sort).filterOutUnfedineds()
            //}
            //let testOnMessageReceived=passed=true||(async()=>{
            //  for await(const a of onMessageReceived())console.log(a)
            //})()
            //onMessageReceived()
          //注意此方法不会自动检查是否能发言 要明确检查冷却时间等
          module speak=
            let input=get("ChatSend-txt"):?>HTMLInputElement
            let sendButton=get("ChatSend-button")
            let send a=
              input?value<-a
              sendButton?click()
            let getRoomMsgCd()=
              let _,a=System.Int32.TryParse(sendButton?innerText:string)
              a
            let canSend()=sendButton.classList.contains("is-gray")
            let testSend()=
              send("[emot:dy108][emot:dy108]")
              console.log(getRoomMsgCd())
              System.Diagnostics.Debugger.Break()
            if false then testSend()
        module player=
          let getPauseButton()=get("pause-c594e8")
          let pause()=getPauseButton()?click()
          //let pausePlayerWhenLoaded=(()=>{
          //    while(!getPauseButton())await new Promise(r => setTimeout(r,500))
          //    getPauseButton().click()
          //})()
        let danmuCloseButton=get("showdanmu-42b0ac") //关闭弹幕按钮
        let hideDanmu()=danmuCloseButton?click()
        let pageFullscreenButton=get("wfs-2a8e83") //关闭弹幕按钮
        let pageFullscreen()=pageFullscreenButton?click()
        let getBackpackPopup()=get("Backpack JS_Backpack") //背包弹窗
        let isShowingBackpack()=getBackpackPopup()<>Unchecked.defaultof<Element>
        let getBubbleBox()=get("bubble-box-418e1e") //颜值主播右下角的点赞泡泡动画
        module user=
          let isEditingMessage()=chat.speak.input.value<>""
          let isOpeningBackpack()=isShowingBackpack()
          let isOperating()=isEditingMessage()||isOpeningBackpack()