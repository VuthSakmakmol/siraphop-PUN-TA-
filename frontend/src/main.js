import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import VueApexCharts from 'vue3-apexcharts'

// ✅ Correct order
const app = createApp(App)

app.use(router)
app.use(vuetify)
app.component('apexchart', VueApexCharts)

app.mount('#app')
