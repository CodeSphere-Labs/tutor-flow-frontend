import { RouterProvider } from '@argon-router/react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { Suspense } from 'react';

import { Pages } from '@/pages';
import { router } from '@/shared/routing/index';
import { LoadingPage } from '@/shared/ui/LoadingPage/LoadingPage';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

export const App = () => {
  return (
    <RouterProvider router={router}>
      <MantineProvider>
        <ModalsProvider>
          <Notifications zIndex={1005} />
          <Suspense fallback={<LoadingPage />}>
            <Pages />
          </Suspense>
        </ModalsProvider>
      </MantineProvider>
    </RouterProvider>
  );
};
