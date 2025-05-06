import { Loader } from '@mantine/core';

import classes from './styles.module.css';

export const LoadingPage = () => {
  return (
    <div className={classes.main}>
      <Loader color='blue' />
    </div>
  );
};
