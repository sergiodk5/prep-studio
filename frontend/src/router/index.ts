import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'courses',
      component: () => import('@/features/authoring/CourseList.vue'),
    },
    {
      path: '/courses/new',
      name: 'course-new',
      component: () => import('@/features/authoring/CourseCreate.vue'),
    },
    {
      path: '/courses/:id',
      name: 'course',
      component: () => import('@/features/authoring/CourseOutline.vue'),
      props: true,
    },
  ],
})

export default router
