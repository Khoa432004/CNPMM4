import React from 'react';
import { Button, Col, Divider, Form, Input, notification, Row } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { forgotPasswordApi } from '../util/api';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();

    const onFinish = async (values) => {
        const { email } = values;
        const res = await forgotPasswordApi(email);

        if (res && res.EC === 0) {
            notification.success({
                message: 'FORGOT PASSWORD',
                description: res.EM || 'Mật khẩu mới đã được gửi qua email của bạn',
            });
            navigate('/login');
        } else {
            notification.error({
                message: 'FORGOT PASSWORD',
                description: res?.EM || 'Có lỗi xảy ra',
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
                    <legend>Quên mật khẩu</legend>
                    <Form
                        name="forgot-password"
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
                                    message: 'Vui lòng nhập email của bạn!',
                                },
                            ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                Lấy mật khẩu mới
                            </Button>
                        </Form.Item>
                    </Form>
                    <Link to="/login">
                        <ArrowLeftOutlined /> Quay lại đăng nhập
                    </Link>
                    <Divider />
                    <div style={{ textAlign: 'center' }}>
                        Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
                    </div>
                </fieldset>
            </Col>
        </Row>
    );
};

export default ForgotPasswordPage;
