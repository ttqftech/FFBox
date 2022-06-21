<template>
	<div class="inputbox" :style="{ width: long ? 'calc(100% - 28px)' : '210px' }">
		<div class="inputbox-title">{{ title }}</div>
		<div class="inputbox-selector" :style="selectorStyle">
			<input type="text" v-model="inputText" @blur="onBlur" @focus="onFocus" @input="onInput" :placeholder="placeholder">
		</div>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	name: 'Inputbox',
	data: () => { return {
		focused: false,
		inputText: '-',
		typeCheckOK: true
	}},
	props: {
		title: String,
		value: String,
		long: [Boolean, String],
		type: String,
		placeholder: String,
		notNull: [Boolean, String]
	},
	computed: {
		selectorStyle: function () {
			var ret: any = {};
			if (!this.typeCheckOK || (this.notNull && this.inputText == '')) {
				ret.border = '#E66 1px solid';
				ret.boxShadow = '0 0 12px hsla(0, 100%, 60%, 0.3), 0px 4px 8px rgba(0, 0, 0, 0.05)';
				if (this.focused) {
					ret.background = '#FEE';
				} else {
					ret.background = '#F7E7E7';
				}
			} else {
				if (this.focused) {
					ret.background = 'white';
				}
			}
			return ret;
		}
	},
	methods: {
		onBlur: function (event: FocusEvent) {
			this.focused = false;
		},
		onFocus: function (event: FocusEvent) {
			event.target!.selectionEnd = event.target!.selectionStart;
			this.focused = true;
		},
		onInput: function (event: KeyboardEvent) {
			this.$emit('change', event.target!.value);
			this.$emit('input', event.target!.value);
		}
	},
	watch: {
		value: function (newValue, oldValue) {		// props 的 text 只有单向数据流，因此新增 data 的 inputText 做双向绑定和事件监听
			this.inputText = newValue;
		},
		inputText: {
			handler: function (newValue, oldValue) {
				if (!newValue) {
					this.typeCheckOK = true;
					return;
				}
				switch (this.type) {
					case 'duration':
						this.typeCheckOK = newValue.match(/^\d+(.\d+)?$/) || newValue.match(/^\d+:[0-5]?[0-9](.\d+)?$/) || newValue.match(/^\d+:[0-5]?[0-9]:[0-5]?[0-9](.\d+){0,1}$/)
						break;
					case 'number':
						this.typeCheckOK = newValue.match(/^\d+(.\d+)?$/);
						break;
					default:
						this.typeCheckOK = true;
						break;
				}
			},
			immediate: true,
		}
	},
	mounted: function () {
		this.inputText = this.value;
	}
});

</script>

<style scoped>
	.inputbox {
		position: relative;
		height: 56px;
		margin: 4px 24px;
	}
		.inputbox-title {
			position: absolute;
			left: 0;
			top: 50%;
			width: 88px;
			transform: translateY(-50%);
			font-size: 14px;
			text-align: center;
		}
		.inputbox-selector {
			position: absolute;
			left: 88px;
			height: 24px;
			right: 0;
			margin: 15px 0;
			border-radius: 24px;
			background: #F7F7F7;
			border: #AAA 1px solid;
			box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
			transition: box-shadow 0.2s linear, border 0.2s linear;
		}
		.inputbox-selector:hover {
			background: white;
		}
		.inputbox-selector:active {
			background: #E7E7E7;
		}
			.inputbox-selector>input {
				position: absolute;
				left: 6px;
				width: calc(100% - 12px);
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
			.inputbox-selector>input::placeholder {
				font-size: 13px;
				opacity: 0.1;
				font-style: italic;
				transition: opacity 0.15s linear;
			}
			.inputbox-selector>input:hover::placeholder {
				font-size: 13px;
				opacity: 0.25;
			}

</style>
