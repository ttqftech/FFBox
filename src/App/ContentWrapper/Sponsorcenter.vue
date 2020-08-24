<template>
	<div id="Sponsorcenter" :class="{show: this.$store.state.showSponsorCenter}" :aria-hidden="!this.$store.state.showSponsorCenter">
		<div id="Sponsorcenter-background" @click="$store.commit('showSponsorCenter_update', false)"></div>
		<div id="Sponsorcenter-main">
			<h1 id="Sponsorcenter-title">打赏中心</h1>
			<div id="Sponsorcenter-crossline"></div>
			<div id="Sponsorcenter-box">
				<p>您的打赏是我更新软件的动力！如果喜欢的话，留下您的盘缠与留言！</p>
				<div id="QRscreens">
					<div class="QRscreen QRscreen-alipay">
						<div class="QRuppertext">推荐使用<strong>支付宝</strong></div>
						<div class="QRbox">
							<div class="QRbox-wrapper">
								<div v-for="elemI in alipayQR">
									<div class="QRblock" v-for="elemJ in elemI" :style="{ background: elemJ == 'F' ? 'white' : 'black', width: '4px', height: '4px' }"></div>
								</div>
								<br />
							</div>
						</div>
						<div class="QRlowertext">滔滔清风</div>
						<div class="QRtitle">
							<img src="/images/alipay.png">
						</div>
					</div>
					<div class="QRscreen QRscreen-wechatpay">
						<div class="QRuppertext">支付就用微信支付</div>
						<div class="QRbox">
							<div class="QRbox-wrapper">
								<div v-for="elemI in wechatpayQR">
									<div class="QRblock" v-for="elemJ in elemI" :style="{ background: elemJ == 'F' ? 'white' : 'black', width: '4.5px', height: '4.5px' }"></div>
								</div>
								<br />
							</div>
						</div>
						<div class="QRlowertext">滔滔清风</div>
						<div class="QRtitle">
							<img src="/images/wechatpay.svg">
						</div>
					</div>
					<div class="QRscreen QRscreen-qqpay">
						<div class="QRuppertext">QQ 支付</div>
						<div class="QRbox">
							<div class="QRbox-wrapper">
								<div v-for="elemI in qqQR">
									<div class="QRblock" v-for="elemJ in elemI" :style="{ background: elemJ == 'F' ? 'white' : 'black', width: '3.7px', height: '3.7px' }"></div>
								</div>
								<br />
							</div>
						</div>
						<div class="QRlowertext">滔滔清风</div>
						<div class="QRtitle">
							<img src="/images/qqpay.png">
						</div>
					</div>
				</div>
				<p>您的捐赠记录将会保留在开发者的账户中，建议留下昵称作为备注。</p>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: 'Sponsorcenter',
	computed: {
		alipayQR: function () {
			return getQR(`00 00 00 0F 00 F0 FF 0F FF 00 0F FF F0 FF 0F 00 0F 00 00 00 00 00 0F FF 0F FF FF 0F 0F FF 0F F0 00 F0 0F 00 F0 00 0F 0F FF 0F FF FF 00 00 0F 00 0F 00 0F 0F 0F 0F 0F 0F F0 F0 0F 00 00 F0 0F FF 0F 0F 00 0F 00 00 0F 00 0F 00 0F 0F F0 0F F0 F0 F0 0F FF 0F 0F 00 0F 0F FF 0F 00 0F 00 00 0F 00 0F 00 0F 0F FF 0F 00 F0 FF 0F 0F 0F F0 FF FF F0 0F 0F 00 0F 00 00 0F FF 0F FF FF 0F 0F F0 F0 FF FF F0 0F 0F 00 F0 FF 0F FF 0F FF FF 00 00 00 00 00 00 00 0F 0F 0F 0F 0F 0F 0F 0F 0F 0F 0F 0F 0F 0F 00 00 00 00 00 FF FF FF FF FF FF 00 FF F0 F0 0F 0F FF F0 FF 00 FF F0 0F FF FF FF F0 00 FF 00 FF 00 0F 0F 00 00 00 FF F0 0F FF FF 00 00 F0 FF 00 00 FF 00 00 00 0F FF 0F FF F0 FF 00 0F F0 FF 0F 00 FF 0F 0F 0F 00 F0 0F 00 0F 00 F0 00 00 FF 00 FF FF 00 F0 0F FF 00 00 00 FF 0F F0 00 F0 0F 00 F0 FF F0 F0 00 F0 FF F0 FF 00 F0 F0 F0 00 FF 0F FF F0 00 F0 00 0F F0 0F F0 00 F0 F0 00 F0 FF F0 FF 00 0F 00 0F 0F 00 0F F0 0F FF F0 FF 00 F0 F0 FF F0 00 00 00 FF F0 FF F0 00 FF FF 00 F0 00 F0 0F F0 FF FF F0 F0 FF 0F F0 0F FF 00 00 F0 00 F0 00 FF 00 FF 0F F0 F0 F0 FF 0F F0 0F F0 0F 00 F0 F0 F0 FF F0 00 0F 0F 0F 0F 0F F0 00 FF 00 F0 0F 0F 0F F0 F0 00 FF F0 0F 0F 00 FF F0 00 F0 00 F0 00 F0 00 FF F0 0F FF 00 00 FF 0F 0F 00 F0 F0 F0 F0 F0 00 00 00 00 FF 00 FF FF FF FF FF FF 0F 0F FF DF FF FF 0F 00 00 0F 00 00 F0 00 00 FF F0 FF F0 F0 0F FF 0F 00 F0 FF B4 07 FF 0F F0 F0 FF 0F 0F 00 FF F0 00 F0 00 F0 00 00 F0 0F 0F 0F FF FF 8D D5 F8 FF F0 F0 0F 0F 0F 00 F0 F0 00 F0 00 F0 00 FF 00 FF F0 F0 0F 0E 29 B3 9E FF F0 0F FF FF FF 00 00 F0 00 F0 F0 F0 F0 00 FF F0 F0 F0 FF 0F CD 4F FB 00 0F FF 00 00 00 F0 00 00 00 00 FF 00 FF 0F 00 F0 00 F0 F0 FF F2 DF 5F FF 00 00 0F 00 FF FF 0F F0 00 F0 00 F0 00 0F FF 0F 0F F0 FF 0F FF 7B FF F0 00 0F 00 0F 00 F0 0F F0 00 FF F0 FF F0 FF 00 00 0F 00 00 00 00 F0 FF F0 00 F0 00 FF F0 FF FF 00 00 F0 F0 F0 F0 0F FF FF 00 FF 00 F0 00 0F F0 0F 0F 00 00 F0 00 00 FF 00 00 0F 0F 0F 0F FF 0F 0F FF FF 0F 0F F0 F0 00 00 F0 0F 0F 0F 00 FF F0 F0 00 F0 0F F0 0F 00 F0 00 0F FF 00 0F 00 00 F0 FF F0 FF 00 00 00 00 FF 00 00 FF F0 FF F0 FF 00 00 FF 00 F0 0F F0 00 0F 0F 00 F0 00 0F 0F F0 00 F0 00 0F 0F 0F 0F 0F FF FF 0F FF 00 FF F0 FF F0 FF 00 00 FF F0 F0 0F 0F 00 00 0F 00 0F 00 00 00 F0 00 FF 0F 00 FF 0F FF FF 0F FF 0F 00 0F F0 F0 F0 00 0F F0 0F F0 00 FF FF F0 FF 00 FF 0F 0F 0F 0F FF 0F 0F F0 00 FF F0 F0 00 0F FF 0F FF FF 00 F0 00 0F 0F 00 FF F0 0F 0F FF 00 FF 00 00 0F 0F F0 00 FF FF FF FF FF FF 00 00 F0 00 0F FF FF F0 FF FF FF F0 0F FF 00 FF 00 00 00 00 00 00 00 0F FF FF FF 00 F0 FF F0 FF 0F F0 0F 00 0F 0F 0F 0F FF FF 0F FF 0F FF FF 0F F0 0F 00 0F FF F0 FF 0F F0 00 0F F0 0F FF 00 FF F0 00 0F 00 0F 00 0F 0F 00 0F 0F 00 FF 0F 00 0F 00 F0 0F 0F 00 00 00 00 00 00 0F 00 0F 00 0F 0F 00 FF 0F 0F 0F F0 00 0F F0 0F F0 FF 00 F0 FF F0 00 00 0F 00 0F 00 0F 0F 0F FF 0F FF 00 F0 00 0F FF 00 F0 F0 F0 00 00 F0 F0 00 0F FF 0F FF FF 0F F0 00 00 FF 0F F0 F0 0F 0F F0 FF 0F 0F 0F 0F F0 F0 00 00 00 00 00 00 0F FF F0 FF F0 0F F0 F0 00 F0 F0 F0 FF FF F0 00 FF F5 89 F7 00 00 00`, 41, 41 + 7)
		},
		wechatpayQR: function () {
			return getQR(`00 00 00 0F FF F0 0F F0 FF 00 00 FF 0F F0 0F 00 00 00 07 00 0F FF FF 0F F0 F0 0F FF FF 00 F0 00 00 FF FF 0F FF FF 00 00 0F 00 0F 0F F0 FF 00 00 FF FF FF F0 FF FF FF 0F 00 0F 00 00 0F 00 0F 0F F0 FF FF F0 F0 00 00 0F 0F F0 0F 0F 00 0F 00 00 0F 00 0F 0F 00 F0 F0 F0 00 F0 0F 00 FF F0 0F 0F 00 0F 00 00 0F FF FF 0F F0 00 0F 0F F0 00 0F 0F FF 00 0F 0F FF FF 00 00 00 00 00 0F 0F 0F 0F 0F 0F 0F 0F 0F 0F 0F 0F 00 00 00 00 00 FF FF FF FF 00 00 00 FF FF 00 0F FF 00 F0 FF FF FF FF F0 00 FF 00 FF 00 0F F0 FF 00 F0 0F F0 F0 F0 FF 00 0F 0F FF F0 00 00 FF F0 FF 00 00 0F 0F 0F F0 00 0F FF FF FF 0F FF F0 00 00 0F 00 F0 0F F0 F0 FF 0F 0F 0F F0 0F 00 FF FF F0 F0 FF 00 00 0F F0 FF FF 0F F0 F0 00 0F 00 F0 FF 00 F0 F0 0F FF FF F0 00 00 FF FF 0F F0 F0 FF 0F 0F 0F 0F 00 F0 00 0F 0F F0 00 00 00 0F F0 00 F0 F0 FF FF 00 FF 00 FF FF FF 0F F0 FF 0F F0 F0 00 F0 00 0F 00 00 00 F0 FF FF FF FF F0 FF 0F FF FF 0F FF F0 00 F0 FF 0F F0 0F 0F 00 FF FF FF FF F0 0F FF F0 F0 F0 00 F0 00 F0 FF 0F 0F FF FF F0 FF FF FF FF FF F0 FF 00 FF 0F 00 F0 00 F0 00 F0 FF F0 0F 00 FF F7 55 FF FF F0 FF 0F FF F0 0F F0 00 00 F0 F0 0F 0F 00 F0 FF FA B8 FF FF 00 F0 0F 00 F0 00 00 00 0F 0F F0 F0 0F F0 FF FF FF CF FF FF F0 FF 0F 00 00 00 00 00 00 F0 F0 0F FF 00 FF FF FF FF FF FF 00 FF FF F0 F0 0F 00 00 FF 0F FF FF 0F FF 0F FF FF FF FF EF 0F FF 0F 0F 00 FF F0 00 0F 00 FF 0F 0F F0 00 FF FF FF FC F8 F0 00 FF F0 F0 0F F0 00 0F FF F0 F0 0F 00 FF 0F F0 F0 FE DA 0F 00 0F FF FF F0 00 00 FF 00 00 0F 0F 00 F0 F0 0F FF 00 00 0F F0 0F F0 FF F0 00 00 FF 0F 0F F0 F0 0F F0 0F 00 F0 0F 00 FF 0F F0 F0 F0 F0 F0 00 F0 FF 00 0F 0F FF F0 FF FF F0 00 0F FF F0 FF F0 0F F0 F0 00 0F 0F F0 FF 0F 00 00 00 00 0F 00 0F 0F 00 00 F0 FF 0F 00 00 FF F0 F0 00 0F F0 0F F0 00 F0 F0 F0 00 0F 00 00 00 0F F0 00 FF FF FF FF 0F 0F F0 FF 00 FF 00 00 F0 FF 0F FF 00 0F 00 00 00 00 00 0F 0F F0 F0 FF F0 0F 0F 0F FF 00 0F 0F 0F 00 00 00 0F FF FF 0F F0 00 0F 0F FF F0 FF 0F 00 00 0F FF 00 F0 00 00 0F 00 0F 0F F0 0F 0F 0F 0F 0F F0 FF FF FF 00 00 00 F0 F0 00 0F 00 0F 0F 0F F0 0F 0F 0F F0 F0 F0 FF F0 FF F0 FF F0 00 00 0F 00 0F 0F 00 FF 00 FF 00 0F F0 F0 0F F0 F0 00 0F 00 FF F0 0F FF FF 0F FF FF 0F FF 00 F0 0F 00 FF FF 0F FF F0 00 00 00 00 00 00 0F F0 FF FF 00 F0 0F F0 FF 00 00 00 F0 FF F0 00 00 00 00`, 37, 37 + 3)
		},
			qqQR: function () {
			return getQR(`00 00 00 0F F0 00 0F FF F0 FF FF F0 F0 F0 00 0F FF FF 0F 00 00 00 00 00 0F FF FF 0F 0F 00 00 0F F0 F0 F0 00 0F 0F 0F F0 0F F0 FF 0F FF FF 00 00 0F 00 0F 0F F0 F0 F0 FF FF 00 F0 FF F0 FF 00 00 00 F0 FF 0F 00 0F 08 08 0F 00 0F 0F 00 FF F0 FF 00 0F 00 00 FF 00 FF 0F FF F0 0F 0F 00 0F 08 08 0F 00 0F 0F F0 00 FF F0 FF F0 00 00 0F FF FF 00 FF 00 0F 0F 00 0F 00 00 0F FF FF 0F 0F 0F 0F FF 00 0F 0F FF 0F 0F F0 F0 FF FF FF 0F FF FF 08 08 00 00 00 0F 0F 0F 0F 0F 0F 0F 0F 0F 0F 0F 0F 0F 0F 0F 0F 00 00 00 00 00 FF FF FF FF FF F0 F0 F0 FF F0 0F FF 0F 00 00 0F 00 F0 FF FF FF FF F8 08 00 00 0F 00 0F F0 FF F0 0F 0F 00 00 0F F0 F0 00 FF F0 F0 F0 F0 F0 F8 08 F0 FF 0F F0 00 0F 00 00 FF FF F0 F0 F0 FF F0 0F FF F0 00 FF FF F0 00 00 FF F0 F0 00 00 F0 0F FF F0 FF F0 FF 00 0F F0 F0 0F 0F FF 00 F0 00 F0 00 F0 00 00 F0 00 F0 00 00 0F 00 FF F0 00 F0 FF 00 00 F0 F0 F0 00 0F F0 00 0F 00 0F 0F 0F 00 00 F0 00 00 F0 00 00 FF F0 0F FF 00 00 F0 FF F0 F0 00 FF FF FF F0 00 F0 0F FF FF F0 FF FF F0 FF FF 00 0F F0 0F FF FF 00 F0 00 00 F0 FF 0F 00 00 0F FF F0 0F 0F F0 0F FF F0 F0 F0 0F 00 0F FF 00 F8 08 0F 00 00 FF 00 0F F0 00 F0 00 FF F0 00 F0 00 0F 00 FF FF 0F 00 00 F0 00 FF 0F 0F 0F FF 00 FF FF 00 00 00 F0 0F FF FF 00 FF FF F0 FF F0 F0 00 00 00 F0 F0 FF F0 FF FF 00 FF 00 F0 FF 00 F0 FF 00 F0 FF 00 F0 0F F0 08 08 00 F0 F0 0F 00 0F 0F FF F0 0F 0F F0 0F 0F FF FF F0 00 FF 0F 00 00 F8 08 0F FF 0F FF 00 F0 00 FF F0 0F FF F0 0F F0 00 00 00 00 FF FF F0 0F F8 08 00 F0 00 00 00 FF F0 F0 00 0F 00 00 0F 00 FF 0F FF F0 00 00 00 F0 F0 00 F0 FF 0F FF 00 0F 0F FF F0 FF 05 A6 00 FF FF 00 FF F0 0F FF 0F 0F F8 08 0F 00 0F 0F 00 0F 00 F0 0F 00 0B B9 0F FF 00 FF 00 00 0F 0F 00 F0 F0 00 0F F0 0F FF 0F 0F F0 FF FF FF 0F 5F 00 00 00 FF 0F 0F 0F FF 0F 00 F0 00 00 0F 00 00 0F FF 0F F0 FF 00 00 00 00 FF F0 F0 F0 0F 00 00 00 FF F0 00 00 0F 0F F0 F0 F0 F0 0F F0 F0 0F 00 0F FF 00 00 0F FF 00 0F FF 00 00 00 0F 0F F0 00 0F 0F F0 FF F0 0F 00 FF F0 0F 00 F0 F0 00 00 FF 00 00 F8 08 0F 00 FF FF FF F0 F0 FF FF 0F 00 00 0F FF 0F F0 0F F0 FF FF F0 0F F8 08 FF FF FF 00 F0 0F 00 F0 0F 00 0F FF 0F 00 FF 0F FF 0F FF F0 00 FF 00 00 00 F0 FF FF 00 00 00 F0 FF F0 F0 F0 0F F0 0F 00 FF FF 00 F0 FF F0 F8 08 F0 00 0F 00 0F F0 0F 0F FF FF 00 0F FF 0F 00 F0 00 0F F0 FF FF F0 F0 00 0F FF 0F FF F0 FF FF F0 FF 0F FF FF 00 00 0F 00 00 F0 FF 00 0F 0F F8 08 FF F0 00 0F 00 00 00 F0 0F 00 00 FF 00 0F F0 F0 FF 0F 00 F0 0F FF F8 08 00 0F 0F FF F0 0F 0F F0 FF F0 F0 00 00 FF 00 00 0F FF 0F FF F0 0F 08 08 FF FF 0F 00 00 00 0F FF F0 0F F0 F0 FF 00 F0 F0 00 00 00 FF F0 00 F8 08 F0 00 0F FF F0 0F 00 FF FF F0 00 00 00 F0 0F F0 0F 00 F0 FF 00 00 08 08 0F F0 0F 00 0F F0 FF FF 00 0F 00 00 00 FF F0 0F F0 0F 00 00 0F 00 F8 08 FF FF FF FF 0F F0 00 00 FF F0 0F FF 0F F0 0F 00 F0 FF 0F FF 00 F0 00 00 00 00 00 0F 0F 00 F0 FF F0 00 0F 0F 00 0F F0 F0 F0 00 0F 0F 00 FF F0 00 0F FF FF 0F F0 0F 00 FF 00 0F 0F FF 00 00 0F 0F 0F 0F 0F FF 0F 00 08 08 0F 00 0F 0F 0F 0F 0F FF 0F 0F 00 00 00 FF F0 0F FF 0F 00 00 0F F0 00 00 0F 00 0F 0F 0F 00 FF F0 F0 F0 F0 F0 0F F0 00 00 FF F0 F0 00 00 F0 F0 00 0F 00 0F 0F 0F FF F0 F0 FF 00 F0 00 F0 00 F0 F0 00 00 0F 0F FF 0F 00 00 0F FF FF 0F 00 F0 FF 00 00 0F 0F F0 FF 00 0F 00 0F F0 F0 FF 0F 0F F0 00 00 00 00 0F 0F 00 F0 FF 0F 00 F0 0F 00 F0 FF 00 F0 00 FF 0F 0F F0 F8 08 00 00`, 45, 45 + 3)
		}
	},
	methods: {
	}
}

