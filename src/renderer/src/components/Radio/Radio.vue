<script setup lang="ts">

const props = defineProps<{
    checked: boolean | 'partial';
    disabled?: boolean;
}>();

</script>

<template>
    <div :class="`box ${props.checked ? 'boxSelected' : ''}`">
        <div class="round"></div>
    </div>
</template>

<style scoped lang="less">
    .box {
        position: relative;
        box-sizing: border-box;
        width: 20px;
        height: 20px;
        display: inline-block;
        background-color: hwb(var(--bg98) / 0.8);
        border: hwb(0 80% 20%) 1px solid;
        border-radius: 10px;
        box-shadow: 0 2px 2px hwb(0 80% 20% / 0.2);
        .round {
            position: absolute;
            left: 5px;
            top: 5px;
            width: 10px;
            height: 10px;
            border-radius: 5px;
            background-color: transparent;
        }
    }
    .boxSelected {
        background-color: hwb(220 25% 10%);
        border: none;
        box-shadow: 0 2px 4px hwb(220 25% 10% / 0.2);
        .round {
            background-color: #FFF;
        }
    }
</style>