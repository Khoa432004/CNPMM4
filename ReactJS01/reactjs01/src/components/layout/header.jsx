import React, { useContext, useState } from 'react';
import { UsergroupAddOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth.context';

const HeaderComponent = () => {
    const navigate = useNavigate();
    const { auth, setAuth } = useContext(AuthContext);
    const items = [
        {
            label: <Link to={"/"}>Home Page</Link>,
            key: 'home',
            icon: <HomeOutlined />,
        },
        ...(auth.isAuthenticated ? [
            {
                label: <Link to={"/user"}>Users</Link>,
                key: 'user',
                icon: <UsergroupAddOutlined />,
            }
        ] : []),
        {
            label: `Welcome ${auth?.user?.email ?? ""}`,
            key: 'SubMenu',
            icon: <SettingOutlined />,
            children: auth.isAuthenticated ? [
                {
                    label: 'Logout',
                    key: 'logout',
                    onClick: () => {
                        localStorage.removeItem('access_token');
                        setAuth({
                            isAuthenticated: false,
                            user: {
                                email: "",
                                name: ""
                            },
                            access_token: null,
                        });
                        navigate("/");
                    }
                }
            ] : []
        },
        ...(!auth.isAuthenticated ? [
            {
                label: <Link to={"/login"}>Đăng nhập</Link>,
                key: 'login',
            },
            {
                label: <Link to={"/register"}>Đăng ký</Link>,
                key: 'register',
            }
        ] : [])
    ];

    const [current, setCurrent] = useState('mail');
    const onClick = (e) => {
        setCurrent(e.key);
    };

    return (
        <Menu
            onClick={onClick}
            selectedKeys={[current]}
            mode="horizontal"
            items={items}
        />
    );
};

export default HeaderComponent;

