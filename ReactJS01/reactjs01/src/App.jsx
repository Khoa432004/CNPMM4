import { Outlet } from 'react-router-dom';
import HeaderComponent from './components/layout/header';
import axios from './util/axios.customize';
import { useContext, useEffect } from 'react';
import { AuthContext } from './components/context/auth.context';
import { Spin } from 'antd';

function App() {
  const { auth, setAuth, appLoading, setAppLoading } = useContext(AuthContext);

  useEffect(() => {
    const fetchAccount = async () => {
      setAppLoading(true);
      const res = await axios.get('/v1/api/account');
      if (res && res.EC === 0) {
        setAuth((prev) => ({
          ...prev,
          isAuthenticated: true,
          user: {
            email: res?.DT?.email ?? '',
            name: res?.DT?.name ?? '',
          },
        }));
      }
      setAppLoading(false);
    };

    if (auth?.access_token) {
      fetchAccount();
    } else {
      setAppLoading(false);
    }
  }, [auth?.access_token, setAuth, setAppLoading]);

  return (
    <div>
      {appLoading === true ? (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Spin />
        </div>
      ) : (
        <>
          <HeaderComponent />
          <Outlet />
        </>
      )}
    </div>
  );
}

export default App;
