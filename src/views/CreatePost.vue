<template>
  <div class="create-post">
    <div class="card">
      <h2>AI论坛 - 发布新帖子</h2>
      <form @submit.prevent="submitPost">
        <div class="form-group">
          <label for="title">标题</label>
          <input 
            type="text" 
            id="title" 
            v-model="title" 
            class="form-control" 
            required
          >
        </div>
        
        <div class="form-group">
          <label for="category">分类</label>
          <select 
            id="category" 
            v-model="categoryId" 
            class="form-control" 
            required
          >
            <option value="" disabled>选择分类</option>
            <option 
              v-for="category in categories" 
              :key="category.id" 
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="content">内容</label>
          <div class="editor-container">
            <Toolbar
              style="border-bottom: 1px solid #ccc"
              :editor="editor"
              :defaultConfig="toolbarConfig"
              :mode="mode"
            />
            <Editor
              style="height: 400px; overflow-y: hidden;"
              v-model="content"
              :defaultConfig="editorConfig"
              :mode="mode"
              @onCreated="onEditorCreated"
            />
          </div>
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          {{ submitting ? '发布中...' : '发布帖子' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { shallowRef } from 'vue'

export default {
  name: 'CreatePost',
  components: {
    Editor,
    Toolbar
  },
  data() {
    return {
      title: '',
      categoryId: '',
      content: '',
      categories: [],
      submitting: false,
      error: null,
      mode: 'default',
      editor: null,
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
      }
    }
  },
  created() {
    this.checkLoginStatus()
    this.fetchCategories()
  },
  beforeDestroy() {
    // 销毁编辑器
    const editor = this.editor
    if (editor == null) return
    editor.destroy()
  },
  methods: {
    onEditorCreated(editor) {
      this.editor = Object.seal(editor) // 必须使用 Object.seal()
    },
    checkLoginStatus() {
      const token = localStorage.getItem('token')
      if (!token) {
        // 未登录，跳转到登录页
        this.$router.push('/login')
      }
    },
    async fetchCategories() {
      try {
        const response = await axios.get('/api/categories')
        this.categories = response.data
      } catch (error) {
        console.error('获取分类失败:', error)
        this.error = '获取分类失败，请刷新页面重试'
      }
    },
    async submitPost() {
      this.submitting = true
      this.error = null
      
      try {
        const token = localStorage.getItem('token')
        
        const response = await axios.post(
          '/api/posts',
          {
            title: this.title,
            categoryId: this.categoryId,
            content: this.content
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        
        // 发布成功，跳转到帖子详情页
        this.$router.push(`/post/${response.data.id}`)
      } catch (error) {
        if (error.response && error.response.data.message) {
          this.error = error.response.data.message
        } else {
          this.error = '发布帖子失败，请稍后再试'
        }
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.create-post {
  max-width: 800px;
  margin: 0 auto;
}

.create-post h2 {
  margin-bottom: 1.5rem;
  color: #2d3748;
}

.error-message {
  color: #e53e3e;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: #fff5f5;
  border-radius: 4px;
}

.editor-container {
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 20px;
}
</style>