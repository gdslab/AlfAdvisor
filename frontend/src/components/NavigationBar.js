import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useToken from './Authentication/hooks/useToken';
import classes from './NavigationBar.module.css';
import { getLocalStorage } from './Authentication/hooks/localStorage';
import Logout from './Authentication/Logout';

const MainNavigation = () => {
  const token = useToken();
  const isAuthenticated = !!token;
  const firstName = getLocalStorage('FirstName');
  const lastName = getLocalStorage('LastName');
  const [isSuperuser, setIsSuperuser] = useState(false);

  useEffect(() => {
    const checkSuperuser = async () => {
      try {
        const response = await fetch('/alfalfa/auth/check-superuser', {
          method: 'GET',
          headers: {
            'Content-type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsSuperuser(data.is_superuser); // Expecting `{ is_superuser: true }`
        }
      } catch (error) {
        console.error('Error checking superuser status:', error);
      }
    };

    if (isAuthenticated) {
      checkSuperuser();
    }
  }, [isAuthenticated, token]);

  return (
    <header className={classes.header}>
      <Link to="/">
        <div className={classes.logo}>AlfAdvisor</div>
      </Link>
      <nav>
        <ul>
          {isAuthenticated && isSuperuser && (
            <li>
              <Link to="/manage-users" className={classes.navLink}>
                Manage Users
              </Link>
            </li>
          )}

          <li>
            {isAuthenticated ? (
              <Link to="/farm" className={classes.navLink}>
                Dashboard
              </Link>
            ) : null}
          </li>

          {/* Documentation Dropdown */}
          <li className={classes.dropdown}>
            <button className={classes.dropbtn}>Documentation</button>
            <div className={classes.dropdownContent}>
              <Link
                to="/documentation_aboutus"
                className={classes.dropdownLink}
              >
                {' '}
                About Us{' '}
              </Link>
              <Link
                to="/documentation_researchgroup"
                className={classes.dropdownLink}
              >
                Research Group
              </Link>
              <Link
                to="/documentation_yieldQuality"
                className={classes.dropdownLink}
              >
                Yield &amp; Quality Model
              </Link>
              <Link
                to="/documentation_EconomicModel"
                className={classes.dropdownLink}
              >
                Economic Model
              </Link>
            </div>
          </li>
          {/* User Manual Dropdown */}
          <li className={classes.dropdown}>
            <button className={classes.dropbtn}>User Manual</button>
            <div className={classes.dropdownContent}>
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="/AlfAdvisor_Tutorial.pdf"
                download
                className={classes.dropdownLink}
              >
                Written Guide (PDF)
              </a>
              <a
                rel="noopener noreferrer"
                target="_blank"
                href="https://youtu.be/VEnt_9CTVzA"
                className={classes.dropdownLink}
              >
                Video Guide
              </a>
            </div>
          </li>
          <li>
            {isAuthenticated ? (
              <div className={classes.navLink}>
                Hello {firstName} {lastName}
              </div>
            ) : (
              <Link to="/auth/login" className={classes.navLink}>
                Login
              </Link>
            )}
          </li>
          <li>
            {isAuthenticated ? (
              <Logout />
            ) : (
              <Link to="/auth/register" className={classes.navLink}>
                Sign Up
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default MainNavigation;
