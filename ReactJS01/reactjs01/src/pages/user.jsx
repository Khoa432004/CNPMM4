import { notification, Table, Spin } from 'antd';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getUserApi } from '../util/api';

const UserPage = () => {
    const [dataSource, setDataSource] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false
    });
    const observerTarget = useRef(null);

    const fetchUsers = useCallback(async (page = 1, limit = 10, append = false) => {
        setLoading(true);
        try {
            const res = await getUserApi(page, limit);
            if (res && res.EC === 0) {
                const { users, pagination: paginationData } = res.DT;
                if (append) {
                    setDataSource(prev => [...prev, ...users]);
                } else {
                    setDataSource(users);
                }
                setPagination(paginationData);
            } else {
                notification.error({
                    message: 'Lỗi',
                    description: res?.EM || 'Không thể lấy danh sách người dùng',
                });
            }
        } catch (error) {
            notification.error({
                message: 'Lỗi',
                description: error?.response?.data?.EM || error?.message || 'Có lỗi xảy ra khi tải dữ liệu',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers(1, 10, false);
    }, [fetchUsers]);

    useEffect(() => {
        if (!pagination.hasNextPage) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && pagination.hasNextPage && !loading) {
                    const nextPage = pagination.currentPage + 1;
                    fetchUsers(nextPage, pagination.itemsPerPage, true);
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [pagination, loading, fetchUsers]);

    const columns = [
        {
            title: 'STT',
            key: 'index',
            width: 80,
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Email',
            dataIndex: 'email',
        },
        {
            title: 'Name',
            dataIndex: 'name',
        },
        {
            title: 'Role',
            dataIndex: 'role',
        },
    ];

    return (
        <div style={{ padding: 30 }}>
            <Table
                bordered
                dataSource={dataSource}
                columns={columns}
                rowKey="_id"
                pagination={false}
            />
            <div ref={observerTarget} style={{ textAlign: 'center', padding: '20px' }}>
                {loading && <Spin size="large" />}
                {!pagination.hasNextPage && pagination.totalItems > 0 && (
                    <p style={{ color: '#999', marginTop: '10px' }}>Đã tải hết dữ liệu ({pagination.totalItems} người dùng)</p>
                )}
            </div>
        </div>
    );
};

export default UserPage;
