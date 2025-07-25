import React from 'react';
import styles from '../styles/Navigation.module.css';

interface NavigationProps {
  currentPage: 'issues' | 'calendar';
}

const Navigation: React.FC<NavigationProps> = ({ currentPage }) => {
  return (
    <nav className={styles.navigation}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <h1 className={styles.title}>Jira Dashboard</h1>
        </div>
        <div className={styles.tabs}>
          <a 
            href="/" 
            className={currentPage === 'issues' ? styles.tabLinkActive : styles.tabLink}
          >
            📋 Issues
          </a>
          <a 
            href="/calendar" 
            className={currentPage === 'calendar' ? styles.tabLinkActive : styles.tabLink}
          >
            📅 Calendario
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;