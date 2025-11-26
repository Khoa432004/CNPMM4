import { notification, Table, Spin, Input, Select, DatePicker, Button, Space, Row, Col, Card } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getUserApi, searchUserApi } from '../util/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

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
    
    // Search filters state
    const [searchFilters, setSearchFilters] = useState({
        keyword: '',
        role: '',
        createdFrom: null,
        createdTo: null,
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });
    
    const [isSearching, setIsSearching] = useState(false);
    const observerTarget = useRef(null);
    const searchTimeoutRef = useRef(null);
    const isFirstMount = useRef(true);

    const fetchUsers = useCallback(async (page = 1, limit = 10, append = false, filters = null) => {
        setLoading(true);
        try {
            // Luôn sử dụng searchUserApi để hỗ trợ đầy đủ sort và filter
            // Nếu không có filters, truyền empty filters
            const searchParams = {
                keyword: filters?.keyword || '',
                role: filters?.role || '',
                createdFrom: filters?.createdFrom || null,
                createdTo: filters?.createdTo || null,
                page,
                limit,
                sortBy: filters?.sortBy || 'createdAt',
                sortOrder: filters?.sortOrder || 'desc'
            };
            
            // Chuyển đổi date sang string format
            if (searchParams.createdFrom) {
                searchParams.createdFrom = dayjs(searchParams.createdFrom).format('YYYY-MM-DD');
            }
            if (searchParams.createdTo) {
                searchParams.createdTo = dayjs(searchParams.createdTo).format('YYYY-MM-DD');
            }
            
            // Kiểm tra xem có filter nào không để hiển thị trạng thái
            const hasActiveFilters = searchParams.keyword?.trim() || 
                                    searchParams.role || 
                                    searchParams.createdFrom || 
                                    searchParams.createdTo;
            setIsSearching(hasActiveFilters);
            
            const res = await searchUserApi(searchParams);

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

    // Initial load
    useEffect(() => {
        fetchUsers(1, 10, false, searchFilters);
        isFirstMount.current = false;
    }, []); // Chỉ chạy lần đầu

    // Debounce cho keyword search
    useEffect(() => {
        // Skip lần đầu mount
        if (isFirstMount.current) return;

        // Clear timeout cũ nếu có
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Debounce 500ms cho keyword
        const timeoutId = setTimeout(() => {
            fetchUsers(1, 10, false, searchFilters);
        }, 500);

        searchTimeoutRef.current = timeoutId;

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [searchFilters.keyword]);

    // Fetch ngay khi các filter khác thay đổi (không debounce)
    useEffect(() => {
        // Skip lần đầu mount
        if (isFirstMount.current) return;

        // Clear timeout của keyword nếu có (vì filter khác thay đổi)
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
        }

        fetchUsers(1, 10, false, searchFilters);
    }, [searchFilters.role, searchFilters.createdFrom, searchFilters.createdTo, searchFilters.sortBy, searchFilters.sortOrder]);

    useEffect(() => {
        if (!pagination.hasNextPage) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && pagination.hasNextPage && !loading) {
                    const nextPage = pagination.currentPage + 1;
                    fetchUsers(nextPage, pagination.itemsPerPage, true, searchFilters);
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
    }, [pagination, loading, searchFilters]);

    const handleKeywordChange = (e) => {
        setSearchFilters(prev => ({
            ...prev,
            keyword: e.target.value
        }));
    };

    const handleRoleChange = (value) => {
        setSearchFilters(prev => ({
            ...prev,
            role: value || ''
        }));
    };

    const handleDateRangeChange = (dates) => {
        setSearchFilters(prev => ({
            ...prev,
            createdFrom: dates ? dates[0] : null,
            createdTo: dates ? dates[1] : null
        }));
    };

    const handleSortChange = (sortBy, sortOrder) => {
        setSearchFilters(prev => ({
            ...prev,
            sortBy,
            sortOrder
        }));
    };

    const handleResetFilters = () => {
        setSearchFilters({
            keyword: '',
            role: '',
            createdFrom: null,
            createdTo: null,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });
    };

    const handleColumnSort = (columnName) => {
        // Toggle sort order: nếu đang sort theo column này thì đổi order, nếu không thì set asc
        if (searchFilters.sortBy === columnName) {
            // Đang sort theo column này, toggle order
            const newOrder = searchFilters.sortOrder === 'asc' ? 'desc' : 'asc';
            handleSortChange(columnName, newOrder);
        } else {
            // Chưa sort theo column này, set asc
            handleSortChange(columnName, 'asc');
        }
    };

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
            key: 'email',
            sorter: true, // Cho phép hiển thị icon sort
            sortOrder: searchFilters.sortBy === 'email' ? 
                (searchFilters.sortOrder === 'asc' ? 'ascend' : 'descend') : 
                null,
            onHeaderCell: () => ({
                onClick: (e) => {
                    e.stopPropagation();
                    handleColumnSort('email');
                },
                style: { cursor: 'pointer' }
            })
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            sortOrder: searchFilters.sortBy === 'name' ? 
                (searchFilters.sortOrder === 'asc' ? 'ascend' : 'descend') : 
                null,
            onHeaderCell: () => ({
                onClick: (e) => {
                    e.stopPropagation();
                    handleColumnSort('name');
                },
                style: { cursor: 'pointer' }
            })
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            sorter: true,
            sortOrder: searchFilters.sortBy === 'role' ? 
                (searchFilters.sortOrder === 'asc' ? 'ascend' : 'descend') : 
                null,
            onHeaderCell: () => ({
                onClick: (e) => {
                    e.stopPropagation();
                    handleColumnSort('role');
                },
                style: { cursor: 'pointer' }
            })
        },
    ];

    return (
        <div style={{ padding: 30 }}>
            <Card 
                title="Tìm kiếm người dùng" 
                style={{ marginBottom: 20 }}
                extra={
                    <Button 
                        icon={<ReloadOutlined />} 
                        onClick={handleResetFilters}
                    >
                        Reset
                    </Button>
                }
            >
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Input
                            placeholder="Tìm kiếm theo tên hoặc email..."
                            prefix={<SearchOutlined />}
                            value={searchFilters.keyword}
                            onChange={handleKeywordChange}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Select
                            placeholder="Lọc theo role"
                            style={{ width: '100%' }}
                            value={searchFilters.role || undefined}
                            onChange={handleRoleChange}
                            allowClear
                        >
                            <Option value="User">User</Option>
                            <Option value="Admin">Admin</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <RangePicker
                            style={{ width: '100%' }}
                            placeholder={['Từ ngày', 'Đến ngày']}
                            value={searchFilters.createdFrom && searchFilters.createdTo 
                                ? [dayjs(searchFilters.createdFrom), dayjs(searchFilters.createdTo)]
                                : null
                            }
                            onChange={handleDateRangeChange}
                            format="DD/MM/YYYY"
                        />
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Select
                            placeholder="Sắp xếp theo"
                            style={{ width: '100%' }}
                            value={searchFilters.sortBy && searchFilters.sortOrder 
                                ? `${searchFilters.sortBy}-${searchFilters.sortOrder}` 
                                : undefined
                            }
                            onChange={(value) => {
                                if (value) {
                                    const [sortBy, sortOrder] = value.split('-');
                                    handleSortChange(sortBy, sortOrder);
                                }
                            }}
                            allowClear
                        >
                            <Option value="createdAt-desc">Mới nhất</Option>
                            <Option value="createdAt-asc">Cũ nhất</Option>
                            <Option value="name-asc">Tên A-Z</Option>
                            <Option value="name-desc">Tên Z-A</Option>
                            <Option value="email-asc">Email A-Z</Option>
                            <Option value="email-desc">Email Z-A</Option>
                            <Option value="role-asc">Role A-Z</Option>
                            <Option value="role-desc">Role Z-A</Option>
                        </Select>
                    </Col>
                </Row>
            </Card>

            {isSearching && (
                <div style={{ marginBottom: 16, color: '#1890ff', fontSize: 14 }}>
                    🔍 Đang tìm kiếm với bộ lọc...
                </div>
            )}

            <Table
                bordered
                dataSource={dataSource}
                columns={columns}
                rowKey="_id"
                pagination={false}
                loading={loading}
                onChange={(pagination, filters, sorter) => {
                    // Xử lý khi user click vào sorter (backup handler)
                    // Chính được xử lý trong onHeaderCell onClick
                    if (sorter) {
                        const sortInfo = Array.isArray(sorter) ? sorter[0] : sorter;
                        if (sortInfo) {
                            const columnName = sortInfo.columnKey || sortInfo.field || sortInfo.dataIndex;
                            if (columnName) {
                                handleColumnSort(columnName);
                            }
                        }
                    }
                }}
            />
            <div ref={observerTarget} style={{ textAlign: 'center', padding: '20px' }}>
                {loading && <Spin size="large" />}
                {!pagination.hasNextPage && pagination.totalItems > 0 && (
                    <p style={{ color: '#999', marginTop: '10px' }}>
                        Đã tải hết dữ liệu ({pagination.totalItems} người dùng)
                    </p>
                )}
                {!loading && pagination.totalItems === 0 && (
                    <p style={{ color: '#999', marginTop: '10px' }}>
                        Không tìm thấy kết quả nào
                    </p>
                )}
            </div>
        </div>
    );
};

export default UserPage;
