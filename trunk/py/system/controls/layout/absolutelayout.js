//===========================================
// 绝对布局       flowlayout.js         A
//===========================================

Py.using("System.Controls.Layout.LayoutEngine");
Py.imports("Resources.~.Layout.Absolute");



/**
 * 实现动态大小的布局。
 */
Py.Layout.register(Py.Layout.AbsoluteLayout = Py.Layout.LayoutEngine.extend({
	
	/**
	 * xType
	 * @type String
	 * @property xType
	 */
	xType: 'absolute',
	
	name: 'absolute',
	
	initLayoutCore: function(container){
		Py.Element.setMovable(container.content);
	}
	
}));



