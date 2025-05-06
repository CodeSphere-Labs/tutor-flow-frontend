import type { Effect, Event } from 'effector';

import { chainRoute, Route, RouteOpenedPayload } from '@argon-router/core';
import { combine, createEvent, createStore, sample } from 'effector';

import type { ParseUrlParams } from '@argon-router/paths';

import { logoutQuery, sessionQuery } from '@/shared/session/api';
import { ResponseUserDto } from '@/shared/api/types';

enum AuthStatus {
  Initial,
  Pending,
  Anonymous,
  Authenticated
}

export const $user = createStore<ResponseUserDto | null>(null, { name: 'user info' });
export const $sessionPending = combine(sessionQuery.$pending, (sessionPending) => sessionPending);
const $authenticationStatus = createStore(AuthStatus.Initial);

export const userLogouted = createEvent();

// Логика обработки аутентификации:
// 1. При первом запросе статус Initial -> Pending
// 2. При успешном запросе статус -> Authenticated
// 3. При успешном обновлении токена статус -> Authenticated и запускается sessionQuery
// 4. При ошибке обновления токена статус -> Anonymous

$authenticationStatus.on(sessionQuery.$succeeded, (status) => {
  if (status === AuthStatus.Initial) return AuthStatus.Pending;
  return status;
});

$user.on(sessionQuery.$data, (_, user) => user);

$authenticationStatus.on(sessionQuery.finished.success, () => AuthStatus.Authenticated);

sample({
  clock: userLogouted,
  source: $user,
  filter: (user) => user !== null,
  fn: (user) => user!.id,
  target: logoutQuery.start
});

$authenticationStatus.on(logoutQuery.finished.success, () => AuthStatus.Anonymous);
$user.on(logoutQuery.finished.success, () => null);

sample({
  clock: logoutQuery.finished.success,
  target: sessionQuery.start
});

// sample({
//   clock: logoutQuery.finished.failure,
//   target: showError('Ошибка при попытке выйти')
// });

// eslint-disable-next-line unused-imports/no-unused-vars
interface ChainParams<T extends string, Params = ParseUrlParams<T>> {
  otherwise?: Effect<void, any, any> | Event<void>;
}

/**
 * Функция для защиты маршрутов, требующих аутентификации
 *
 * Логика работы:
 * 1. При переходе на маршрут проверяется статус аутентификации
 * 2. Если пользователь уже аутентифицирован, маршрут открывается
 * 3. Если статус Initial, запускается sessionQuery
 * 4. Если sessionQuery завершается успешно, маршрут открывается
 * 5. Если sessionQuery завершается с ошибкой, маршрут не открывается и выполняется otherwise
 */
export const chainAuthorized = <T extends string, Params = ParseUrlParams<T>>(
  route: Route<Params>,
  { otherwise }: ChainParams<T, Params> = {}
): Route<Params> => {
  const sessionCheckStarted = createEvent<RouteOpenedPayload<Params>>();
  const sessionReceivedAnonymous = createEvent<RouteOpenedPayload<Params>>();

  const alreadyAuthenticated = sample({
    clock: sessionCheckStarted,
    source: $authenticationStatus,
    filter: (status) => status === AuthStatus.Authenticated
  });

  const alreadyAnonymous = sample({
    clock: sessionCheckStarted,
    source: $authenticationStatus,
    filter: (status) => status === AuthStatus.Anonymous
  });

  sample({
    clock: sessionCheckStarted,
    source: $authenticationStatus,
    filter: (status) => status === AuthStatus.Initial,
    target: sessionQuery.start
  });

  sample({
    clock: [alreadyAnonymous, sessionQuery.finished.failure],
    source: route.$params,
    filter: route.$isOpened,
    fn: (params: Params) => ({ params }) as RouteOpenedPayload<Params>,
    target: sessionReceivedAnonymous
  });

  if (otherwise) {
    sample({
      clock: sessionReceivedAnonymous,
      target: otherwise as Effect<void, any, any>
    });
  }

  return chainRoute({
    route,
    beforeOpen: sessionCheckStarted,
    openOn: [alreadyAuthenticated, sessionQuery.finished.success],
    cancelOn: sessionReceivedAnonymous
  });
};

/**
 * Функция для защиты маршрутов, доступных только неаутентифицированным пользователям
 *
 * Логика работы:
 * 1. При переходе на маршрут проверяется статус аутентификации
 * 2. Если пользователь не аутентифицирован, маршрут открывается
 * 3. Если статус Initial, запускается sessionQuery
 * 4. Если sessionQuery завершается с ошибкой, маршрут открывается
 * 5. Если sessionQuery завершается успешно, маршрут не открывается и выполняется otherwise
 */
export const chainAnonymous = <T extends string, Params = ParseUrlParams<T>>(
  route: Route<Params>,
  { otherwise }: ChainParams<T, Params> = {}
): Route<Params> => {
  const sessionCheckStarted = createEvent<RouteOpenedPayload<Params>>();
  const sessionReceivedAuthenticated = createEvent<RouteOpenedPayload<Params>>();

  const alreadyAuthenticated = sample({
    clock: sessionCheckStarted,
    source: $authenticationStatus,
    filter: (status) => status === AuthStatus.Authenticated
  });

  const alreadyAnonymous = sample({
    clock: sessionCheckStarted,
    source: $authenticationStatus,
    filter: (status) => status === AuthStatus.Anonymous
  });

  sample({
    clock: sessionCheckStarted,
    source: $authenticationStatus,
    filter: (status) => status === AuthStatus.Initial,
    target: sessionQuery.start
  });

  sample({
    source: route.$params,
    clock: [alreadyAuthenticated, sessionQuery.finished.success],
    filter: route.$isOpened,
    fn: (params: Params) => ({ params }) as RouteOpenedPayload<Params>,
    target: sessionReceivedAuthenticated
  });

  if (otherwise) {
    sample({
      clock: sessionReceivedAuthenticated,
      target: otherwise as Effect<void, any, any>
    });
  }

  return chainRoute({
    route,
    beforeOpen: sessionCheckStarted,
    openOn: [alreadyAnonymous, sessionQuery.finished.failure],
    cancelOn: sessionReceivedAuthenticated
  });
};

export const chainRole = <T extends string, Params = ParseUrlParams<T>>(
  route: Route<Params>,
  roles: string[],
  { otherwise }: ChainParams<T, Params> = {}
): Route<Params> => {
  const roleCheckStarted = createEvent<RouteOpenedPayload<Params>>();

  sample({
    clock: route.opened,
    target: roleCheckStarted
  });

  const roleCheckSuccess = sample({
    clock: roleCheckStarted,
    source: $user,
    filter: (user) => user !== null && roles.includes(user.role)
  });

  const roleCheckFailure = sample({
    clock: roleCheckStarted,
    source: $user,
    filter: (user) => user !== null && !roles.includes(user.role)
  });

  if (otherwise) {
    sample({
      clock: roleCheckFailure,
      target: otherwise as Effect<void, any, any>
    });
  }

  return chainRoute({
    route,
    beforeOpen: roleCheckStarted,
    openOn: [roleCheckSuccess],
    cancelOn: roleCheckFailure
  });
};
