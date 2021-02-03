<template>
	<div class="checkbox">
		<div class="checkbox-title">{{ title }}</div>
		<div class="checkbox-track" @mousedown="dragStart">
			<div class="checkbox-track-background" :style="checked == 0 ? 'width: 0%;' : 'width: 100%'"></div>
			<button class="checkbox-slipper" :style="checked == 0 ? 'left: 0px;' : 'left: 64px'" @keydown="onKeydown" @keyup="onKeyup"></button>
		</div>
	</div>
</template>

<script>

export default {
	name: 'Combobox',
	components: {		
	},
	data: () => { return {
		beforeChecked: false		// 鼠标点下时赋值，用于确认是否更改了值
	}},
	props: {
		// paramName: String,
		title: String,
		checked: Boolean,
	},
	computed: {
	},
	methods: {
		dragStart: function (event) {
			event.preventDefault()
			var id = Symbol()
			var mouseDownX = event.pageX || event.touches[0].pageX;			// 鼠标在页面（窗口）内的坐标
			if (event.target.className == "checkbox-slipper") {
				var sliderLeft = getWindowOffsetLeft(event.target.parentElement)
				var sliderWidth = event.target.parentElement.offsetWidth
			} else {
				var sliderLeft = getWindowOffsetLeft(event.target)
				var sliderWidth = event.target.offsetWidth
			}
			this.beforeChecked = this.checked
			// 添加鼠标事件捕获，将其独立为一个函数，以便于 mouseDown 直接触发 mouseMove
			var handleMouseMove = (event) => {
				var valueX = parseInt(event.pageX || event.touches[0].pageX) - sliderLeft
				if (valueX < sliderWidth / 2) {
					valueX = false
				} else {
					valueX = true
				}
				if (valueX != lastValue) {
					this.$emit('change', valueX)
					lastValue = valueX
				}
			}
			this.$store.commit('addPointerEvents', {
				type: "mousemove",
				id,
				// 处理鼠标拖动
				func: handleMouseMove
			})
			this.$store.commit('addPointerEvents', {
				type: "mouseup",
				id,
				// 移除鼠标事件捕获
				func: (event) => {
					// 处理只点一下没有动的情况
					if (Math.abs(mouseDownX - parseInt(event.pageX || event.touches[0].pageX)) <= 3) {
						if (this.checked && this.beforeChecked) {
							this.$emit('change', false)
						} else if (!this.checked && !this.beforeChecked) {
							this.$emit('change', true)
						}
					}
					this.$store.commit('removePointerEvents', {
						type: "mousemove",
						id
					})
					this.$store.commit('removePointerEvents', {
						type: "mouseup",
						id
					})
				}
			})
			var lastValue = NaN
			handleMouseMove({ pageX: event.pageX })	// mouseDown 直接触发 mouseMove
		},
		onKeydown: function (event) {
			if (event.key == 'ArrowLeft') {
				this.$emit('change', false)
			} else if (event.key == 'ArrowRight') {
				this.$emit('change', true)
			}
		},
		onKeyup: function (event) {
			if (event.key == ' ' || event.key == 'Enter') {
				this.$emit('change', !this.checked)
			}
		}
	},
	mounted: function () {
		this.beforeChecked = this.checked
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
	.checkbox {
		position: relative;
		width: 210px;
		height: 56px;
		margin: 4px 24px;
	}
		.checkbox-title {
			position: absolute;
			left: 0;
			top: 50%;
			width: 88px;
			transform: translateY(-50%);
			font-size: 14px;
			text-align: center;
		}
		.checkbox-track {
			position: absolute;
			right: 0;
			height: 24px;
			width: 88px;
			margin: 15px 0;
			border-radius: 24px;
			background: #F7F7F7;
			border: #CCC 1px solid;
			box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1) inset;
		}
			.checkbox-track-background {
				position: absolute;
				height: 24px;
				border-radius: 24px;
				background: hsl(210, 85%, 60%);
				box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1) inset;
				transition: all 0.15s ease-out;
			}
			.checkbox-slipper {
				position: absolute;
				top: 0;
				height: 24px;
				width: 24px;
				border-radius: 50%;
				background: linear-gradient(180deg, #fefefe, #f0f0f0);
				box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.3);
				transform: scale(1.25);
				transition: all 0.15s ease-out;
				border: none;
			}
			.checkbox-slipper:hover {
				background: linear-gradient(180deg, #ffffff, #fefefe);
			}
			.checkbox-slipper:active {
				background: linear-gradient(180deg, #f0f0f0, #ededed);								
			}

</style>
