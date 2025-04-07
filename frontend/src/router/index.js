import { createRouter, createWebHistory } from 'vue-router'

// Auth views
import Login from '@/views/auth/Login.vue'

// White Collar views
import Department from '@/views/whitecollar/Department.vue'
import DepartmentDetail from '@/views/whitecollar/DepartmentDetail.vue'
import JobRequisition from '@/views/whitecollar/JobRequisition.vue'
import Candidates from '@/views/whitecollar/Candidates.vue'

// Blue Collar views
import BlueDepartment from '@/views/bluecollar/Department.vue'
import BlueJobRequisition from '@/views/bluecollar/JobRequisition.vue'
import BlueCandidates from '@/views/bluecollar/Candidates.vue'

// Dashboard & Reports
import Dashboard from '@/views/dashboard/Dashboard.vue'
import Reports from '@/views/Reports.vue'

const routes = [
  { path: '/', redirect: '/login' },

  // Public route
  { path: '/login', name: 'Login', component: Login },

  // Dashboard (auth required)
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },

  // White Collar Routes
  { path: '/whitecollar/departments', name: 'WhiteDepartments', component: Department, meta: { requiresAuth: true } },
  { path: '/whitecollar/departments/:id', name: 'DepartmentDetail', component: DepartmentDetail, meta: { requiresAuth: true } },
  { path: '/whitecollar/requisitions', name: 'WhiteJobRequisition', component: JobRequisition, meta: { requiresAuth: true } },
  { path: '/whitecollar/candidates', name: 'WhiteCandidates', component: Candidates, meta: { requiresAuth: true } },

  // Blue Collar Routes
  { path: '/bluecollar/departments', name: 'BlueDepartments', component: BlueDepartment, meta: { requiresAuth: true } },
  { path: '/bluecollar/requisitions', name: 'BlueJobRequisition', component: BlueJobRequisition, meta: { requiresAuth: true } },
  { path: '/bluecollar/candidates', name: 'BlueCandidates', component: BlueCandidates, meta: { requiresAuth: true } },

  // Reports
  { path: '/reports', name: 'Reports', component: Reports, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ✅ Global Auth Guard
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
