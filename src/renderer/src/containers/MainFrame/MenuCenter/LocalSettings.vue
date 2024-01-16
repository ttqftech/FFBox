<script setup lang="ts">
import RadioList, { Props as RadioListProps } from '../MainArea/ParaBox/components/RadioList.vue';
import { useAppStore } from '@renderer/stores/appStore';

const appStore = useAppStore();

const languageList: RadioListProps['list'] = [
	{ value: 'Mandarin (cmn)', disabled: true },
	{ value: '粤语 (yue)', disabled: true },
];
const dataRadixList: RadioListProps['list'] = [
	{ value: '1000 进制 (SI)', disabled: true },
	{ value: '1024 进制 (IEC)', disabled: true },
];
const colorThemeList: RadioListProps['list'] = [
	{ value: 'themeLight', caption: '浅色' },
	{ value: 'themeDark', caption: '深色' },
];
const progressModeList: RadioListProps['list'] = [
	{ value: '预测实时值', disabled: true },
	{ value: 'ffmpeg 真实值', disabled: true },
];

const handleSettingChange = (key: 'colorTheme', value: any) => {
	appStore.frontendSettings[key] = value;
	appStore.applyFrontendSettings(true);
};

</script>

<template>
	<div>
		<div class="localSettings">
			<span>语言</span>
			<RadioList :list="languageList" value="Mandarin (zho)" />
			<span>数据量进制和词头</span>
			<RadioList :list="dataRadixList" value="1000 进制 (SI)" />
			<span>颜色主题</span>
			<RadioList :list="colorThemeList" :value="appStore.frontendSettings.colorTheme" @change="(value) => handleSettingChange('colorTheme', value)" />
			<span>进度显示模式</span>
			<RadioList :list="progressModeList" value="预测实时值" />
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