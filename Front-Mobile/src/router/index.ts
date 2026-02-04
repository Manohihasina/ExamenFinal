import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/test',
    component: () => import('@/views/TestPage.vue')
  },
  {
    path: '/login',
    component: () => import('@/views/auth/LoginPage.vue')
  },
  {
    path: '/register',
    component: () => import('@/views/auth/RegisterPage.vue')
  },
  {
    path: '/test-firebase',
    component: () => import('@/views/auth/TestFirebase.vue')
  },
  {
    path: '/test-add-car',
    component: () => import('@/views/cars/AddCarTest.vue')
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/home'
      },
      {
        path: 'notifications',
        component: () => import('@/views/notifications/NotificationsPage.vue')
      },
      {
        path: 'home',
        component: () => import('@/views/HomePage.vue')
      },
      {
        path: 'cars',
        component: () => import('@/views/cars/CarsPage.vue')
      },
      {
        path: 'repairs',
        component: () => import('@/views/repairs/RepairsPage.vue')
      },
      {
        path: 'repairs/add',
        component: () => import('@/views/repairs/AddRepairPage.vue')
      },
      {
        path: 'repairs/new',
        component: () => import('@/views/repairs/RepairsPage.vue')
      },
      {
        path: 'repairs/:id',
        component: () => import('@/views/repairs/RepairDetailPage.vue')
      },
      {
        path: 'payment',
        component: () => import('@/views/payment/PaymentPage.vue')
      },
      {
        path: 'profile',
        component: () => import('@/views/profile/ProfilePage.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

// Navigation guard pour protéger les routes
router.beforeEach((to, from, next) => {
  const publicPages = ['/login', '/register', '/test', '/test-firebase', '/test-add-car']
  const authRequired = !publicPages.includes(to.path)
  
  // Simuler une vérification d'authentification (à remplacer avec Firebase Auth)
  const loggedIn = localStorage.getItem('user') !== null
  
  if (authRequired && !loggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router
