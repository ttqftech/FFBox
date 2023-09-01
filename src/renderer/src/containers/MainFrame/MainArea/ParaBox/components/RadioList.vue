<script setup lang="ts">
import { ref } from 'vue';
import InputAutoSize from './InputAutoSize.vue';

interface Props {
	list: {
		value: string | number;
		deletable?: boolean;
		editable?: boolean;
	}[];
	value: string | number;
	placeholder?: string;
	onDelete?: (value: string | number, index: number) => any;
	onEdit?: (oldValue: string, newValue: string, index: number) => any;
	onChange?: (value: string | number, index: number) => any;
}

const props = defineProps<Props>();

const editingValue = ref();

const handleItemClick = (item: Props['list'][number], index: number) => {
	if (item.value !== props.value) {
		props.onChange(item.value, index);
	}
};
const handleLabelClick = (item: Props['list'][number]) => {
	if (item.editable) {
		editingValue.value = item.value;
	}
}
const handleConfirm = (item: Props['list'][number], value: string, index: number) => {
	editingValue.value = undefined;
	props.onEdit(`${item.value}`, value, index);
}
</script>

<template>
	<div class="radioList">
		<button
			v-for="(item, index) in props.list"
			:key="item.value"
			:class="`item ${item.value === props.value ? 'itemSelected' : ''}`"
			@mousedown="() => handleItemClick(item, index)"
		>
			<InputAutoSize
				v-if="editingValue === item.value"
				:value="`${item.value}`"
				:onBlur="(value) => handleConfirm(item, value, index)"
				:onPressEnter="(value) => handleConfirm(item, value, index)"
			/>
			<span
				v-if="editingValue !== item.value"
				@click="handleLabelClick(item)"
				:style="item.value ? {} : { opacity: 0.5 }"
			>
				{{ item.value === '' ? placeholder : item.value }}
			</span>
			<button
				v-if="item.deletable"
				class="combomenu-item-delete"
				aria-label="删除此项"
				@click="() => (props.onDelete || (() => {}))(`${item.value}`, index)"
			>
				<img src="@renderer/assets/mainArea/paraBox/×.svg?url" alt="">
			</button>
		</button>
	</div>
</template>

<style scoped lang="less">
	.radioList {
		display: flex;
		flex-direction: column;
		flex-wrap: wrap;
		justify-content: center;
		align-content: center;
		box-sizing: border-box;
		height: 100%;
		min-height: 120px;
		padding: 16px;
		gap: 6px;
		color: #666;
		isolation: isolate;
		.item {
			// width: 40px;
			height: 30px;
			box-sizing: border-box;
			padding: 0 23px 0 20px;
			position: relative;
			outline: none;
			border: none;
			font-size: 13px;
			line-height: 30px;
			white-space: nowrap;
			background-color: hwb(0deg 99% 1% / 0.8);
			border-radius: 4px;
			box-shadow: 0 0 1px 0.5px hwb(0deg 99% 1%),
						0 1.5px 3px 0 hwb(0deg 0% 100% / 0.2);
			border-left: transparent 3px solid;
			transition: all 0.3s cubic-bezier(0, 1.5, 0.3, 1);
			&:not(.itemSelected):hover::after {
				content: '';
				position: absolute;
				top: 0;
				left: -3px;
				width: calc(100% + 3px);
				height: 100%;
				border-radius: inherit;
				// background: hwb(0 100% 0% / 0.2);
				box-shadow: 0 0 2px hwb(0 0% 100% / 0.2);
				z-index: 1;
			}
			* {
				user-select: none;
				-webkit-user-drag: none;
			}
			&>div {
				margin: 0 -4px;
			}
			.combomenu-item-delete {
				position: absolute;
				top: 0;
				right: 0;
				height: 100%;
				width: 20px;
				border: none;
				border-radius: 0 4px 4px 0;
				outline: none;
				background: none;
				padding: 0;
				display: flex;
				justify-content: center;
				align-items: center;
				opacity: 0.5;
				z-index: 2;
				user-select: none;
				&:hover {
					box-shadow: 0 0 3px hwb(0 0% 100% / 0.1);
					background: hwb(0 100% 0% / 0.5);
					opacity: 1;
				}
				&:active {
					box-shadow: 0 0 2px 1px hwb(0 0% 100% / 0.05), // 外部阴影
								0 6px 12px hwb(0 0% 100% / 0.15) inset; // 内部凹陷阴影
					transform: translateY(0.5px);
					// opacity: 0.7;
				}
				&>img {
					width: 16px;
				}
			}
		}
		.itemSelected {
			background-color: hwb(0deg 97% 3% / 0.8);
			border-radius: 3px 4px 4px 3px;
			box-shadow: 0 0 2px 1px hwb(0 0% 100% / 0.05), // 外部阴影
						0 3px 6px hwb(0 0% 100% / 0.1) inset; // 内部凹陷阴影
			border-left: #49e 3px solid;
		}
	}

</style>
