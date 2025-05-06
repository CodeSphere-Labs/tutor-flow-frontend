import { createRoot } from 'react-dom/client';
import { allSettled, fork } from 'effector';
import { createBrowserHistory } from 'history';
import { Provider } from 'effector-react';
import { router } from './shared/routing';
import { App } from '@/app/App';

const root = createRoot(document.getElementById('root')!);

async function render() {
  const scope = fork();

  await allSettled(router.setHistory, {
    scope,
    params: createBrowserHistory()
  });

  root.render(
    <Provider value={scope}>
      <App />
    </Provider>
  );
}

render();
