<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import SimpleMarkdown from '@khanacademy/simple-markdown';
import nodeBridge from '@renderer/bridges/nodeBridge';
import IconError from '@renderer/assets/infoCenter/error.svg?component';

const licenseText = ref();

const content = computed(() => {
	const ast = SimpleMarkdown.defaultBlockParse(licenseText.value);
	const html = SimpleMarkdown.defaultHtmlOutput(ast);
	return html;
});

onMounted(() => {
	nodeBridge.readLicense().then((data) => {
		licenseText.value = data;
	});
});

</script>

<template>
	<article v-if="licenseText" :innerHTML="content" />
	<div class="noLicenseFile" v-else>
		<IconError />
		无法读取 LICENSE 文件
	</div>
</template>

<style scoped lang="less">
	article {
		box-sizing: border-box;
		width: 100%;
		padding: 0 5%;
		/deep/ h1 {
			font-size: 22px;
		}
		/deep/ div {
			font-size: 15px;
			line-height: 25px;
			text-align: left;
			margin: 10px 0;
		}
		/deep/ ul {
			margin: 10px 0;
		}
		/deep/ li {
			font-size: 15px;
			line-height: 25px;
			text-align: left;
		}
	}
	.noLicenseFile {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 24px;
	}
</style>