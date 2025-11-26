require("dotenv").config();
const User = require("../models/user");

/**
 * Elasticsearch Service - Tùy chọn sử dụng Elasticsearch cho tìm kiếm nâng cao
 * 
 * Để sử dụng service này, bạn cần:
 * 1. Cài đặt Elasticsearch: npm install @elastic/elasticsearch
 * 2. Cấu hình ELASTICSEARCH_URL trong .env
 * 3. Tạo index và mapping cho users
 * 
 * Ví dụ cấu hình .env:
 * ELASTICSEARCH_URL=http://localhost:9200
 * ELASTICSEARCH_INDEX=users
 */

let elasticsearchClient = null;
let isElasticsearchEnabled = false;

// Khởi tạo Elasticsearch client (chỉ khi có cấu hình)
const initElasticsearch = async () => {
    try {
        if (process.env.ELASTICSEARCH_URL) {
            const { Client } = require('@elastic/elasticsearch');
            elasticsearchClient = new Client({
                node: process.env.ELASTICSEARCH_URL
            });

            // Kiểm tra kết nối
            await elasticsearchClient.ping();
            isElasticsearchEnabled = true;
            console.log('Elasticsearch connected successfully');

            // Tạo index nếu chưa tồn tại
            await createIndexIfNotExists();
        } else {
            console.log('Elasticsearch not configured, using MongoDB search');
        }
    } catch (error) {
        console.log('Elasticsearch initialization error:', error.message);
        isElasticsearchEnabled = false;
    }
};

// Tạo index và mapping cho users
const createIndexIfNotExists = async () => {
    const indexName = process.env.ELASTICSEARCH_INDEX || 'users';
    
    try {
        const exists = await elasticsearchClient.indices.exists({ index: indexName });
        
        if (!exists) {
            await elasticsearchClient.indices.create({
                index: indexName,
                body: {
                    mappings: {
                        properties: {
                            name: {
                                type: 'text',
                                analyzer: 'standard',
                                fields: {
                                    keyword: { type: 'keyword' }
                                }
                            },
                            email: {
                                type: 'text',
                                analyzer: 'standard',
                                fields: {
                                    keyword: { type: 'keyword' }
                                }
                            },
                            role: {
                                type: 'keyword'
                            },
                            createdAt: {
                                type: 'date'
                            },
                            updatedAt: {
                                type: 'date'
                            }
                        }
                    },
                    settings: {
                        analysis: {
                            analyzer: {
                                vietnamese_analyzer: {
                                    type: 'standard',
                                    // Có thể thêm custom analyzer cho tiếng Việt
                                }
                            }
                        }
                    }
                }
            });
            console.log(`Elasticsearch index '${indexName}' created`);
        }
    } catch (error) {
        console.log('Error creating Elasticsearch index:', error.message);
    }
};

// Đồng bộ user từ MongoDB sang Elasticsearch
const syncUserToElasticsearch = async (user) => {
    if (!isElasticsearchEnabled || !elasticsearchClient) return;

    try {
        const indexName = process.env.ELASTICSEARCH_INDEX || 'users';
        await elasticsearchClient.index({
            index: indexName,
            id: user._id.toString(),
            body: {
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.log('Error syncing user to Elasticsearch:', error.message);
    }
};

// Xóa user khỏi Elasticsearch
const deleteUserFromElasticsearch = async (userId) => {
    if (!isElasticsearchEnabled || !elasticsearchClient) return;

    try {
        const indexName = process.env.ELASTICSEARCH_INDEX || 'users';
        await elasticsearchClient.delete({
            index: indexName,
            id: userId.toString()
        });
    } catch (error) {
        console.log('Error deleting user from Elasticsearch:', error.message);
    }
};

/**
 * Tìm kiếm user với Elasticsearch
 * @param {Object} searchParams - Tham số tìm kiếm
 */
const searchUserWithElasticsearch = async (searchParams = {}) => {
    if (!isElasticsearchEnabled || !elasticsearchClient) {
        // Fallback về MongoDB search nếu Elasticsearch không khả dụng
        const { searchUserService } = require('./userService');
        return await searchUserService(searchParams);
    }

    try {
        const {
            keyword = '',
            role = '',
            createdFrom = null,
            createdTo = null,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = searchParams;

        const indexName = process.env.ELASTICSEARCH_INDEX || 'users';
        const from = (page - 1) * limit;

        // Xây dựng query Elasticsearch
        const mustQueries = [];
        const filterQueries = [];

        // Fuzzy search cho keyword
        if (keyword && keyword.trim() !== '') {
            mustQueries.push({
                multi_match: {
                    query: keyword.trim(),
                    fields: ['name^2', 'email^2'], // name và email có trọng số cao hơn
                    type: 'best_fields',
                    fuzziness: 'AUTO', // Tự động điều chỉnh độ mờ
                    operator: 'or'
                }
            });
        }

        // Lọc theo role
        if (role && role.trim() !== '') {
            filterQueries.push({
                term: { role: role.trim() }
            });
        }

        // Lọc theo ngày tạo
        if (createdFrom || createdTo) {
            const dateRange = {};
            if (createdFrom) {
                dateRange.gte = createdFrom;
            }
            if (createdTo) {
                dateRange.lte = createdTo;
            }
            filterQueries.push({
                range: {
                    createdAt: dateRange
                }
            });
        }

        // Xây dựng body query
        const queryBody = {
            bool: {}
        };

        if (mustQueries.length > 0) {
            queryBody.bool.must = mustQueries;
        }

        if (filterQueries.length > 0) {
            queryBody.bool.filter = filterQueries;
        }

        // Nếu không có điều kiện nào, match all
        if (mustQueries.length === 0 && filterQueries.length === 0) {
            queryBody.match_all = {};
        }

        // Xử lý sort
        const sortOptions = [];
        const validSortFields = ['name', 'email', 'createdAt', 'role'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        sortOptions.push({
            [sortField]: {
                order: sortOrder === 'asc' ? 'asc' : 'desc'
            }
        });

        // Thực hiện search
        const response = await elasticsearchClient.search({
            index: indexName,
            body: {
                query: queryBody,
                sort: sortOptions,
                from: from,
                size: parseInt(limit),
                _source: ['name', 'email', 'role', 'createdAt', 'updatedAt']
            }
        });

        // Lấy total count
        const total = response.body.hits.total.value || response.body.hits.total;

        // Map kết quả
        const users = response.body.hits.hits.map(hit => ({
            _id: hit._id,
            ...hit._source,
            score: hit._score // Điểm relevance từ Elasticsearch
        }));

        return {
            EC: 0,
            EM: "Tìm kiếm người dùng thành công (Elasticsearch)",
            DT: {
                users: users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                },
                filters: {
                    keyword: keyword || null,
                    role: role || null,
                    createdFrom: createdFrom || null,
                    createdTo: createdTo || null
                }
            }
        };
    } catch (error) {
        console.log('Elasticsearch search error:', error);
        // Fallback về MongoDB search nếu có lỗi
        const { searchUserService } = require('./userService');
        return await searchUserService(searchParams);
    }
};

// Khởi tạo khi module được load
if (process.env.ELASTICSEARCH_URL) {
    initElasticsearch();
}

module.exports = {
    initElasticsearch,
    searchUserWithElasticsearch,
    syncUserToElasticsearch,
    deleteUserFromElasticsearch,
    isElasticsearchEnabled: () => isElasticsearchEnabled
};

