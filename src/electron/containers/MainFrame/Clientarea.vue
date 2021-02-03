<template>
	<div id="clientarea">
        <sidebar></sidebar>
        <maincontent></maincontent>
	</div>
</template>

<script>

import Sidebar from './Clientarea/Sidebar'
import Maincontent from './Clientarea/Maincontent'

export default {
	name: 'Clientarea',
	components: {
		Sidebar, Maincontent
	},
	props: {
		
	},
	methods: {
	}
}
</script>

<style scoped>
    #clientarea {
        position: relative;
        height: calc(100% - 28px - 24px);
    }
</style>
