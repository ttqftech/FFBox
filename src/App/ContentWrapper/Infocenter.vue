<template>
	<div id="infocenter" :class="{show: this.$store.state.showInfoCenter}" :aria-hidden="!this.$store.state.showInfoCenter">
		<div id="infocenter-background" @click="$store.commit('showInfoCenter_update', false)"></div>
		<div id="infocenter-main">
			<h1 id="infocenter-title">消息中心</h1>
			<div id="infocenter-crossline"></div>
			<ul id="infocenter-box">
				<li v-for="(value, index) in $store.state.infos" :key="index" class="infocenter-info">
					<div v-if="value.level == 0" class="infocenter-info-img img-info"></div>
					<div v-else-if="value.level == 1" class="infocenter-info-img img-tick"></div>
					<div v-else-if="value.level == 2" class="infocenter-info-img img-warning"></div>
					<div v-else-if="value.level == 3" class="infocenter-info-img img-error"></div>
					<p>{{ value.msg }}</p>
					<span>{{ value.time | hhmmss }}</span>
					<button class="infocenter-info-delete" aria-label="删除此消息" @click="deleteMsg(index)">
						<img src="/×.svg" alt="">
					</button>
				</li>
			</ul>
		</div>
	</div>
</template>

<script>
export default {
	name: 'Infocenter',
	props: {
		
	},
	data: () => { return {
	}},
	filters: {
		hhmmss: function (value) {
			let objDate = new Date(value)
			return ('0' + objDate.getHours()).slice(-2) + ':' + ('0' + objDate.getMinutes()).slice(-2) + ':' + ('0' + objDate.getSeconds()).slice(-2)
		}
	},
	methods: {
		// 删除消息
		deleteMsg: function (index) {
			this.$store.commit('deleteMsg', index)
		}
	}
}
</script>

<style scoped>
	#infocenter {
		position: absolute;
		top: 28px;
		bottom: 24px;
		left: 0px;
		right: 0px;
		z-index: 2;
		pointer-events: none;					/* 后期由 js 来改变 */
	}
	#infocenter.show {
		pointer-events: all;
	}
		#infocenter-background {
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.1);
			opacity: 0;							/* 后期由 js 来改变 */
			transition: opacity 0.3s;
		}
		.show #infocenter-background {
			opacity: 1;
		}
		#infocenter-main {
			position: absolute;
			top: 54px;
			left: 1px;
			right: 1px;
			bottom: 0px;
			background: rgba(247, 247, 247, 1);
			box-shadow: 0px 1px 2px #F7F7F7,
						0px 2px 36px rgba(0, 0, 0, 0.5);
			border-radius: 16px 16px 0px 0px;
			transform: translateY(30%);			/* 后期由 js 来改变 */
			opacity: 0;							/* 后期由 js 来改变 */
			transition: opacity 0.3s, transform 0.3s;
		}
		.show #infocenter-main {
			transform: translateY(0);
			opacity: 1;
		}
		#infocenter-title {
			position: absolute;
			top: 12px;
			left: 50%;
			transform: translateX(-50%);
			font-size: 22px;
			color: #2255ee;
			margin: 0;
			font-weight: normal;
		}
		#infocenter-crossline {
			position: absolute;
			top: 48px;
			height: 1px;
			left: 5%;
			right: 5%;
			background: linear-gradient(90deg, rgba(128, 128, 128, 0.1), rgba(128, 128, 128, 0.4), rgba(128, 128, 128, 0.1));
		}
		#infocenter-box {
			position: absolute;
			top: 60px;
			bottom: 20px;
			left: calc(10% - 32px);
			right: calc(10% - 32px);
			overflow-y: auto;
			margin: 0;
			padding: 0;
		}
			.infocenter-info {
				position: relative;
				width: 100%;
				padding: 4px 0px;
				list-style-type: none;
				border-bottom: #DDD 1px solid;
			}
				.infocenter-info-img {
					position: absolute;
					left: 8px;
					top: 50%;
					transform: translateY(-50%);
					height: 16px;
					width: 16px;
					background-position: center;
					background-size: contain;
					background-repeat: no-repeat;
				}
				.img-info {
					background-image: url(/info.svg);
				}
				.img-tick {
					background-image: url(/tick.svg);
				}
				.img-warning {
					background-image: url(/warning.svg);
				}
				.img-error {
					background-image: url(/error.svg);
				}
				.infocenter-info p {
					font-size: 14px;
					line-height: 1.4em;
					color: #555;
					margin: 0px calc(5em + 20px) 0px 32px;
					text-align: left;
				}
				.infocenter-info span {
					position: absolute;
					right: 28px;
					top: 50%;
					transform: translateY(-50%);
					font-size: 12px;
					line-height: 1.4em;
					color: #777;
				}
				.infocenter-info-delete {
					position: absolute;
					top: 4px;
					right: 8px;
					height: 20px;
					width: 20px;
					opacity: 0.5;
					border: none;
					outline: none;
					background: none;
					padding: 0;
					display: flex;
					justify-content: center;
					align-items: center;
				}
				.infocenter-info-delete:hover {
					opacity: 1;
				}
				.infocenter-info-delete:active {
					opacity: 0.7;
				}
					.infocenter-info-delete img {
						width: 16px;
					}
		#infocenter-box::-webkit-scrollbar {
			width: 10px;
			background: transparent;
		}
		#infocenter-box::-webkit-scrollbar-thumb {
			border-radius: 10px;
			background: rgba(128, 128, 128, 0.2);
		}
		#infocenter-box::-webkit-scrollbar-track {
			border-radius: 10px;
			background: rgba(128, 128, 128, 0.1);
		}
</style>
