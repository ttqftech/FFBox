<template>
	<div class="combobox">
		<div class="combobox-title">{{ title }}</div>
		<div class="combobox-selector" id="format_format-div" @click="onClick">
			<span class="combobox-selector-text" id="format_format-text">{{ text }}</span>
			<div class="combobox-selector-img"></div>
		</div>
	</div>
</template>

<script>

export default {
	name: 'Combobox',
	components: {		
	},
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
			var ScreenWidth = document.documentElement.clientWidth			// 使用 window.innerWidth 也行
			var ScreenHeight = document.documentElement.clientHeight
			var popLeft, popTop
			var finalLeft, finalTop, finalHeight

			popLeft = getWindowOffsetLeft(event.target) - 39
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

			this.$store.commit('showCombomenu', {
				list: this.list,
				default: this.text,
				position: { top: finalTop, height: finalHeight, left: finalLeft },
				handler: (index) => {
					this.$emit('change', index)
				}
			})
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
			.combobox-selector span {
				position: absolute;
				left: 6px;
				height: 24px;
				line-height: 24px;
				font-size: 14px;
			}
			.combobox-selector-img {
				position: absolute;
				right: 6px;
				top: 4px;
				width: 16px;
				height: 16px;
				background: url(/menu_button.svg) center/contain no-repeat;
			}

</style>
