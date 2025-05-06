import { createRoute, createRouter } from '@argon-router/core';

export const routes = {
  home: createRoute({ path: '/' })
};

export const router = createRouter({
  routes: [routes.home]
});
