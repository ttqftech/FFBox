import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

window.initVueApp = function (params) {
  new Vue({
    render: h => h(App)
  }).$mount('#app')    
}
