<template>
	<div class="combobox">
		<div class="combobox-title">{{ title }}</div>
		<div class="combobox-selector" :style="{ background: focused || comboOpened ? 'white' : '' }" @click="onClick">
			<input type="text" v-model="inputText" @mousedown="onMousedown" @mouseup="onMouseup" @blur="onBlur" @focus="onFocus" @input="onInput">
			<div class="combobox-selector-img"></div>
		</div>
	</div>
</template>

<script>

export default {
	name: 'Combobox',
	components: {		
	},
	data: () => { return {
		focused: false,
		comboOpened: false,
		doNotShowCombo: false,
		inputText: '-'
	}},
	props: {
		// paramName: String,
		title: String,
		text: String,
		list: Array
	},
	computed: {
	},
	methods: {
		onClick: function (event) {
			if (this.doNotShowCombo) {
				this.doNotShowCombo = false
				return
			}
			var ScreenWidth = document.documentElement.clientWidth			// 使用 window.innerWidth 也行
			var ScreenHeight = document.documentElement.clientHeight
			var popLeft, popTop
			var finalLeft, finalTop, finalHeight

			if (event.target.className == 'combobox-selector-img') {
				popLeft = getWindowOffsetLeft(event.target) - 39 - 100
			} else {
				popLeft = getWindowOffsetLeft(event.target) - 39 - 6
			}
			finalLeft = popLeft + "px"
			var currentHeight = 40 * this.list.length			// 暂时写死 40px 一格
			if (currentHeight > ScreenHeight - 28) {						// 列表总高度比窗口高度还大（标题栏高度 28px）
				finalTop = "28px";
				finalHeight = ScreenHeight - 28 + "px";
				popTop = "calc(50% - 100px)";
			} else if (currentHeight > getWindowOffsetTop(event.target) - 28) {	// 列表总高度减去标题栏比 combobox 顶高度还大
				finalTop = "28px";
				finalHeight = currentHeight + "px";
				popTop = (currentHeight - 200) / 2 + "px";
			} else {														// 都不超，只按底部位置计算
				finalTop = getWindowOffsetTop(event.target) - 24 - currentHeight + "px";
				finalHeight = currentHeight + "px";
				popTop = (getWindowOffsetTop(event.target) - 24 - currentHeight / 2 - 100) + "px";
			}

			// 计算说明左右位置
			if (popLeft + 210 + 312 > ScreenWidth) {
				popLeft = popLeft - 312 - 24 + "px";
			} else {
				popLeft = popLeft + 200 + 12 + "px";
			}

			// this.comboOpened = true
			this.$store.commit('showCombomenu', {
				list: this.list,
				default: this.text,
				position: { top: finalTop, height: finalHeight, left: finalLeft },
				handler: (sName) => {
					this.$emit('change', sName)
					this.comboOpened = false
				}
			})
		},
		onMousedown: function (event) {
		},
		onMouseup: function (event) {
			if (event.target.selectionEnd == event.target.selectionStart) {
				// 没有选中字符，打开列表
				event.target.blur()
			} else {
				// 选中字符，不打开列表
				this.doNotShowCombo = true
			}
		},
		onBlur: function (event) {
			this.focused = false
		},
		onFocus: function (event) {
			event.target.selectionEnd = event.target.selectionStart
			this.focused = true
		},
		onInput: function (event) {
			this.$emit('change', event.target.value)
		}
	},
	watch: {
		text: function (newValue, oldValue) {		// props 的 text 只有单向数据流，因此新增 data 的 inputText 做双向绑定和事件监听
			this.inputText = newValue
		}
	},
	mounted: function () {
		// 检查 list 中是否存在 text 对应的项，如果没有就说明给出的默认值跟列表不匹配，就要告诉父组件
		/*
		var index = this.list.findIndex((value) => {
			return value.sName == this.text
		})
		if (index == -1) {
			console.log('列表数据不匹配，重置为默认值')
			
		}
		*/
		this.inputText = this.text
	}
}

// 计算元素相对于窗口的 left 和 top
function getWindowOffsetLeft(obj) {
	var realNum = obj.offsetLeft;
	var positionParent = obj.offsetParent;  // 获取上一级定位元素对象
	
	while(positionParent != null) {
		realNum += positionParent.offsetLeft;
		positionParent = positionParent.offsetParent;
	}
	return realNum;
}
function getWindowOffsetTop(obj) {
	var realNum = obj.offsetTop;
	var positionParent = obj.offsetParent;  // 获取上一级定位元素对象
	
	while(positionParent != null) {
		realNum += positionParent.offsetTop - positionParent.scrollTop;
		positionParent = positionParent.offsetParent;
	}
	return realNum;
}

</script>

<style scoped>
	.combobox {
		position: relative;
		width: 210px;
		height: 56px;
		margin: 4px 24px;
	}
		.combobox-title {
			position: absolute;
			left: 0;
			top: 50%;
			width: 88px;
			transform: translateY(-50%);
			font-size: 14px;
			text-align: center;
		}
		.combobox-selector {
			position: absolute;
			left: 88px;
			height: 24px;
			width: 122px;
			margin: 15px 0;
			border-radius: 24px;
			background: #F7F7F7;
			border: #AAA 1px solid;
			box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
		}
		.combobox-selector:hover {
			background: white;
		}
		.combobox-selector:active {
			background: #E7E7E7;
		}
			.combobox-selector input {
				position: absolute;
				left: 6px;
				width: calc(100% - 28px);
				height: 24px;
				line-height: 24px;
				background: none;
				border: none;
				margin: 0;
				padding: 0;
				outline: none;
				font-family: inherit;
				font-size: 13px;
				color: inherit;
			}
			.combobox-selector-img {
				position: absolute;
				right: 6px;
				top: 4px;
				width: 16px;
				height: 16px;
				background: url(/images/menu_button.svg) center/contain no-repeat;
			}

</style>
