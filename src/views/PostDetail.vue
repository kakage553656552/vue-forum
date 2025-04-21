<template>
  <div class="post-detail">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    
    <div v-else-if="error" class="error-container">
      <el-alert
        :title="error"
        type="error"
        :closable="false"
        show-icon
      />
    </div>
    
    <div v-else>
      <div class="post-navigation">
        <el-page-header @back="goBack" :content="'AI论坛 - ' + (post.title.substring(0, 20) + (post.title.length > 20 ? '...' : ''))"></el-page-header>
        
        <!-- 面包屑导航 -->
        <el-breadcrumb separator="/" class="post-breadcrumb">
          <el-breadcrumb-item :to="{ path: '/' }">AI论坛</el-breadcrumb-item>
          <el-breadcrumb-item 
            :to="{ path: `/category/${post.categoryId}` }"
            v-if="post.categoryId"
          >
            {{ getCategoryName(post.categoryId) }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{ post.title }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      
      <el-card class="post-card" shadow="hover">
        <div class="post-header">
          <h2>{{ post.title }}</h2>
          <div class="post-meta">
            <el-tag size="small" type="info">{{ post.author.username }}</el-tag>
            <span class="date">{{ formatDate(post.createdAt) }}</span>
            <el-tag size="small" type="success">{{ getCategoryName(post.categoryId) }}</el-tag>
          </div>
        </div>
        
        <div class="post-content" v-html="post.content">
        </div>
      </el-card>
      
      <div class="replies-section">
        <h3>回复 ({{ totalRepliesCount }})</h3>
        
        <div v-if="replies.length === 0" class="empty-replies">
          <el-empty description="暂无回复，成为第一个回复的人吧！"></el-empty>
        </div>
        
        <div v-else class="replies-list">
          <!-- 顶级回复 -->
          <el-card v-for="reply in replies" :key="reply.id" class="reply-card" shadow="hover">
            <div class="reply-header">
              <div class="reply-meta">
                <el-tag size="small" type="info">{{ reply.author.username }}</el-tag>
                <span class="date">{{ formatDate(reply.createdAt) }}</span>
              </div>
            </div>
            <div class="reply-content">
              {{ reply.content }}
            </div>
            <div class="reply-actions">
              <el-button v-if="isLoggedIn" @click="toggleReplyForm(reply.id)" type="text" size="mini">
                {{ replyingTo === reply.id ? '取消回复' : '回复' }}
              </el-button>
            </div>
            
            <!-- 回复表单 -->
            <div v-if="isLoggedIn && replyingTo === reply.id" class="reply-form">
              <el-input
                type="textarea"
                v-model="replyFormContent"
                :rows="2"
                placeholder="回复该评论..."
                :disabled="submittingChild"
              />
              <div class="form-actions">
                <el-button 
                  @click="submitChildReply(reply.id)" 
                  type="primary" 
                  size="small" 
                  :loading="submittingChild"
                >
                  提交
                </el-button>
              </div>
            </div>
            
            <!-- 子回复显示 -->
            <div v-if="reply.childRepliesCount > 0" class="child-replies">
              <div v-if="!loadedChildReplies[reply.id]" class="load-replies">
                <el-button @click="loadChildReplies(reply.id)" type="text">
                  显示所有 {{ reply.childRepliesCount }} 条回复
                </el-button>
              </div>
              
              <div v-else class="child-replies-list">
                <div v-for="childReply in childRepliesMap[reply.id]" :key="childReply.id" class="child-reply">
                  <div class="child-reply-header">
                    <el-tag size="mini" type="info">{{ childReply.author.username }}</el-tag>
                    <span class="date">{{ formatDate(childReply.createdAt) }}</span>
                  </div>
                  <div class="child-reply-content">
                    {{ childReply.content }}
                  </div>
                  <div class="reply-actions">
                    <el-button v-if="isLoggedIn" @click="toggleReplyForm(childReply.id)" type="text" size="mini">
                      {{ replyingTo === childReply.id ? '取消回复' : '回复' }}
                    </el-button>
                  </div>
                  
                  <!-- 对子回复的回复表单 -->
                  <div v-if="isLoggedIn && replyingTo === childReply.id" class="reply-form">
                    <el-input
                      type="textarea"
                      v-model="replyFormContent"
                      :rows="2"
                      placeholder="回复该评论..."
                      :disabled="submittingChild"
                    />
                    <div class="form-actions">
                      <el-button 
                        @click="submitChildReply(reply.id, childReply.id)" 
                        type="primary" 
                        size="small" 
                        :loading="submittingChild"
                      >
                        提交
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
      
      <div v-if="isLoggedIn" class="add-reply">
        <el-card shadow="hover">
          <div slot="header">
            <h3>添加回复</h3>
          </div>
          <el-form @submit.native.prevent="submitReply">
            <el-form-item>
              <el-input
                type="textarea"
                v-model="replyContent"
                :rows="4"
                placeholder="写下你的回复..."
                :disabled="submitting"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitReply" :loading="submitting">
                提交回复
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
      
      <div v-else class="login-to-reply">
        <el-button type="primary" @click="$router.push('/login')">登录后回复</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'PostDetail',
  data() {
    return {
      post: null,
      replies: [],
      categories: [],
      loading: true,
      error: null,
      replyContent: '',
      submitting: false,
      isLoggedIn: false,
      
      // 评论回复相关数据
      replyingTo: null,
      replyFormContent: '',
      submittingChild: false,
      loadedChildReplies: {}, // 用于记录哪些回复的子回复已加载
      childRepliesMap: {} // 存储子回复
    }
  },
  computed: {
    totalRepliesCount() {
      // 计算总回复数（顶级回复 + 子回复）
      let count = this.replies.length;
      for (const reply of this.replies) {
        count += reply.childRepliesCount || 0;
      }
      return count;
    }
  },
  created() {
    this.checkLoginStatus()
    this.fetchPostDetails()
    this.fetchCategories()
  },
  methods: {
    checkLoginStatus() {
      const token = localStorage.getItem('token')
      this.isLoggedIn = !!token
    },
    async fetchPostDetails() {
      const postId = this.$route.params.id
      
      try {
        // 获取帖子详情
        const postResponse = await axios.get(`/api/posts/${postId}`)
        this.post = postResponse.data
        
        // 获取回复
        const repliesResponse = await axios.get(`/api/posts/${postId}/replies`)
        this.replies = repliesResponse.data
        
        this.loading = false
      } catch (error) {
        console.error('获取帖子详情失败:', error)
        this.error = '获取帖子详情失败，请稍后再试'
        this.loading = false
      }
    },
    async fetchCategories() {
      try {
        const response = await axios.get('/api/categories')
        this.categories = response.data
      } catch (error) {
        console.error('获取分类失败:', error)
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    getCategoryName(categoryId) {
      const category = this.categories.find(c => c.id === categoryId)
      return category ? category.name : '未分类'
    },
    async submitReply() {
      if (!this.replyContent.trim()) return
      
      this.submitting = true
      
      try {
        const token = localStorage.getItem('token')
        
        const response = await axios.post(
          `/api/posts/${this.post.id}/replies`,
          { content: this.replyContent },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        
        // 添加新回复到列表
        this.replies.push(response.data)
        
        // 清空回复内容
        this.replyContent = ''
        
        // 显示成功消息
        this.$message.success('回复成功！')
      } catch (error) {
        console.error('提交回复失败:', error)
        this.$message.error('提交回复失败，请稍后再试')
      } finally {
        this.submitting = false
      }
    },
    // 切换回复表单的显示状态
    toggleReplyForm(replyId) {
      if (this.replyingTo === replyId) {
        this.replyingTo = null; // 如果已经在回复这条评论，则关闭表单
      } else {
        this.replyingTo = replyId; // 否则打开表单
        this.replyFormContent = ''; // 清空表单内容
      }
    },
    // 加载子回复
    async loadChildReplies(parentReplyId) {
      try {
        const response = await axios.get(`/api/replies/${parentReplyId}/children`);
        this.$set(this.childRepliesMap, parentReplyId, response.data);
        this.$set(this.loadedChildReplies, parentReplyId, true);
      } catch (error) {
        console.error('获取子回复失败:', error);
        this.$message.error('获取回复失败，请稍后再试');
      }
    },
    // 提交子回复
    async submitChildReply(parentReplyId) {
      if (!this.replyFormContent.trim()) return;
      
      this.submittingChild = true;
      
      try {
        const token = localStorage.getItem('token');
        
        const response = await axios.post(
          `/api/posts/${this.post.id}/replies`,
          { 
            content: this.replyFormContent,
            parentId: parentReplyId
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        // 如果已经加载了这个回复的子回复，就将新回复添加到列表中
        if (this.loadedChildReplies[parentReplyId]) {
          if (!this.childRepliesMap[parentReplyId]) {
            this.$set(this.childRepliesMap, parentReplyId, []);
          }
          this.childRepliesMap[parentReplyId].push(response.data);
        }
        
        // 增加原回复的子回复计数
        const parentReplyIndex = this.replies.findIndex(r => r.id === parentReplyId);
        if (parentReplyIndex !== -1) {
          this.replies[parentReplyIndex].childRepliesCount += 1;
        }
        
        // 清空回复内容并关闭表单
        this.replyFormContent = '';
        this.replyingTo = null;
        
        // 显示成功消息
        this.$message.success('回复成功！');
      } catch (error) {
        console.error('提交回复失败:', error);
        this.$message.error('提交回复失败，请稍后再试');
      } finally {
        this.submittingChild = false;
      }
    },
    goBack() {
      // 如果有上一页，则返回上一页
      if (window.history.length > 1) {
        this.$router.go(-1)
      } else {
        // 如果没有上一页（比如用户直接通过URL访问），则回到首页
        this.$router.push('/')
      }
    }
  }
}
</script>

<style scoped>
.post-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container {
  padding: 20px;
}

.error-container {
  margin: 20px 0;
}

.post-card {
  margin-bottom: 2rem;
}

.post-header {
  margin-bottom: 1rem;
}

.post-header h2 {
  margin-bottom: 0.5rem;
  color: #2d3748;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.date {
  color: #909399;
  font-size: 0.875rem;
}

.post-content {
  line-height: 1.8;
  white-space: pre-line;
}

.replies-section {
  margin-bottom: 2rem;
}

.replies-section h3 {
  margin-bottom: 1rem;
  color: #2d3748;
  font-size: 18px;
}

.empty-replies {
  text-align: center;
  padding: 1.5rem;
}

.replies-list {
  display: grid;
  gap: 1rem;
}

.reply-card {
  margin-bottom: 12px;
}

.reply-header {
  margin-bottom: 0.5rem;
}

.reply-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.reply-content {
  white-space: pre-line;
  margin: 10px 0;
  font-size: 14px;
  line-height: 1.6;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.reply-form {
  margin-top: 12px;
  padding: 12px;
  background-color: #f7fafc;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.child-replies {
  margin-top: 12px;
  margin-left: 1.5rem;
  padding-left: 1rem;
  border-left: 2px solid #e2e8f0;
}

.load-replies {
  text-align: center;
  margin: 0.5rem 0;
}

.child-replies-list {
  display: grid;
  gap: 12px;
}

.child-reply {
  padding: 12px;
  background-color: #f7fafc;
  border-radius: 4px;
}

.child-reply-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
}

.child-reply-content {
  white-space: pre-line;
  font-size: 14px;
  margin: 8px 0;
}

.add-reply {
  margin-top: 2rem;
}

.add-reply h3 {
  font-size: 16px;
  color: #2d3748;
}

.login-to-reply {
  margin-top: 2rem;
  text-align: center;
}

.post-navigation {
  margin-bottom: 20px;
  background-color: #f5f7fa;
  padding: 12px 15px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.post-breadcrumb {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e6e6e6;
}

.post-navigation >>> .el-page-header__left {
  margin-right: 20px;
}

.post-navigation >>> .el-page-header__left .el-icon-back {
  font-size: 16px;
  font-weight: bold;
}

.post-navigation >>> .el-page-header__content {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}
</style>