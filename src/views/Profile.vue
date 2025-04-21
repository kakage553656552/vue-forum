<template>
  <div class="profile">
    <h1>AI论坛 - 个人中心</h1>
    
    <!-- 用户信息卡片 -->
    <el-card class="user-info-card" v-if="user" shadow="hover">
      <div class="user-info">
        <div class="user-avatar-container">
          <img :src="user.avatar || defaultAvatar" alt="用户头像" class="profile-avatar">
          <el-button type="text" class="change-avatar-btn" @click="showChangeAvatarDialog">
            <i class="el-icon-edit"></i> 更换头像
          </el-button>
        </div>
        <div class="user-details">
          <div class="info-item">
            <strong>用户名:</strong> {{ user.username }}
            <el-button type="text" class="edit-btn" @click="showEditProfileDialog">
              <i class="el-icon-edit"></i> 编辑资料
            </el-button>
          </div>
          <div class="info-item">
            <strong>邮箱:</strong> {{ user.email }}
          </div>
          <div class="info-item">
            <strong>注册时间:</strong> {{ formatDate(user.createdAt) }}
          </div>
          <div class="stats">
            <div class="stat-item">
              <strong>发帖数量:</strong> {{ user.postCount || 0 }}
            </div>
            <div class="stat-item">
              <strong>回复数量:</strong> {{ user.replyCount || 0 }}
            </div>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 帖子管理部分 -->
    <div class="posts-management">
      <h2>我的帖子</h2>
      
      <!-- 搜索和过滤 -->
      <div class="filter-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索帖子标题"
          prefix-icon="el-icon-search"
          clearable
          @clear="fetchUserPosts"
          class="search-input"
        >
        </el-input>
        <el-select v-model="categoryFilter" placeholder="选择分类" clearable @change="handleCategoryChange" class="category-filter">
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          >
          </el-option>
        </el-select>
        <el-button type="primary" @click="searchPosts">搜索</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
      
      <!-- 帖子列表 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <div v-else-if="filteredPosts.length === 0" class="empty-state">
        <el-empty description="暂无帖子"></el-empty>
      </div>
      
      <div v-else class="posts-list">
        <el-card v-for="post in filteredPosts" :key="post.id" class="post-item" shadow="hover" :class="{ 'pinned-post': post.isPinned }" @click.native="goToPost(post)">
          <div class="post-header">
            <router-link :to="'/post/' + post.id" class="post-title">
              <i v-if="post.isPinned" class="el-icon-top pinned-icon"></i>
              {{ post.title }}
            </router-link>
            <div class="post-meta">
              <el-tag size="small" type="success">{{ getCategoryName(post.categoryId) }}</el-tag>
              <span class="post-date">{{ formatDate(post.createdAt) }}</span>
              <el-tag v-if="post.isPinned" size="small" type="warning" class="pinned-tag">
                <i class="el-icon-top"></i> 置顶
              </el-tag>
              <span class="post-stats">
                <i class="el-icon-view"></i> {{ post.viewCount || 0 }}
                <i class="el-icon-chat-line-square"></i> {{ post.replyCount || 0 }}
              </span>
            </div>
          </div>
          <div class="post-content-preview">
            <div v-html="getContentPreview(post.content)"></div>
          </div>
          <div class="post-actions">
            <el-button type="text" @click="viewPost(post.id)">查看</el-button>
            <el-button type="text" @click="editPost(post)">编辑</el-button>
            <el-button type="text" @click="togglePinned(post)">
              {{ post.isPinned ? '取消置顶' : '置顶' }}
            </el-button>
            <el-popconfirm
              title="确定要删除这篇帖子吗？"
              @confirm="deletePost(post.id)"
            >
              <el-button slot="reference" type="text" class="danger-button">删除</el-button>
            </el-popconfirm>
          </div>
        </el-card>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-container" v-if="totalPosts > 0">
        <el-pagination
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-size="pageSize"
          layout="prev, pager, next, jumper"
          :total="totalPosts"
          background
        >
        </el-pagination>
      </div>
    </div>
    
    <!-- 帖子编辑对话框 -->
    <el-dialog
      title="编辑帖子"
      :visible.sync="editDialogVisible"
      width="800px"
      @closed="handleDialogClosed"
    >
      <el-form :model="editForm" label-width="80px" v-if="editDialogVisible">
        <el-form-item label="标题">
          <el-input v-model="editForm.title" placeholder="请输入标题"></el-input>
        </el-form-item>

        <el-form-item label="分类">
          <el-select v-model="editForm.categoryId" placeholder="选择分类">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            >
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="内容">
          <div class="editor-container">
            <Toolbar
              style="border-bottom: 1px solid #ccc"
              :editor="editor"
              :defaultConfig="toolbarConfig"
              :mode="mode"
            />
            <Editor
              style="height: 400px; overflow-y: hidden;"
              v-model="editForm.content"
              :defaultConfig="editorConfig"
              :mode="mode"
              @onCreated="onEditorCreated"
            />
          </div>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="submitting">保存</el-button>
      </span>
    </el-dialog>
    
    <!-- 编辑用户资料对话框 -->
    <el-dialog
      title="编辑个人资料"
      :visible.sync="profileDialogVisible"
      width="500px"
    >
      <el-form :model="profileForm" :rules="profileRules" ref="profileForm" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="profileForm.username"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="profileForm.email" type="email"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="profileDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="updateProfile" :loading="profileSubmitting">保存</el-button>
      </span>
    </el-dialog>
    
    <!-- 更换头像对话框 -->
    <el-dialog
      title="更换头像"
      :visible.sync="avatarDialogVisible"
      width="500px"
    >
      <div class="avatar-selection">
        <div class="default-avatars">
          <p>选择默认头像</p>
          <div class="avatar-options">
            <div 
              v-for="(avatar, index) in defaultAvatars" 
              :key="index" 
              class="avatar-option" 
              :class="{ 'selected': selectedAvatar === avatar }"
              @click="selectAvatar(avatar)"
            >
              <img :src="avatar" alt="默认头像" />
            </div>
          </div>
        </div>
        
        <div class="custom-avatar-upload">
          <p>上传自定义头像</p>
          <input 
            type="file" 
            id="avatarUpload" 
            @change="handleAvatarUpload" 
            accept="image/*"
            ref="avatarUpload"
            class="avatar-upload-input"
          >
          <label for="avatarUpload" class="avatar-upload-label">
            <div v-if="uploadedAvatar" class="preview-container">
              <img :src="uploadedAvatar" alt="自定义头像" class="avatar-preview" />
              <span class="change-avatar">更换</span>
            </div>
            <span v-else class="upload-text">点击上传</span>
          </label>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="avatarDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="updateAvatar" :loading="avatarSubmitting">保存</el-button>
      </span>
    </el-dialog>
    
    <div v-if="!user" class="loading">
      加载中...
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'

