import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import VueApexCharts from 'vue3-apexcharts'
import '@fortawesome/fontawesome-free/css/all.css'
import GlobalLoader from './components/GlobalLoader.vue'


// ✅ Correct order
const app = createApp(App)
app.component('GlobalLoader', GlobalLoader)

app.use(router)
app.use(vuetify)
app.component('apexchart', VueApexCharts)

app.mount('#app')
