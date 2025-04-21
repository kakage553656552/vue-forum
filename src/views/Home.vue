<template>
  <div class="home">
    <!-- 分类模块 -->
    <div class="categories-section">
      <div class="category-grid" v-if="categories.length">
        <div v-for="category in categories" :key="category.id" 
             class="category-item" 
             @click="selectCategory(category.id)">
          <h3>{{ category.name }}</h3>
          <p>{{ category.description }}</p>
          <div class="category-stats">
            <span>主题数量: {{ category.topicCount || 0 }}</span>
            <span>帖子数量: {{ category.postCount || 0 }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="filter-container">
      <!-- 当前选中的分类 -->
      <div class="current-category" v-if="selectedCategory">
        <el-tag size="medium" closable @close="clearCategory">
          {{ getCategoryName(selectedCategory) }}
        </el-tag>
      </div>
      
      <!-- 排序方式选择 -->
      <div class="sort-options">
        <el-radio-group v-model="sortMode" size="medium" @change="handleSortChange">
          <el-radio-button label="newest">最新</el-radio-button>
          <el-radio-button label="hot">最热</el-radio-button>
          <el-radio-button label="replies">回复最多</el-radio-button>
        </el-radio-group>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    
    <div v-else>
      <div v-if="posts.length === 0" class="empty-state">
        <el-empty description="暂无帖子"></el-empty>
      </div>
      
      <div v-else class="post-list">
        <el-card v-for="post in posts" :key="post.id" class="post-item" shadow="hover" :class="{ 'pinned-post': post.isPinned }" @click.native="viewPost(post.id)">
          <div class="post-header">
            <h3>
              <i v-if="post.isPinned" class="el-icon-top pinned-icon"></i>
              <router-link :to="'/post/' + post.id">{{ post.title }}</router-link>
            </h3>
            <div class="post-meta">
              <el-tag size="small" type="info">{{ post.author.username }}</el-tag>
              <span class="date">{{ formatDate(post.createdAt) }}</span>
              <el-tag size="small" type="success">{{ getCategoryName(post.categoryId) }}</el-tag>
              <el-tag v-if="post.isPinned" size="small" type="warning" class="pinned-tag">
                <i class="el-icon-top"></i> 置顶
              </el-tag>
            </div>
          </div>
          <div class="post-summary">
            {{ post.content.substring(0, 150) }}{{ post.content.length > 150 ? '...' : '' }}
          </div>
          <div class="post-footer">
            <el-badge :value="post.replyCount || 0" class="item" type="primary">
              <el-button size="mini" type="text">回复</el-button>
            </el-badge>
            <span class="views">
              <i class="el-icon-view"></i> {{ post.viewCount || 0 }}
            </span>
          </div>
        </el-card>
      </div>
      
      <!-- Element UI分页控件 -->
      <div class="pagination-container">
        <el-pagination
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-size="pageSize"
          layout="prev, pager, next, jumper"
          :total="pagination ? pagination.total : 0"
          :disabled="!pagination || pagination.total <= pageSize"
          background
        >
        </el-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Home',
  data() {
    return {
      posts: [],
      categories: [],
      loading: true,
      currentPage: 1,
      pageSize: 10,
      pagination: null,
      sortMode: 'newest',      // 默认按最新排序
      selectedCategory: ''     // 默认不筛选分类
    }
  },
  created() {
    // 从URL查询参数获取页码、排序方式和分类
    const { page, sort, category } = this.$route.query;
    
    if (page) {
      const pageNum = parseInt(page, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        this.currentPage = pageNum;
      }
    }
    
    if (sort && ['newest', 'hot', 'replies'].includes(sort)) {
      this.sortMode = sort;
    }
    
    if (category) {
      this.selectedCategory = category;
    }
    
    this.fetchCategories();
    this.fetchPosts();
  },
  methods: {
    async fetchPosts() {
      this.loading = true;
      try {
        const response = await axios.get('/api/posts', {
          params: {
            page: this.currentPage,
            pageSize: this.pageSize,
            sort: this.sortMode,
            categoryId: this.selectedCategory || undefined
          }
        });
        
        // 新的API返回结构更改
        this.posts = response.data.posts;
        this.pagination = response.data.pagination;
        
        this.loading = false;
      } catch (error) {
        console.error('获取帖子失败:', error);
        this.$message.error('获取帖子失败，请稍后重试');
        this.loading = false;
      }
    },
    async fetchCategories() {
      try {
        const response = await axios.get('/api/categories');
        this.categories = response.data;
      } catch (error) {
        console.error('获取分类失败:', error);
        this.$message.error('获取分类失败，请稍后重试');
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN');
    },
    getCategoryName(categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category ? category.name : '未分类';
    },
    viewPost(postId) {
      this.$router.push(`/post/${postId}`);
    },
    handleCurrentChange(page) {
      this.changePage(page);
    },
    changePage(page) {
      if (page < 1 || (this.pagination && page > this.pagination.totalPages)) {
        return;
      }
      
      this.currentPage = page;
      
      // 更新URL查询参数而不刷新页面
      this.updateRouteQuery({ page });
      
      // 重新获取帖子
      this.fetchPosts();
      
      // 滚动到页面顶部
      window.scrollTo(0, 0);
    },
    handleSortChange(value) {
      this.sortMode = value;
      this.currentPage = 1; // 切换排序时重置页码
      
      // 更新URL查询参数
      this.updateRouteQuery({ sort: value, page: 1 });
      
      // 重新获取帖子
      this.fetchPosts();
    },
    selectCategory(categoryId) {
      this.selectedCategory = categoryId;
      this.currentPage = 1; // 切换分类时重置页码
      
      // 更新URL查询参数
      this.updateRouteQuery({ 
        category: categoryId, 
        page: 1 
      });
      
      // 重新获取帖子
      this.fetchPosts();
    },
    clearCategory() {
      this.selectedCategory = '';
      this.currentPage = 1;
      
      // 更新URL查询参数
      this.updateRouteQuery({ 
        category: undefined, 
        page: 1 
      });
      
      // 重新获取帖子
      this.fetchPosts();
    },
    // 更新路由查询参数的辅助方法
    updateRouteQuery(newParams) {
      // 合并现有查询参数和新参数
      const query = { ...this.$route.query, ...newParams };
      
      // 移除undefined的参数
      Object.keys(query).forEach(key => {
        if (query[key] === undefined) {
          delete query[key];
        }
      });
      
      // 更新路由
      this.$router.push({ query });
    }
  },
  // 监听路由变化，处理浏览器前进/后退按钮
  watch: {
    '$route.query': {
      handler(newQuery) {
        // 处理页码变化
        if (newQuery.page) {
          const page = parseInt(newQuery.page, 10);
          if (!isNaN(page) && page > 0 && page !== this.currentPage) {
            this.currentPage = page;
          }
        }
        
        // 处理排序方式变化
        if (newQuery.sort && ['newest', 'hot', 'replies'].includes(newQuery.sort) && newQuery.sort !== this.sortMode) {
          this.sortMode = newQuery.sort;
        }
        
        // 处理分类变化
        if (newQuery.category !== undefined && newQuery.category !== this.selectedCategory) {
          this.selectedCategory = newQuery.category || '';
        }
        
        // 如果有任何参数变化，重新获取帖子
        this.fetchPosts();
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.home {
  max-width: 900px;
  margin: 0 auto;
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.home-header h2 {
  color: #2d3748;
  margin: 0;
}

.filter-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 15px;
}

.category-filter {
  min-width: 200px;
  margin-bottom: 10px;
}

.sort-options {
  margin-bottom: 10px;
}

.loading-container {
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 2rem;
}

.post-list {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.post-item {
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.post-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.post-header {
  margin-bottom: 0.5rem;
}

.post-header h3 {
  margin-bottom: 0.5rem;
}

.post-header h3 a {
  color: #2d3748;
  text-decoration: none;
  transition: color 0.3s;
}

.post-header h3 a:hover {
  color: #409EFF;
}

.post-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.date {
  font-size: 0.875rem;
  color: #909399;
}

.post-summary {
  color: #4a5568;
  margin-bottom: 1rem;
  font-size: 14px;
  line-height: 1.6;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.views {
  color: #909399;
  font-size: 0.875rem;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

@media (max-width: 768px) {
  .home-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filter-container {
    margin-top: 16px;
    flex-wrap: wrap;
  }
  
  .sort-options {
    margin-bottom: 10px;
  }
}

.post-meta .post-date {
  color: #909399;
  margin-left: 8px;
}

.post-pinned {
  color: #E6A23C;
  font-weight: bold;
  display: flex;
  align-items: center;
  margin-left: 8px;
}

.post-pinned i {
  margin-right: 2px;
}

.post-stats {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.pinned-post {
  border: 2px solid #E6A23C;
  background-color: #FDF6EC;
  box-shadow: 0 2px 12px 0 rgba(230, 162, 60, 0.1) !important;
  position: relative;
  overflow: hidden;
}

.pinned-post::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  border-width: 0 30px 30px 0;
  border-style: solid;
  border-color: #E6A23C #fff;
}

.pinned-icon {
  color: #E6A23C;
  margin-right: 5px;
}

.pinned-tag {
  margin-left: 8px;
}

.categories-section {
  margin-bottom: 30px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.category-item {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
}

.category-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.category-item h3 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #2c3e50;
  font-size: 16px;
}

.category-item p {
  color: #606266;
  font-size: 13px;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.category-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.current-category {
  margin-right: 15px;
}
</style>