export default {
  name: 'Profile',
  components: {
    Editor,
    Toolbar
  },
  data() {
    return {
      user: null,
      posts: [],
      filteredPosts: [],
      categories: [],
      loading: true,
      searchQuery: '',
      categoryFilter: '',
      currentPage: 1,
      pageSize: 5,
      totalPosts: 0,
      editDialogVisible: false,
      editForm: {
        id: '',
        title: '',
        categoryId: '',
        content: ''
      },
      profileDialogVisible: false,
      profileForm: {
        username: '',
        email: ''
      },
      profileRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱地址', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ]
      },
      profileSubmitting: false,
      avatarDialogVisible: false,
      defaultAvatars: [
        'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
        'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png',
        'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png',
        'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg'
      ],
      defaultAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
      selectedAvatar: null,
      uploadedAvatar: null,
      avatarFile: null,
      avatarSubmitting: false,
      toolbarConfig: {
        excludeKeys: [] // 可以在这里排除不需要的工具按钮
      },
      editorConfig: {
        placeholder: '请输入正文内容...',
        MENU_CONF: {
          uploadImage: {
            server: '/api/upload/image',
            fieldName: 'image',
            maxFileSize: 5 * 1024 * 1024, // 5MB
            maxNumberOfFiles: 10,
            allowedFileTypes: ['image/*'],
            // 自定义上传参数
            meta: {
              token: localStorage.getItem('token') || ''
            },
            // 自定义增加 http 请求头
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token') || ''}`
            },
            // 上传错误回调
            onError: (file, err, res) => {
              console.error('图片上传出错', file, err, res)
              this.$message.error('图片上传失败，请重试')
            },
            // 自定义结果处理
            customInsert: (res, insertFn) => {
              if (res.code === 0 && res.data.url) {
                insertFn(res.data.url, res.data.alt, res.data.href)
              } else {
                console.error('插入图片失败', res)
                this.$message.error(res.message || '插入图片失败')
              }
            },
          }
        }
      },
      mode: 'default',
      editor: null,
      submitting: false
    }
  },
  created() {
    this.fetchUserProfile()
    this.fetchUserPosts()
    this.fetchCategories()
  },
  beforeDestroy() {
    // 销毁编辑器实例
    if (this.editor) {
      this.editor.destroy()
    }
  },
  methods: {
    async fetchUserProfile() {
      try {
        const response = await axios.get('/api/user/profile')
        this.user = response.data
      } catch (error) {
        console.error('获取用户资料失败:', error)
        this.$message.error('获取用户资料失败')
      }
    },
    async fetchUserPosts() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('/api/user/posts', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        this.posts = response.data
        this.applyFilters()
        this.loading = false
      } catch (error) {
        console.error('获取用户帖子失败:', error)
        this.$message.error('获取用户帖子失败')
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
      return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN')
    },
    getCategoryName(categoryId) {
      const category = this.categories.find(c => c.id === categoryId)
      return category ? category.name : '未分类'
    },
    getContentPreview(content) {
      // 创建一个临时的div元素来解析HTML内容
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = content
      const textContent = tempDiv.textContent || tempDiv.innerText
      
      // 返回内容的前100个字符作为预览
      return textContent.substring(0, 100) + (textContent.length > 100 ? '...' : '')
    },
    viewPost(postId) {
      this.$router.push(`/post/${postId}`)
    },
    goToPost(post) {
      // 阻止点击操作按钮时触发卡片的点击事件
      if (event && event.target && (
        event.target.classList.contains('el-button') || 
        event.target.parentElement.classList.contains('el-button') ||
        event.target.closest('.post-actions')
      )) {
        return;
      }
      this.$router.push(`/post/${post.id}`);
    },
    async deletePost(postId) {
      try {
        const token = localStorage.getItem('token')
        await axios.delete(`/api/posts/${postId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        this.$message.success('帖子删除成功')
        // 重新获取帖子列表
        this.fetchUserPosts()
      } catch (error) {
        console.error('删除帖子失败:', error)
        this.$message.error('删除帖子失败：' + (error.response?.data?.message || '未知错误'))
      }
    },
    searchPosts() {
      this.applyFilters()
    },
    resetFilters() {
      this.searchQuery = ''
      this.categoryFilter = ''
      this.currentPage = 1
      this.applyFilters()
    },
    handleCategoryChange() {
      this.currentPage = 1
      this.applyFilters()
    },
    handleCurrentChange(page) {
      this.currentPage = page
      this.applyFilters()
    },
    applyFilters() {
      let result = [...this.posts]
      
      // 标题搜索
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        result = result.filter(post => 
          post.title.toLowerCase().includes(query)
        )
      }
      
      // 分类过滤
      if (this.categoryFilter) {
        result = result.filter(post => post.categoryId === this.categoryFilter)
      }
      
      // 保存总数用于分页
      this.totalPosts = result.length
      
      // 分页
      const startIndex = (this.currentPage - 1) * this.pageSize
      const endIndex = startIndex + this.pageSize
      this.filteredPosts = result.slice(startIndex, endIndex)
    },
    editPost(post) {
      this.editForm = {
        id: post.id,
        title: post.title,
        categoryId: post.categoryId,
        content: post.content
      }
      this.editDialogVisible = true
    },
    handleDialogClosed() {
      this.editForm = {
        id: '',
        title: '',
        categoryId: '',
        content: ''
      }
    },
    onEditorCreated(editor) {
      this.editor = editor
    },
    async submitEdit() {
      this.submitting = true
      try {
        const token = localStorage.getItem('token')
        const response = await axios.put(`/api/posts/${this.editForm.id}`, this.editForm, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        this.$message.success('帖子编辑成功')
        this.editDialogVisible = false
        this.fetchUserPosts()
      } catch (error) {
        console.error('编辑帖子失败:', error)
        this.$message.error('编辑帖子失败：' + (error.response?.data?.message || '未知错误'))
      } finally {
        this.submitting = false
      }
    },
    async togglePinned(post) {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.patch(`/api/posts/${post.id}/toggle-pinned`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        
        this.$message.success(response.data.message)
        // 更新本地帖子状态
        post.isPinned = response.data.isPinned
        post.pinnedAt = response.data.isPinned ? new Date().toISOString() : null
        
        // 重新获取帖子列表以更新排序
        this.fetchUserPosts()
      } catch (error) {
        console.error('切换帖子置顶状态失败:', error)
        this.$message.error('切换帖子置顶状态失败：' + (error.response?.data?.message || '未知错误'))
      }
    },
    // 显示编辑个人资料对话框
    showEditProfileDialog() {
      this.profileForm.username = this.user.username
      this.profileForm.email = this.user.email
      this.profileDialogVisible = true
    },
    
    // 更新个人资料
    updateProfile() {
      this.$refs.profileForm.validate(async (valid) => {
        if (valid) {
          this.profileSubmitting = true
          try {
            const response = await axios.put('/api/user/profile', {
              username: this.profileForm.username,
              email: this.profileForm.email
            }, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            })
            
            if (response.data.success) {
              // 更新本地存储的用户信息
              const userData = JSON.parse(localStorage.getItem('user') || '{}')
              userData.username = this.profileForm.username
              userData.email = this.profileForm.email
              localStorage.setItem('user', JSON.stringify(userData))
              
              // 更新页面上的用户信息
              this.user.username = this.profileForm.username
              this.user.email = this.profileForm.email
              
              // 触发用户信息更新事件
              window.dispatchEvent(new Event('user-updated'))
              
              this.$message.success('个人资料已更新')
              this.profileDialogVisible = false
            }
          } catch (error) {
            console.error('更新个人资料失败', error)
            this.$message.error(error.response?.data?.message || '更新个人资料失败，请稍后再试')
          } finally {
            this.profileSubmitting = false
          }
        }
      })
    },
    
    // 显示更换头像对话框
    showChangeAvatarDialog() {
      this.selectedAvatar = null
      this.uploadedAvatar = null
      this.avatarFile = null
      this.avatarDialogVisible = true
    },
    
    // 选择默认头像
    selectAvatar(avatar) {
      this.selectedAvatar = avatar
      this.uploadedAvatar = null
      this.avatarFile = null
    },
    
    // 处理头像上传
    handleAvatarUpload(event) {
      const file = event.target.files[0]
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          this.$message.error('头像文件大小不能超过2MB')
          this.$refs.avatarUpload.value = ''
          return
        }
        
        this.avatarFile = file
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
          this.uploadedAvatar = reader.result
          this.selectedAvatar = null
        }
      }
    },
    
    // 更新头像
    async updateAvatar() {
      if (!this.selectedAvatar && !this.uploadedAvatar) {
        this.$message.warning('请选择头像或上传自定义头像')
        return
      }
      
      this.avatarSubmitting = true
      
      try {
        let avatarUrl = this.selectedAvatar
        
        // 如果是上传的自定义头像，先上传到服务器
        if (this.avatarFile) {
          const formData = new FormData()
          formData.append('avatar', this.avatarFile)
          
          const uploadResponse = await axios.post('/api/upload/avatar', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          
          if (uploadResponse.data.success) {
            avatarUrl = uploadResponse.data.url
          } else {
            throw new Error(uploadResponse.data.message || '上传头像失败')
          }
        }
        
        // 更新用户头像
        const response = await axios.put('/api/user/avatar', {
          avatar: avatarUrl
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (response.data.success) {
          // 更新本地存储的用户信息
          const userData = JSON.parse(localStorage.getItem('user') || '{}')
          userData.avatar = avatarUrl
          localStorage.setItem('user', JSON.stringify(userData))
          
          // 更新页面上的用户头像
          this.user.avatar = avatarUrl
          
          // 使用两种方式通知头像更新
          window.dispatchEvent(new Event('user-updated'))
          this.$eventBus.$emit('user-avatar-updated', avatarUrl)
          
          this.$message.success('头像已更新')
          this.avatarDialogVisible = false
        }
      } catch (error) {
        console.error('更新头像失败', error)
        this.$message.error(error.response?.data?.message || '更新头像失败，请稍后再试')
      } finally {
        this.avatarSubmitting = false
      }
    }
  }
}
</script>

<style scoped>
.profile {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  color: #333;
}

h2 {
  margin: 30px 0 20px;
  color: #333;
  font-size: 20px;
}

.user-info-card {
  margin-bottom: 2rem;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 2rem;
}

.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #4299e1;
  margin-bottom: 0.5rem;
}

.change-avatar-btn {
  font-size: 0.9rem;
}

.user-details {
  flex: 1;
}

.info-item {
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

.info-item strong {
  margin-right: 0.5rem;
}

.edit-btn {
  margin-left: 1rem;
}

.avatar-selection {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.default-avatars {
  margin-bottom: 20px;
}

.avatar-options {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 10px;
}

.avatar-option {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.avatar-option:hover {
  transform: scale(1.05);
}

.avatar-option.selected {
  border: 2px solid #4299e1;
}

.avatar-option img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.custom-avatar-upload {
  margin-top: 10px;
}

.avatar-upload-input {
  display: none;
}

.avatar-upload-label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 2px dashed #d9d9d9;
  cursor: pointer;
  margin-top: 10px;
}

.avatar-upload-label:hover {
  border-color: #4299e1;
}

.preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.change-avatar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  text-align: center;
  padding: 4px;
  font-size: 12px;
  transform: translateY(100%);
  transition: transform 0.3s;
}

.preview-container:hover .change-avatar {
  transform: translateY(0);
}

.upload-text {
  color: #606266;
  font-size: 14px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.filter-container {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
  align-items: center;
}

.search-input {
  flex: 3;
}

.category-filter {
  flex: 2;
}

.post-item {
  margin-bottom: 15px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.post-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.post-header {
  margin-bottom: 10px;
}

.post-title {
  font-size: 18px;
  color: #303133;
  text-decoration: none;
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

.post-title:hover {
  color: #409EFF;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  color: #909399;
  font-size: 13px;
}

.post-pinned {
  color: #E6A23C;
  font-weight: bold;
  display: flex;
  align-items: center;
}

.post-pinned i {
  margin-right: 2px;
}

.post-date {
  color: #909399;
}

.post-stats {
  margin-left: auto;
}

.post-stats i {
  margin-right: 3px;
  margin-left: 10px;
}

.post-content-preview {
  margin: 10px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.post-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  position: relative;
  z-index: 2;
}

.danger-button {
  color: #F56C6C;
}

.danger-button:hover {
  color: #F78989;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.loading-container {
  padding: 20px;
}

.empty-state {
  margin: 30px 0;
}

.editor-container {
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 20px;
}

.el-dialog__body {
  padding: 20px;
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