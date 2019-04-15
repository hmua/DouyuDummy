# 鲨鱼控场机器人
*DouyuDummy*

鲨鱼姬不是刷热度机器人
鲨鱼姬的基本功能是自动应答弹幕
- 例如“现在播的是什么游戏”、“几点开始”之类的
游戏区有的年轻主播不怎么答复弹幕，有些老主播也做不到逐一回复弹幕
鲨鱼姬可以自动感谢礼物、感谢升级牌子等等
还能每隔一段时间发布一次直播安排

还可以把这些内容显示到主播的屏幕上而不自动发布，起到提词作用
未来会加入“人设”功能，让机器人不是冷冰冰的
这就要提到，这个机器人的系统本身还是比较强大的
……或者干脆说是非常强大的，至少目前看到的其他机器人都远不如这个
懂写脚本的朋友们可以多多开发、多多利用，多多讨论

- [x] 自动持续发弹幕
- [x] 可以开始 暂停 继续
- [x] 用户发弹幕时暂停
	- [x] 当用户在消息框输入内容时 暂停
	- [x] 当用户清空消息框的内容时 继续
	- [x] 当用户发送消息后 继续
- [x] 假装手打弹幕 模拟手打时间
	- [x] 如果用户发送了弹幕 机器人自动发送下一条之前会重新计算模拟打字时间
	- [ ] 根据弹幕字数模拟打字延迟
- [x] 穿插
*把少量有意义弹幕掺杂在大量纯表情、数字弹幕中间发送
避免出现带节奏、影响粉友的情况*
- [x] 不打断送礼 送礼时暂停
- [ ] 避免打扰其他用户
	- [ ] 直播间其他用户发送弹幕比较少时 降低自动弹幕的频率 避免霸屏
	- [ ] 自动应答
	- [ ] 自动欢迎
- [ ] 显示发送状态
	- [ ] 暂停
	- [ ] 已发送数
- [ ] 雷哥提的
	- [ ] 开十个账号 互相聊天 互相问话 聊一聊还能骂起来
- [ ] 优化直播间界面
	- [x] 节省刷弹幕时不必要的系统资源占用
		- [x] 关闭弹幕动画区、关闭非本直播间礼物广播动画；关闭直播视频
	- [x] 优化聊天消息列表 方便查看
	- [x] 聊天消息区仍然消耗太大CPU 要解决！
	*通过`--disable-direct-composition`似乎有不错的效果*

## 策略
1. 在闲时自动发送滚动弹幕
	- 当直播间粉友刷弹幕比较快时（大致每两秒一条），确保滚动弹幕最快间隔至少五条以上他人弹幕，否则太打扰他人
	- 但直播间弹幕流量较低时，可以加大滚动弹幕密度
3. 固定时间插入特定弹幕 例如每半小时做一次直播间介绍
4. 自动回复（欢迎进入直播间、感谢礼物等）有更高优先级 插入滚动弹幕中
5. 当用户操作时（用户发弹幕、发小礼物） 优先级最高
6. 弹幕冷却时间属于特殊情况
	- 冷却时间无法发送弹幕
	- 但冷却期间可以计做模拟输入弹幕时间
	*也就是说，同样导致弹幕机暂停
	用户操作导致的暂停结束后，会重计模拟输入弹幕时间
	弹幕冷却导致的暂停结束后，不用重计*
	
### 思路一、取任务、状态
按优先级从高到低 逐级
- 先检测是否在优先级最高的用户操作状态
- 再检测是否需要自动答复
- 最后发滚动弹幕

对用户操作状态非常容易处理
但对自动答复状态、自动答复时机可能有点难处理
- 需要自动答复时需要暂存 可能会累计多条
	需要更改变量 有违只读原则
	
### 要点
1. 用户操作 当操作完成后 要等待重新计时 模拟输入弹幕的时间后发送自动弹幕
	- 等待期间 如果用户再次操作 则打断及时 下次重新计时
	- 用户操作可以随时打断自动弹幕
2. 应该看看能否把用户操作和自动弹幕整合到一个时间线
3. 发送弹幕的时间点
	- 每过一秒检测一次是否可以发送
	- 当用户操作之后 可以重数一个弹幕发送时间间隔
	- 也可以不重数 把现在没数完的数完 再继续数一个间隔  只是会多等待几秒
### 思路一实现
*可以直接在原基础上继续开发*
- 筛掉用户操作时间
- 取得弹幕列表
- 识别可以自动回复的弹幕
- 创建自动回复并汇流到自动弹幕
- 
### 思路二
#### FREE信号
- 预计最早FREE的时间
#### 由第一优先级得给一个FREE信号
- 开关优先级最高
- 开关是用户操作
- 用户点“开”给出立即FREE信号
- 信号到第二层
#### 第二优先级冷却倒数
- 如果正在倒数，给出倒数结束时间
	- 收到该FREE信号后，等到该结束时间再进行下次检测冷却时间
	- 等待期间如果再上优先级中用户关闭，则中断，等待上优先级的FREE信号
- 如果不在倒数，给出立即FREE
- **不管本级内怎样判断，跨级策略只要一个FREE信号**

*以上都是机器人不可控，以下为机器人控制*
#### 第三优先级，应该取得、合并直播间弹幕信息流
（怎样合并？）
**高优先级信号能不能随时中断低优先级？**

### 思路三
各优先级都知道自己的忙、闲时
1. 开关级——开、关按钮点击事件
2. 弹幕冷却——开始和结束时间
3. 用户操作——开始和结束时间
4. 自动应答程序应该从消息输入列表知道有多少条需要应答，需要多长时间
5. 最后剩下的闲时发送滚动弹幕

只要逐级检测是否在闲时即可
上一级闲时，把操作机会给下一级
下一级闲时再给下下级
- 任何一级都不应该关心其它级如何工作

优先级策略的模型就像
在晴朗多云天气 从行驶的飞机 向下看
透过四层云层 以垂直方向看地面

四层云层任何一层如果有云 就会遮挡住地面
上面三层任何一层如果有云 就会遮住最下面一层
以此类推

#### 应该推和拉模型都可以做 先看拉模型
拉模型就是只在需要查看时查看
每次观察时 都从上向下看到最上一层有云的
从最高优先级向最低优先级 停在需要工作的一级

在事物模型上
每一次事物就像进行一次拍照
只拍到最上面一层有云的云层

## 其它
### 系统功能
1. 检查斗鱼代码更新
1. 运行前确认页面加载完毕
### 技术
基于异步生成器（ES2018，比RxJS更底层更新的概念）
- Promise、async/await

尽可能使用const，不用可修改的值
关键代码写了单元测试
- [ ] 试一下用Fable

另一个**非常酷**的修改直播间网页端的主意——
1. 直接修改脚本，可以替换函数
	- 这很容易“被失效”——只要网站脚本使用const
- 或者改脚本文本
	- 参考 https://stackoverflow.com/a/37149061/2537458
### 其它
- [ ] 测一下弹幕对热度的影响
	- 可能要找一个不太热的分类
	- 开播半小时看一下热度
	- 用斗鱼客户端的房管工具 设置22秒自动刷弹幕看下热度
	- 用本机器人 设置更短间隔刷弹幕看下热度
#### 斗鱼网页版直播间弹幕功能记录
1. 2019年3月4日开始解除了重复弹幕的限制
1. 一个账号可以在多个直播间发弹幕，不需要反复连接或者刷新