<template>
	<div id="combomenu">
		<div id="combomenu-background" @click="close()" :class="{ combomenuBackgroundShow: showCombomenu, combomenuBackgroundHide: !showCombomenu }"></div>
		<transition name="comboanimate">
			<menu id="combomenu-list" v-if="showCombomenu" :style="comboPosition">
				<div v-for="(listitem, index) in comboList" :key="listitem.sName" class="combomenu-item" :class="{ combomenuItemSelected: listitem.sName == comboDefault }" :tabindex="index" @click="selected(index)" @keypress="onKeypress($event, index)" @keydown="onKeydown($event, index)" @keyup="onKeyup($event, index)" @mouseenter="handleMouseEnter($event, index)" @mouseleave="handleMouseLeave()">
					<!-- <div style="background-image: url(image/star.png);"></div> -->
					{{ listitem.lName }}
				</div>
			</menu>
		</transition>
		<!-- <div id="combomenu-description" class="combomenu-description-fold">{{ $store.state.comboDescription }}</div> -->
	</div>
</template>

<script>
export default {
	name: 'Combomenu',
	props: {
		showCombomenu: Boolean,
		comboPosition: Object,
		comboDefault: String,
		comboList: Array
	},
	data: () => { return {
		currentSelection: -1
	}},
	methods: {
		selected: function (index) {
			this.handleMouseLeave()
			this.$store.state.comboSelectionHandler(this.comboList[index].sName)	// 选中时传回对应 sName
			this.close()
		},
		onKeypress: function (event, index) {
		},
		onKeyup: function (event, index) {
			if (event.key == ' ' || event.key == 'Enter') {
				this.selected(index)
			} else if (event.key == 'Escape') {
				this.close()
			}
		},
		onKeydown: function (event, index) {
			if (event.key == 'ArrowDown' || event.key == 'ArrowUp') {
				if (event.key == 'ArrowDown') {
					if (this.currentSelection < this.comboList.length - 1) {
						this.currentSelection++
					}
				} else {
					if (this.currentSelection > 0) {
						this.currentSelection--
					}
				}
				this.$el.childNodes[1].childNodes[this.currentSelection].focus()
			}
		},
		close: function () {
			this.$store.commit('combomenuDisappear')
		},
		// 处理 tooltip
		handleMouseEnter: function (event, index) {
			var horizontal
			var vertical
			if (parseInt(this.comboPosition.left) + event.target.offsetWidth / 2 < document.documentElement.clientWidth / 2) {
				horizontal = {
					left: getWindowOffsetLeft(event.target) + event.target.offsetWidth + 16 + 'px',
				}
			} else {
				horizontal = {
					right: `calc(100% - ${getWindowOffsetLeft(event.target) - 16}px)`,
				}
			}
			if (getWindowOffsetTop(event.target) + event.target.offsetHeight / 2 < document.documentElement.clientHeight / 2) {
				vertical = {
					top: getWindowOffsetTop(event.target) + 'px'
				}
			} else {
				vertical = {
					bottom: `calc(100% - ${getWindowOffsetTop(event.target) + event.target.offsetHeight}px)`
				}
			}
			var position = {
				...horizontal,
				...vertical
			}
			this.$store.commit('showTooltip', {
				text: this.comboList[index].description,
				position
			})
		},
		handleMouseLeave: function () {
			this.$store.commit('clearTooltip')
		}
	},
	computed: {
		comboDefaultIndex: function () {
			for (const index in this.comboList) {
				if (this.comboList[index].sName == this.comboDefault) {
					return index
				}
			}
			return -1
		}
	},
	watch: {
		showCombomenu: function (newValue, oldValue) {
			this.$nextTick(() => {
				if (newValue) {
					// console.log(this.$el.childNodes[1].childNodes)
					this.currentSelection = this.comboDefaultIndex
					if (this.comboDefaultIndex > 0) {
						this.$el.childNodes[1].childNodes[this.currentSelection].focus()
					}
					/*
					for (const item of this.$el.childNodes[1].childNodes) {
						if (item.innerText == this.comboDefault) {
							item.focus()
							return
						}
					}
					*/
				}
			})
		}
	},
	mounted: function () {
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
	#combomenu {
	}
		.combomenuBackgroundShow {
			position: absolute;
			width: 100%;
			height: 100%;
			background: none;
		}
		.combomenuBackgroundHide {
			width: 0;
		}

		#combomenu-list {
			position: absolute;
			width: 200px;
			background: #fbfbfb;
			box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.3);
			border-radius: 8px;
			overflow-y: auto;
			font-size: 0;
			text-align: left;
			z-index: 10;
			padding-inline-start: 0;
		}
		.comboanimate-enter, .comboanimate-leave-to {
			transform: scaleY(0) translateY(100%)
		}
		.comboanimate-enter-active, .comboanimate-leave-active {
			transition: all 0.25s;
		}
		.comboanimate-enter-to, .comboanimate-leave {
			transform: scaleY(1) translateY(0%);
		}
		#combomenu-list::-webkit-scrollbar {
			position: relative;
			width: 12px;
			left: -32px;
			background: transparent;
		}
		#combomenu-list::-webkit-scrollbar-thumb {
			border-radius: 12px;
			background: rgba(192, 192, 192, 0.3);
		}
		#combomenu-list::-webkit-scrollbar-track {
			background: none;
		}
			.combomenu-item {
				display: inline-block;
				position: relative;
				width: 100%;
				height: 40px;
				border-bottom: #EEE 1px solid;
				box-sizing: border-box;
				padding-left: 40px;
				font-size: 16px;
				line-height: 40px;
				outline: none;
			}
				.combomenu-item:hover, .combomenu-item:focus {
					background: hsl(210, 95%, 90%);
				}
				.combomenuItemSelected, .combomenuItemSelected:focus {
					background: hsl(210, 95%, 80%);
				}
				.combomenu-item div {
					position: absolute;
					left: 10px;
					top: 10px;
					width: 20px;
					height: 20px;
					background-size: cover;
				}
				
		#combomenu-description {
			display: inline-block;
			position: absolute;
			height: 200px;
			background: #fbfbfb;
			box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.3);
			border-radius: 12px;
			font-size: 14px;
			pointer-events: none;
			overflow: hidden;
			transition: all 0.2s;
		}
		.combomenu-description-open {
			padding: 12px;
			width: 300px;
		}
		.combomenu-description-fold {
			padding: 0px;
			width: 0px;
		}

</style>
