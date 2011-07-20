//===========================================
//  效果   base.js      C
//===========================================


(function(p){
	
	
	/// #region interval
	
	var cache = {}, emptyFn = Function.empty;
	
	/**
	 * 定时执行的函数。
	 */
	function interval(){
		var i = this.length;
		while(--i >= 0)
			this[i].step();
	};
	
	/// #endregion
		
	/**
	 * @namespace Fx
	 */
	p.namespace(".Fx.", {
		
		/**
		 * 实现特效。
		 * @class Fx.Base
	 	 * @abstract
		 */
		Base: p.Class({
		
			/**
			 * 每秒的运行帧次。
			 * @type {Number}
			 */
			fps: 50,
			
			/**
			 * 总运行时间。 (单位:  毫秒)
			 * @type {Number}
			 */
			duration: 500,
			
			/**
			 * 在特效运行时，第二个特效的执行方式。 可以为 'ignore' 'cancel' 'wait' 'restart' 'replace'
			 * @type {String}
			 */
			link: 'ignore',
			
			/**
			 * xType
			 * @type {String}
			 */
			xType: 'fx',
			
			/**
			 * 在效果开始时执行
			 * @protected
			 */
			onStart: emptyFn,
			
			/**
			 * 在效果完成后执行
			 * @protected
			 */
			onComplete: emptyFn,
			
			/**
			 * 在效果停止后执行
			 * @protected
			 */
			onStop: emptyFn,
			
			/**
			 * 初始化当前特效。
			 * @param {Object} options 选项。
			 */
			constructor: function(options) {
				if(options)
					Object.extend(this, options);
					
				this._competeListeners = [];
			},
			
			/**
			 * 实现变化。
			 * @param {Object} p 值。
			 * @return {Object} p 变化值。
			 */
			transition: function(p) {
				return -(Math.cos(Math.PI * p) - 1) / 2;
			},
			
			/**
			 * 当被子类重写时，实现生成当前变化所进行的初始状态。
			 * @param {Object} from 开始位置。
			 * @param {Object} to 结束位置。
			 * @return {Base} this
			 */
			compile: function(from, to) {
				var me = this;
				me.from = from;
				me.to = to;
				return me;
			},
			
			/**
			 * 进入变换的下步。
			 */
			step: function() {
				var me = this, time = Date.now() - me.time;
				if (time < me.duration) {
					me.set(me.transition(time / me.duration));
				}  else {
					me.set(1);
					me.complete();
				}
			},
			
			/**
			 * 根据指定变化量设置值。
			 * @param {Number} delta 变化量。 0 - 1 。
			 * @abstract
			 */
			set: Function.empty,
			
			/**
			 * 增加完成后的回调工具。
			 * @param {Function} fn 回调函数。
			 */
			addOnComplete: function(fn){
				assert.isFunction(fn, "Fx.Base.prototype.addOnComplete(fn): 参数 {fn} ~。");
				this._competeListeners.unshift(fn);	
				return this;
			},
			
			/**
			 * 检查当前的运行状态。
			 * @param {Object} from 开始位置。
			 * @param {Object} to 结束位置。
			 * @param {Function} callback 回调。
			 * @param {String} link='ignore' 链接方式。 wait, 等待当前队列完成。 restart 柔和转换为目前渐变。 cancel 强制关掉已有渐变。 ignore 忽视当前的效果。
			 * @return {Boolean} 是否可发。
			 */
			check: function(from, to, duration, callback, link) {
				var me = this;
				
				//如正在运行。
				if(me.timer){
					switch (link || me.link) {
						
						// 链式。
						case 'wait':
							this._competeListeners.push(function() {
								
								this.start(from, to, duration, callback, true);
								return false;
							});
							
							//  如当前fx完成， 会执行 _competeListeners 。
							
							//  [新任务开始2, 新任务开始1]
							
							//  [新任务开始2, 回调函数] 
							
							//  [新任务开始2]
							
							//  []
							
							return false;
							
						case 'restart':
							me.pause();
							while(me._competeListeners.pop());
							break;
							
						// 停掉目前项。
						case 'cancel':
							me.stop();
							break;
							
						case 'replace':
							me.pause();
							break;
							
						// 忽视新项。
						default:
							assert(!link || link == 'ignore', "Fx.Base.prototype.start(from, to, duration, callback, link): 参数 {link} 必须是 wait、restart、cancel、replace、ignore 之一。", link);
							return false;
					}
				}
				
				// 如果 duration > 0  更新。
				if (duration > 0) this.duration = duration;
				else if(duration < -1) this.duration *= -duration;
				
				// 如果有回调， 加入回调。
				if (callback) {
					assert.isFunction(callback, "Fx.Base.prototype.start(from, to, duration, callback, link): 参数 {callback} ~。");
					this._competeListeners.unshift(callback);
				}
				
				return true;
			},
			
			/**
			 * 开始运行特效。
			 * @param {Object} from 开始位置。
			 * @param {Object} to 结束位置。
			 * @return {Base} this
			 */
			start: function() {
				var me = this, args = arguments;
				if (me.check.apply(me, args)) {
				
					// 设置时间
					me.time = 0;
					
					me.compile(args[0], args[1]).set(0);
					me.resume().onStart(args[4]);
				}
				return me;
			},
			
			/**
			 * 完成当前效果。
			 */
			complete: function() {
				var me = this;
				me.pause();
				var handlers = me._competeListeners;
				while(handlers.length)  {
					if(handlers.pop().call(me) === false)
						return me;
				}
				
				me.onComplete();
				return me;
			},
			
			/**
			 * 中断当前效果。
			 */
			stop: function() {
				var me = this;
				me.set(1);
				me.pause().onStop();
				return me;
			},
			
			/**
			 * 暂停当前效果。
			 */
			pause: function() {
				var me = this;
				if (me.timer) {
					me.time = Date.now() - me.time;
					var fps = me.fps, value = cache[fps];
					value.remove(me);
					if (value.length === 0) {
						clearInterval(me.timer);
						delete cache[fps];
					}
					me.timer = undefined;
				}
				return me;
			},
			
			/**
			 * 恢复当前效果。
			 */
			resume: function() {
				var me = this;
				if (!me.timer) {
					me.time = Date.now() - me.time;
					var fps = me.fps, value = cache[fps];
					if(value){
						value.push(me);
						me.timer = value[0].timer;
					}else{
						me.timer = setInterval(Function.bind(interval, cache[fps] = [me]), Math.round(1000 / fps ));
					}
				}
				return me;
			}
			
		}),
		
		/**
		 * 常用计算。
		 * @param {Object} from 开始。
		 * @param {Object} to 结束。
		 * @param {Object} delta 变化。
		 */
		compute: function(from, to, delta){
			return (to - from) * delta + from;
		}
	
	});
	

})(Py);