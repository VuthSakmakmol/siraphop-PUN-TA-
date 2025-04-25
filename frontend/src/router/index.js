import { createRouter, createWebHistory } from 'vue-router'

// 🔐 Auth
import Login from '@/views/auth/Login.vue'

// 👔 White Collar
import Department from '@/views/whitecollar/Department.vue'
import DepartmentDetail from '@/views/whitecollar/DepartmentDetail.vue'
import JobRequisition from '@/views/whitecollar/JobRequisition.vue'
import Candidates from '@/views/whitecollar/Candidates.vue'
import WhiteCollarDashboard from '@/views/whitecollar/dashboard/Dashboard.vue'
import WhiteCollarCandidateDetail from '@/views/whitecollar/CandidateDetail.vue'

// 👷 Blue Collar
import BlueDepartment from '@/views/bluecollar/Department.vue'
import BlueJobRequisition from '@/views/bluecollar/JobRequisition.vue'
import BlueCandidates from '@/views/bluecollar/Candidates.vue'
import BlueCollarDashboard from '@/views/bluecollar/dashboard/Dashboard.vue'
import BlueCollarCandidateDetail from '@/views/bluecollar/CandidateDetail.vue'

// 📊 General Dashboard + Reports
import Dashboard from '@/views/dashboard/Dashboard.vue'
import Reports from '@/views/Reports.vue'

const routes = [
  { path: '/', redirect: '/login' },

  // 🔐 Public
  { path: '/login', name: 'Login', component: Login },

  // 📊 Dashboards
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/whitecollar/dashboard', name: 'WhiteCollarDashboard', component: WhiteCollarDashboard, meta: { requiresAuth: true } },
  { path: '/bluecollar/dashboard', name: 'BlueCollarDashboard', component: BlueCollarDashboard, meta: { requiresAuth: true } },

  // 👔 White Collar
  { path: '/whitecollar/departments', name: 'WhiteDepartments', component: Department, meta: { requiresAuth: true } },
  { path: '/whitecollar/departments/:id', name: 'DepartmentDetail', component: DepartmentDetail, meta: { requiresAuth: true } },
  { path: '/whitecollar/requisitions', name: 'WhiteJobRequisition', component: JobRequisition, meta: { requiresAuth: true } },
  { path: '/whitecollar/candidates', name: 'WhiteCandidates', component: Candidates, meta: { requiresAuth: true } },
  { path: '/whitecollar/candidates/:id', name: 'WhiteCollarCandidateDetail', component: WhiteCollarCandidateDetail, meta: { requiresAuth: true } },

  // 👷 Blue Collar
  { path: '/bluecollar/departments', name: 'BlueDepartments', component: BlueDepartment, meta: { requiresAuth: true } },
  { path: '/bluecollar/departments/:id', name: 'BlueCollarDepartmentDetail', component: () => import('@/views/bluecollar/DepartmentDetail.vue'), meta: { requiresAuth: true } },
  { path: '/bluecollar/requisitions', name: 'BlueJobRequisition', component: BlueJobRequisition, meta: { requiresAuth: true } },
  { path: '/bluecollar/candidates', name: 'BlueCandidates', component: BlueCandidates, meta: { requiresAuth: true } },
  { path: '/bluecollar/candidates/:id', name: 'BlueCollarCandidateDetail', component: BlueCollarCandidateDetail, meta: { requiresAuth: true } },

  // 📄 Reports
  { path: '/reports', name: 'Reports', component: Reports, meta: { requiresAuth: true } },

  // Roadmap
  {
    path: '/roadmap',
    name: 'Roadmap',
    component: () => import('@/views/Roadmap.vue'),
  },
  
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 🔐 Global Auth Guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
