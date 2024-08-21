import { Link } from 'react-router-dom';
import useToken from './Authentication/hooks/useToken';
import classes from './NavigationBar.module.css';
import { getLocalStorage } from './Authentication/hooks/localStorage';
import Logout from './Authentication/Logout';

const MainNavigation = () => {
  const token = useToken();
  const isAuthenticated = !!token;
  const firstName = getLocalStorage('FirstName')
  const lastName = getLocalStorage('LastName')

  return (
    <header className={classes.header}>
      <Link to='/*'>
        <div className={classes.logo}>AlfAdvisor</div>
      </Link>
      <nav>
        <ul>
          <li>
            {isAuthenticated ? <Link to='/farm' style={{ color: 'black', fontWeight: 'bold' }}>Dashboard</Link> : <div></div>}
          </li>
          <li>
            {isAuthenticated ? <div style={{ color: 'black', fontWeight: 'bold' }}>Hello {firstName}{' '}{lastName}</div> : <Link to='/auth/login'>Login</Link>}
          </li>
          <li>
            {isAuthenticated ? <Logout /> : <Link to='/auth/register'>Sign Up</Link>}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default MainNavigation;