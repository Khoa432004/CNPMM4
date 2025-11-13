import { createContext, useEffect, useState } from 'react';

const AuthContext = createContext({
    isAuthenticated: false,
    user: {
        email: "",
        name: "",
    },
    access_token: null,
    appLoading: true,
});

const AuthWrapper = (props) => {
    const [auth, setAuth] = useState({
        isAuthenticated: false,
        user: {
            email: "",
            name: "",
        },
        access_token: localStorage.getItem('access_token'),
    });
    const [appLoading, setAppLoading] = useState(!!localStorage.getItem('access_token'));

    useEffect(() => {
        if (auth?.access_token) {
            localStorage.setItem('access_token', auth.access_token);
        } else {
            localStorage.removeItem('access_token');
        }
    }, [auth?.access_token]);

    return (
        <AuthContext.Provider value={{ auth, setAuth, appLoading, setAppLoading }}>
            {props.children}
        </AuthContext.Provider>
    );
};

export { AuthWrapper, AuthContext };

