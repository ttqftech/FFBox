<script setup lang="ts">
import { useAppStore } from '@renderer/stores/appStore';
import { TaskItem, TaskJtem, TaskKtem } from './MainArea/ListArea/TaskItem';

const paraSelected = 0;
</script>

<template>
	<div class="mainarea">
		<div class="listarea">
			<TaskItem />
			<TaskJtem />
			<TaskKtem value="Vue 3.1" />
		</div>
		<div class="parabox">
			<div class="upper">
				<div class="devider">
					<div class="buttons">
						<button v-for="value in [0, 1, 2, 3, 4, 5]" :key="value" :aria-label="['快捷参数', '输入参数', '视频参数', '音频参数', '效果参数', '输出参数'][value]">
							<div class="icon" :class="{'icon-selected': paraSelected == value}" :style="{ backgroundPositionY: `${(value + 2) / 7 * 100}%` }"></div>
						</button>
					</div>
				</div>
				<div class="globalparam">
				</div>
			</div>
			<div class="lower">
			</div>
		</div>
	</div>
</template>

<style lang="less">
	.mainarea {
		position: relative;
		width: 100%;
		// height: 24px;
		background-color: hwb(0 92% 8%);
		flex: 1 0 auto;
		.parabox  {
			position: absolute;
			bottom: 0;
			width: 100%;
			min-height: 28px;
			height: 40%;
			background-color: hwb(0 94% 6%);
			box-shadow: 0px 0px 8px hwb(0 0% 100% / 0.05), // 远距离上阴影
						0px 1px 1px hwb(0 100% 0% / 0.25) inset; // 内部上阴影
			overflow: hidden;
			.upper {
				height: 30px;
				background-color: hwb(0 97% 3%);
				box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.02), // 远距离下阴影
							0px -2px 1px -1px rgba(0, 0, 0, 0.1) inset; // 内部下阴影
				.devider {
					.buttons {
						height: 28px;
						overflow: hidden;
						button {
							display: inline-block;
							text-align: center;
							width: 80px;
							height: 28px;
							padding: 0;
							background-color: transparent;
							border: none;
							&:hover {
								background-color: hwb(0 100% 0% / 0.5);
								box-shadow: 0 0 4px 2px hwb(0 0% 100% / 0.05);
							}
							&:active {
								background-color: transparent;
								box-shadow: 0 0 2px 1px hwb(0 0% 100% / 0.05), // 外部阴影
											0 6px 12px hwb(0 0% 100% / 0.1) inset; // 内部凹陷阴影
								transform: translateY(0.25px);
							}
							.icon {
								display: inline-block;
								width: 65px;
								height: 20px;
								vertical-align: middle;
								background-image: url('../../assets/sidebar-icon-white.png');
								background-size: cover;
							}
							.icon-selected {
								background-image: url('../../assets/sidebar-icon-colored.png');
							}
						}
					}
				}
				.globalparam {

				}
			}
			.lower {

			}
		}
	}

</style>