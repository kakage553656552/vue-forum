<template>
  <div class="user-management">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="用户管理" name="users">
        <h1>AI论坛 - 用户管理</h1>
        
        <div class="filters">
          <input v-model="searchQuery" @input="onSearchChange" placeholder="搜索用户名或邮箱" class="search-input" />
          <select v-model="roleFilter" @change="onRoleFilterChange" class="role-filter">
            <option value="">全部角色</option>
            <option value="admin">管理员</option>
            <option value="user">普通用户</option>
          </select>
          <button @click="resetFilters" class="reset-button">重置</button>
        </div>
        
        <div class="users-table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>头像</th>
                <th>用户名</th>
                <th>邮箱</th>
                <th>角色</th>
                <th>创建时间</th>
                <th>发帖数</th>
                <th>回复数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>{{ user.id.substring(0, 8) }}...</td>
                <td>
                  <div class="user-avatar">
                    <img :src="user.avatar || defaultAvatar" alt="用户头像" class="avatar-img">
                  </div>
                </td>
                <td>{{ user.username }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <select v-model="user.role" @change="updateUserRole(user)">
                    <option value="user">普通用户</option>
                    <option value="admin">管理员</option>
                  </select>
                </td>
                <td>{{ formatDate(user.createdAt) }}</td>
                <td>{{ user.postCount }}</td>
                <td>{{ user.replyCount }}</td>
                <td>
                  <button @click="viewUserDetails(user)" class="view-button">查看</button>
                  <button @click="deleteUser(user)" class="delete-button">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="pagination">
          <el-pagination
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-size="itemsPerPage"
            layout="prev, pager, next, jumper"
            :total="totalUsers"
            background>
          </el-pagination>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="帖子管理" name="posts">
        <h1>AI论坛 - 帖子管理</h1>
        
        <div class="filters">
          <input v-model="postSearchQuery" @input="onPostSearchChange" placeholder="搜索帖子标题" class="search-input" />
          <select v-model="postCategoryFilter" @change="onPostCategoryChange" class="category-filter">
            <option value="">全部分类</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
          </select>
          <button @click="resetPostFilters" class="reset-button">重置</button>
        </div>
        
        <div class="posts-table-container">
          <table class="posts-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>标题</th>
                <th>作者</th>
                <th>分类</th>
                <th>发布时间</th>
                <th>浏览数</th>
                <th>回复数</th>
                <th>置顶</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="post in filteredPosts" :key="post.id" :class="{ 'pinned-post': post.isPinned }">
                <td>{{ post.id.substring(0, 8) }}...</td>
                <td>
                  <div class="post-title-container">
                    <i v-if="post.isPinned" class="el-icon-top pinned-icon"></i>
                    {{ post.title }}
                  </div>
                </td>
                <td>{{ post.author ? post.author.username : '未知' }}</td>
                <td>{{ getCategoryName(post.categoryId) }}</td>
                <td>{{ formatDate(post.createdAt) }}</td>
                <td>{{ post.viewCount || 0 }}</td>
                <td>{{ post.replyCount || 0 }}</td>
                <td>
                  <el-switch
                    v-model="post.isPinned"
                    @change="togglePostPinned(post)"
                    active-color="#13ce66"
                    inactive-color="#ff4949">
                  </el-switch>
                </td>
                <td>
                  <button @click="viewPost(post.id)" class="view-button">查看</button>
                  <button @click="deletePost(post)" class="delete-button">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="pagination">
          <el-pagination
            @current-change="handlePostCurrentChange"
            :current-page="currentPostPage"
            :page-size="postsPerPage"
            layout="prev, pager, next, jumper"
            :total="totalPosts"
            background>
          </el-pagination>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 用户详情弹窗 -->
    <div v-if="showUserDetails" class="user-details-modal">
      <div class="user-details-content">
        <span class="close-button" @click="showUserDetails = false">&times;</span>
        <h2>AI论坛 - {{ selectedUser.username }} 的详细信息</h2>
        
        <div class="user-info">
          <div class="user-header">
            <div class="user-avatar-large">
              <img :src="selectedUser.avatar || defaultAvatar" alt="用户头像" class="large-avatar-img">
            </div>
            <div class="user-details">
              <p><strong>ID:</strong> {{ selectedUser.id }}</p>
              <p><strong>用户名:</strong> {{ selectedUser.username }}</p>
              <p><strong>邮箱:</strong> {{ selectedUser.email }}</p>
              <p><strong>角色:</strong> {{ selectedUser.role === 'admin' ? '管理员' : '普通用户' }}</p>
              <p><strong>创建时间:</strong> {{ formatDate(selectedUser.createdAt) }}</p>
              <p><strong>发帖数:</strong> {{ selectedUser.postCount }}</p>
              <p><strong>回复数:</strong> {{ selectedUser.replyCount }}</p>
            </div>
          </div>
        </div>
        
        <h3>发布的帖子</h3>
        <ul class="user-posts">
          <li v-for="post in userPosts" :key="post.id">
            <a @click="goToPost(post.id)">{{ post.title }}</a>
            <span>{{ formatDate(post.createdAt) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import _ from 'lodash';

export default {
  name: 'UserManagement',
  data() {
    return {
      activeTab: 'users',
      users: [],
      searchQuery: '',
      roleFilter: '',
      currentPage: 1,
      itemsPerPage: 10,
      showUserDetails: false,
      selectedUser: {},
      userPosts: [],
      // 帖子管理相关数据
      allPosts: [],
      categories: [],
      postSearchQuery: '',
      postCategoryFilter: '',
      currentPostPage: 1,
      postsPerPage: 10,
      defaultAvatar: 'https://bootdey.com/img/Content/avatar/avatar1.png',
      totalUsers: 0,
      totalPosts: 0
    };
  },
  computed: {
    filteredUsers() {
      let result = this.users;
      
      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(user => 
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        );
      }
      
      // 角色过滤
      if (this.roleFilter) {
        result = result.filter(user => user.role === this.roleFilter);
      }
      
      return result;
    },
    filteredPosts() {
      return this.allPosts;
    }
  },
  created() {
    this.fetchUsers();
    this.fetchCategories();
    this.fetchAllPosts();
  },
  methods: {
    async fetchUsers() {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/users', {
          params: {
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery,
            role: this.roleFilter
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        this.users = response.data.users;
        this.totalUsers = response.data.total;
      } catch (error) {
        console.error('获取用户列表失败:', error);
        if (error.response && error.response.status === 401) {
          this.$router.push('/login');
        }
      }
    },
    async updateUserRole(user) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`/api/users/${user.id}/role`, { role: user.role }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        alert('用户角色更新成功');
      } catch (error) {
        console.error('更新用户角色失败:', error);
        // 恢复原来的角色
        this.fetchUsers();
      }
    },
    async deleteUser(user) {
      if (!confirm(`确定要删除用户 ${user.username} 吗？此操作不可恢复！`)) {
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/users/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        alert('用户删除成功');
        this.fetchUsers();
      } catch (error) {
        console.error('删除用户失败:', error);
      }
    },
    async viewUserDetails(user) {
      this.selectedUser = user;
      this.showUserDetails = true;
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/users/${user.id}/posts`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        this.userPosts = response.data;
      } catch (error) {
        console.error('获取用户帖子失败:', error);
        this.userPosts = [];
      }
    },
    goToPost(postId) {
      this.showUserDetails = false;
      this.$router.push(`/post/${postId}`);
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN');
    },
    resetFilters() {
      this.searchQuery = '';
      this.roleFilter = '';
      this.currentPage = 1;
      this.fetchUsers();
    },
    handleCurrentChange(page) {
      this.currentPage = page;
      this.fetchUsers();
    },
    // 获取所有分类
    async fetchCategories() {
      try {
        const response = await axios.get('/api/categories');
        this.categories = response.data;
      } catch (error) {
        console.error('获取分类失败:', error);
      }
    },
    
    // 获取分类名称
    getCategoryName(categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category ? category.name : '未分类';
    },
    
    // 获取所有帖子
    async fetchAllPosts() {
      try {
        const token = localStorage.getItem('token');
        
        const response = await axios.get('/api/posts/admin', {
          params: {
            page: this.currentPostPage,
            pageSize: this.postsPerPage,
            search: this.postSearchQuery,
            category: this.postCategoryFilter
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        this.allPosts = response.data.posts;
        this.totalPosts = response.data.total;
      } catch (error) {
        console.error('获取帖子失败:', error);
        if (error.response && error.response.status === 401) {
          this.$router.push('/login');
        }
      }
    },
    
    // 查看帖子
    viewPost(postId) {
      this.$router.push(`/post/${postId}`);
    },
    
    // 删除帖子
    async deletePost(post) {
      if (!confirm(`确定要删除帖子 "${post.title}" 吗？此操作不可恢复！`)) {
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/posts/${post.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        this.$message.success('帖子删除成功');
        this.fetchAllPosts(); // 重新获取帖子列表
      } catch (error) {
        console.error('删除帖子失败:', error);
        this.$message.error('删除帖子失败：' + (error.response?.data?.message || '未知错误'));
      }
    },
    
    // 切换帖子置顶状态
    async togglePostPinned(post) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.patch(`/api/posts/${post.id}/toggle-pinned`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        this.$message.success(response.data.message);
        post.isPinned = response.data.isPinned;
        
        // 重新获取所有帖子以更新排序
        this.fetchAllPosts();
      } catch (error) {
        console.error('切换帖子置顶状态失败:', error);
        this.$message.error('切换帖子置顶状态失败：' + (error.response?.data?.message || '未知错误'));
        
        // 恢复原来的状态
        post.isPinned = !post.isPinned;
      }
    },
    
    // 重置帖子过滤器
    resetPostFilters() {
      this.postSearchQuery = '';
      this.postCategoryFilter = '';
      this.currentPostPage = 1;
      this.fetchAllPosts();
    },
    
    handlePostCurrentChange(page) {
      this.currentPostPage = page;
      this.fetchAllPosts();
    },
    
    onSearchChange: _.debounce(function() {
      this.currentPage = 1;
      this.fetchUsers();
    }, 300),
    
    onRoleFilterChange() {
      this.currentPage = 1;
      this.fetchUsers();
    },
    
    onPostSearchChange: _.debounce(function() {
      this.currentPostPage = 1;
      this.fetchAllPosts();
    }, 300),
    
    onPostCategoryChange() {
      this.currentPostPage = 1;
      this.fetchAllPosts();
    }
  }
};
</script>

<style scoped>
.user-management {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
}

.search-input, .role-filter {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.search-input {
  flex-grow: 1;
}

.reset-button {
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
}

.users-table-container {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.users-table th, .users-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.users-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.users-table th:nth-child(2), .users-table td:nth-child(2) {
  width: 60px;
  text-align: center;
}

.users-table tr:hover {
  background-color: #f9f9f9;
}

.view-button, .delete-button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 5px;
}

.view-button {
  background-color: #4CAF50;
  color: white;
}

.delete-button {
  background-color: #f44336;
  color: white;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 15px;
}

.pagination button {
  padding: 8px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  background-color: #ddd;
  cursor: not-allowed;
}

/* 弹窗样式 */
.user-details-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.user-details-content {
  background-color: white;
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 20px;
  border-radius: 8px;
  position: relative;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  cursor: pointer;
}

.user-info {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.user-posts {
  list-style: none;
  padding: 0;
}

.user-posts li {
  padding: 10px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
}

.user-posts a {
  color: #2c3e50;
  text-decoration: none;
  cursor: pointer;
}

.user-posts a:hover {
  text-decoration: underline;
}

.posts-table-container {
  overflow-x: auto;
  margin-bottom: 20px;
}

.posts-table {
  width: 100%;
  border-collapse: collapse;
}

.posts-table th,
.posts-table td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
}

.posts-table th {
  background-color: #f2f2f2;
  font-weight: bold;
}

.posts-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.posts-table tr:hover {
  background-color: #f1f1f1;
}

.pinned-post {
  background-color: #FDF6EC !important;
}

.pinned-post td {
  border-color: #E6A23C !important;
}

.pinned-post:first-child td:first-child {
  border-left: 3px solid #E6A23C;
}

.pinned-icon {
  color: #E6A23C;
  margin-right: 5px;
}

.post-title-container {
  display: flex;
  align-items: center;
}

.view-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 5px 10px;
  margin-right: 5px;
  cursor: pointer;
  border-radius: 4px;
}

.delete-button {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 4px;
}

.category-filter {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f1f1f1;
  margin: 0 auto;
  border: 2px solid #e0e0e0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.user-avatar:hover {
  transform: scale(1.1);
  border-color: #4299e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.user-avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #f1f1f1;
  border: 3px solid #4299e1;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.large-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.user-avatar-large:hover .large-avatar-img {
  transform: scale(1.1);
}

.user-details {
  flex: 1;
}
</style> 