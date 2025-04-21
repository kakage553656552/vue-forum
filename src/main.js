import Vue from 'vue'
import App from './App.vue'
import router from './router/index.js'
import axios from 'axios'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import locale from 'element-ui/lib/locale/lang/zh-CN.js'

Vue.config.productionTip = false

// 使用Element UI
Vue.use(ElementUI, { locale })

// 设置axios默认基础URL
axios.defaults.baseURL = 'http://localhost:3000'

// 配置axios拦截器，自动添加token到请求头
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 创建事件总线
Vue.prototype.$eventBus = new Vue();

new Vue({
  router,
  data: {
    isLoggedIn: !!localStorage.getItem('token')
  },
  render: h => h(App)
}).$mount('#app')