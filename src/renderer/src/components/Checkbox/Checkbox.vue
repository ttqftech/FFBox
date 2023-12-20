<script setup lang="ts">
import IconTick from './tick.svg?component';

const props = defineProps<{
    checked: boolean | 'partial';
    disabled?: boolean;
}>();

</script>

<template>
    <div :class="`box ${props.checked ? 'boxSelected' : ''}`">
        <IconTick />
    </div>
</template>

<style scoped lang="less">
    .box {
        position: relative;
        box-sizing: border-box;
        width: 18px;
        height: 18px;
        display: inline-block;
        background-color: hwb(var(--bg98) / 0.8);
        border: hwb(0 80% 20%) 1px solid;
        border-radius: 3px;
        box-shadow: 0 2px 2px hwb(0 80% 20% / 0.2);
        svg {
            position: absolute;
            left: 10%;
            top: 10%;
            width: 80%;
            height: 80%;
            color: transparent;
        }
    }
    .boxSelected {
        background-color: hwb(220 25% 10%);
        border: none;
        box-shadow: 0 2px 4px hwb(220 25% 10% / 0.2);
        svg {
            color: #FFF;
        }
    }
</style>