import { eslint } from '@zeroqs/eslint';

export default eslint({
  typescript: true,
  react: true,
  effector: true,

  rules: {
    'react/function-component-definition': 'warn'
  }
});
