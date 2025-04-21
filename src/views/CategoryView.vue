<template>
  <div class="category-view">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    
    <div v-else>
      <el-page-header @back="goBack" :content="'AI论坛 - ' + category.name"></el-page-header>
      <p class="category-description">{{ category.description }}</p>
      
      <div v-if="posts.length === 0" class="empty-state">
        <el-empty description="该分类下暂无帖子"></el-empty>
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
  name: 'CategoryView',
  data() {
    return {
      category: {},
      posts: [],
      loading: true,
      currentPage: 1,
      pageSize: 10,
      pagination: null
    }
  },
  created() {
    // 从URL查询参数获取页码
    const pageParam = this.$route.query.page;
    if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (!isNaN(page) && page > 0) {
        this.currentPage = page;
      }
    }
    
    this.fetchCategoryAndPosts()
  },
  watch: {
    // 监听路由变化，处理浏览器前进/后退按钮
    '$route.query.page': {
      handler(newPage) {
        const page = parseInt(newPage, 10);
        if (!isNaN(page) && page > 0 && page !== this.currentPage) {
          this.currentPage = page;
          this.fetchCategoryAndPosts();
        }
      }
    },
    // 监听分类ID变化，切换分类时重新加载
    '$route.params.id': {
      handler() {
        this.currentPage = 1;
        this.fetchCategoryAndPosts();
      }
    }
  },
  methods: {
    goBack() {
      this.$router.push('/categories');
    },
    async fetchCategoryAndPosts() {
      this.loading = true;
      this.posts = []; // 清空旧数据
      
      try {
        const categoryId = this.$route.params.id
        
        // 获取分类信息
        const categoryResponse = await axios.get(`/api/categories/${categoryId}`)
        this.category = categoryResponse.data
        
        // 获取该分类下的帖子，带分页
        const postsResponse = await axios.get('/api/posts', {
          params: {
            categoryId: categoryId,
            page: this.currentPage,
            pageSize: this.pageSize,
            sort: 'newest'
          }
        });
        
        // 确保我们有有效的返回数据
        if (postsResponse.data && postsResponse.data.posts) {
          this.posts = postsResponse.data.posts;
          this.pagination = postsResponse.data.pagination;
          
          console.log('分类ID:', categoryId);
          console.log('获取到的帖子数据:', this.posts);
          console.log('分页信息:', this.pagination);
        } else {
          console.error('帖子数据格式不正确:', postsResponse.data);
          this.posts = [];
          this.pagination = {
            total: 0,
            totalPages: 1,
            currentPage: 1,
            pageSize: this.pageSize,
            hasNextPage: false,
            hasPrevPage: false
          };
        }
        
        this.loading = false
      } catch (error) {
        console.error('获取分类和帖子失败:', error)
        console.error('错误详情:', error.response ? error.response.data : '无响应数据');
        this.$message.error('获取分类和帖子失败，请稍后重试');
        this.posts = [];
        this.pagination = {
          total: 0,
          totalPages: 1,
          currentPage: 1,
          pageSize: this.pageSize,
          hasNextPage: false,
          hasPrevPage: false
        };
        this.loading = false
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN')
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
      this.$router.push({
        query: { ...this.$route.query, page }
      });
      
      // 重新获取帖子
      this.fetchCategoryAndPosts();
      
      // 滚动到页面顶部
      window.scrollTo(0, 0);
    }
  }
}
</script>

<style scoped>
.category-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.category-description {
  color: #909399;
  margin-bottom: 1.5rem;
  font-size: 14px;
  padding: 12px 0;
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

.post-meta .date {
  margin-left: 10px;
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
</style> 