import React from 'react';
import { Button, Col, Divider, Form, Input, notification, Row } from 'antd';
import { createUserApi } from '../util/api';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';

const RegisterPage = () => {
    const navigate = useNavigate();

    const onFinish = async (values) => {
        const { name, email, password } = values;
        const res = await createUserApi(name, email, password);

        if (res && res.EC === 0) {
            notification.success({
                message: 'CREATE USER',
                description: res.EM,
            });
            navigate('/login');
        } else {
            notification.error({
                message: 'CREATE USER',
                description: res?.EM || 'Error',
            });
        }
    };

    return (
        <Row justify={"center"} style={{ marginTop: '30px' }}>
            <Col xs={24} md={16} lg={8}>
                <fieldset
                    style={{
                        padding: '15px',
                        margin: '5px',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                    }}
                >
                    <legend>Đăng Ký Tài Khoản</legend>
                    <Form
                        name="register"
                        onFinish={onFinish}
                        autoComplete="off"
                        layout="vertical"
                    >
                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập email!',
                                },
                                {
                                    type: 'email',
                                    message: 'Email không hợp lệ!',
                                },
                                {
                                    max: 100,
                                    message: 'Email không được vượt quá 100 ký tự!',
                                },
                            ]}
                        >
                            <Input placeholder="Nhập email của bạn" />
                        </Form.Item>

                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập mật khẩu!',
                                },
                                {
                                    min: 6,
                                    message: 'Mật khẩu phải có ít nhất 6 ký tự!',
                                },
                                {
                                    max: 50,
                                    message: 'Mật khẩu không được vượt quá 50 ký tự!',
                                },
                                {
                                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                    message: 'Mật khẩu phải có chữ hoa, chữ thường và số!',
                                },
                            ]}
                        >
                            <Input.Password placeholder="Nhập mật khẩu của bạn" />
                        </Form.Item>

                        <Form.Item
                            label="Confirm Password"
                            name="confirm"
                            dependencies={['password']}
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập lại mật khẩu!',
                                },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Mật khẩu không trùng khớp!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password />
                        </Form.Item>

                        <Form.Item
                            label="Name"
                            name="name"
                            rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập tên!',
                                },
                                {
                                    min: 2,
                                    message: 'Tên phải có ít nhất 2 ký tự!',
                                },
                                {
                                    max: 50,
                                    message: 'Tên không được vượt quá 50 ký tự!',
                                },
                                {
                                    pattern: /^[a-zA-ZÀ-ỹ\s]+$/,
                                    message: 'Tên chỉ được chứa chữ cái và khoảng trắng!',
                                },
                            ]}
                        >
                            <Input placeholder="Nhập tên của bạn" />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                Submit
                            </Button>
                        </Form.Item>
                    </Form>
                    <Link to="/">
                        <ArrowLeftOutlined /> Quay lại trang chủ
                    </Link>
                    <Divider />
                    <div style={{ textAlign: 'center' }}>
                        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                    </div>
                </fieldset>
            </Col>
        </Row>
    );
};

export default RegisterPage;

