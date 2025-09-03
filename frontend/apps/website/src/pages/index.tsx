import React from 'react';
import { useTranslation } from 'react-i18next';

import styles from './index.module.css';

export function Index(): React.JSX.Element {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string): void => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className={styles.page}>
      <div className="wrapper">
        <div className="container">
          <div id="welcome">
            <h1>
              <span> {t('greeting')} </span>
            </h1>
            <div>
              <button onClick={() => changeLanguage('en')}>English</button>
              <button onClick={() => changeLanguage('am')}>Amharic</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Index;