// 传入 HexEditor 从第一个像素开始的内容，需要 4 位灰度色 bmp，反向行序
// 传入二维码大小
function getQR (hexString, size, linesize) {
	var QRstring = hexString.replace(/ /g, '')
	var QRcode = []
	for (let i = 0; i < size; i++) {
		QRcode[i] = []
		for (let j = 0; j < size; j++) {
			let pos = i * linesize + j
			QRcode[i][j] = QRstring[pos]
		}
	}
	return QRcode
}
</script>

<style scoped>
	#Sponsorcenter {
		position: absolute;
		top: 28px;
		bottom: 24px;
		left: 0px;
		right: 0px;
		z-index: 2;
		pointer-events: none;
	}
	#Sponsorcenter.show {
		pointer-events: all;
	}
		#Sponsorcenter-background {
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.1);
			opacity: 0;							/* 后期由 js 来改变 */
			transition: opacity 0.3s;
		}
		.show #Sponsorcenter-background {
			opacity: 1;
		}
		#Sponsorcenter-main {
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
		.show #Sponsorcenter-main {
			transform: translateY(0);
			opacity: 1;
		}
		#Sponsorcenter-title {
			position: absolute;
			top: 12px;
			left: 50%;
			transform: translateX(-50%);
			font-size: 22px;
			color: #2255ee;
			margin: 0;
			font-weight: normal;
		}
		#Sponsorcenter-crossline {
			position: absolute;
			top: 48px;
			height: 1px;
			left: 5%;
			right: 5%;
			background: linear-gradient(90deg, rgba(128, 128, 128, 0.1), rgba(128, 128, 128, 0.4), rgba(128, 128, 128, 0.1));
		}
		#Sponsorcenter-box {
			position: absolute;
			top: 60px;
			bottom: 20px;
			left: calc(10% - 32px);
			right: calc(10% - 32px);
			overflow-y: auto;
			margin: 0;
			padding: 0;
		}
		#Sponsorcenter-title2nd {
			
		}
		#Sponsorcenter-box::-webkit-scrollbar {
			width: 10px;
			background: transparent;
		}
		#Sponsorcenter-box::-webkit-scrollbar-thumb {
			border-radius: 10px;
			background: rgba(128, 128, 128, 0.2);
		}
		#Sponsorcenter-box::-webkit-scrollbar-track {
			border-radius: 10px;
			background: rgba(128, 128, 128, 0.1);
		}
			#QRscreens {
				display: flex;
				justify-content: center;
				flex-wrap: wrap;
				margin-bottom: 24px;
			}
				.QRscreen {
					position: relative;
					width: 240px;
					height: 340px;
					border-radius: 10px;
					margin: 16px;
					overflow: hidden;
				}
					.QRscreen-alipay {
						background: #019fe8;
						box-shadow: hsla(199, 99%, 34.5%, 50%) 0px 6px 20px;
					}
					.QRscreen-wechatpay {
						background: #22ab38;
						box-shadow: hsla(130, 67%, 30%, 50%) 0px 6px 20px;
					}
					.QRscreen-qqpay {
						background: #12b7f5;
						box-shadow: hsla(196, 92%, 52%, 50%) 0px 6px 20px;
					}
				.QRuppertext {
					position: absolute;
					top: 16px;
					width: 100%;
					text-align: center;
					font-size: 20px;
					color: white;
				}
					.QRbox {
						position: absolute;
						margin: auto;
						left: 0;
						right: 0;
						top: 56px;
						width: 180px;
						height: 180px;
						box-sizing: border-box;
						background: white;
						display: flex;
						justify-content: center;
						align-items: center;
					}
						.QRbox-wrapper {
							font-size: 0;
						}
							.QRblock {
								display: inline-block;
							}
				.QRlowertext {
					position: absolute;
					top: 244px;
					width: 100%;
					text-align: center;
					font-size: 18px;
					color: white;
				}
				.QRtitle {
					position: absolute;
					bottom: 0;
					height: 56px;
					width: 100%;
					background: white;
				}
					.QRtitle img {
						position: absolute;
						margin: auto;
						left: 0;
						right: 0;
						top: 0;
						bottom: 0;
						height: 60%;
					}

</style>
