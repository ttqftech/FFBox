<script setup lang="ts">
import RadioList, { Props as RadioListProps } from '../MainArea/ParaBox/components/RadioList.vue';

const languageList: RadioListProps['list'] = [
	{ value: 'Mandarin (zho)', disabled: true },
	{ value: '粤语 (yue)', disabled: true },
];
const dataRadixList: RadioListProps['list'] = [
	{ value: '1000 进制 (SI)', disabled: true },
	{ value: '1024 进制 (IEC)', disabled: true },
];
const colorThemeList: RadioListProps['list'] = [
	{ value: '浅色', disabled: true },
	{ value: '深色', disabled: true },
	{ value: '毛玻璃', disabled: true },
];

</script>

<template>
	<div>
		<div class="localSettings">
			<span>语言</span>
			<RadioList :list="languageList" value="Mandarin (zho)" />
			<span>数据量进制和词头</span>
			<RadioList :list="dataRadixList" value="1000 进制 (SI)" />
			<span>颜色主题</span>
			<RadioList :list="colorThemeList" value="浅色" />
		</div>
	</div>
</template>

<style lang="less">
	.localSettings {
		width: 100%;
		display: grid;
		grid-template-columns: calc(20% + 50px) calc(50% + 50px);
		justify-content: center;
		align-items: center;
		&>span {
			font-size: 15px;
		}
		.radioList {
			flex-direction: row;
			min-height: unset;
		}
	}
</style>