<template>
  <div class="register">
    <div class="card">
      <h2>注册</h2>
      <form @submit.prevent="register">
        <div class="form-group">
          <label for="username">用户名</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            class="form-control" 
            required
          >
        </div>
        
        <div class="form-group">
          <label for="email">邮箱</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            class="form-control" 
            required
          >
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            class="form-control" 
            required
          >
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="confirmPassword" 
            class="form-control" 
            required
          >
        </div>
        
        <div class="form-group">
          <label>选择头像</label>
          <div class="avatar-selection">
            <div class="default-avatars">
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
            
            <div class="custom-avatar-upload">
              <p>或者上传自己的头像</p>
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
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
        
        <div class="login-link">
          已有账号？ <router-link to="/login">立即登录</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Register',
  data() {
    return {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      loading: false,
      error: null,
      defaultAvatars: [
        'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
        'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png',
        'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png',
        'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg'
      ],
      selectedAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
      uploadedAvatar: null,
      avatarFile: null
    }
  },
  methods: {
    selectAvatar(avatar) {
      this.selectedAvatar = avatar;
      this.uploadedAvatar = null;
      this.avatarFile = null;
    },
    
    handleAvatarUpload(event) {
      const file = event.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          this.error = '头像文件大小不能超过2MB';
          this.$refs.avatarUpload.value = '';
          return;
        }
        
        this.avatarFile = file;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          this.uploadedAvatar = reader.result;
          this.selectedAvatar = null;
        };
      }
    },
    
    async uploadAvatarToServer() {
      if (!this.avatarFile && !this.selectedAvatar) {
        return this.defaultAvatars[0];
      }
      
      if (!this.avatarFile) {
        return this.selectedAvatar;
      }
      
      const formData = new FormData();
      formData.append('avatar', this.avatarFile);
      
      try {
        const response = await axios.post('/api/upload/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        return response.data.url;
      } catch (error) {
        console.error('上传头像失败', error);
        throw new Error('上传头像失败');
      }
    },
    
    async register() {
      // 验证密码是否匹配
      if (this.password !== this.confirmPassword) {
        this.error = '两次输入的密码不一致'
        return
      }
      
      this.loading = true
      this.error = null
      
      try {
        const avatarUrl = await this.uploadAvatarToServer()
        
        const response = await axios.post('/api/auth/register', {
          username: this.username,
          email: this.email,
          password: this.password,
          avatar: avatarUrl
        })
        
        // 注册成功后自动登录
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        // 更新App.vue中的登录状态
        this.$root.$data.isLoggedIn = true
        
        // 跳转到首页
        this.$router.push('/')
      } catch (error) {
        if (error.response && error.response.data.message) {
          this.error = error.response.data.message
        } else {
          this.error = '注册失败，请稍后再试'
        }
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.register {
  max-width: 500px;
  margin: 0 auto;
}

.register h2 {
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

.login-link {
  margin-top: 1rem;
  text-align: center;
}

.login-link a {
  color: #4299e1;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}

.avatar-selection {
  margin-top: 10px;
}

.default-avatars {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
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
  margin-top: 20px;
}

.custom-avatar-upload p {
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
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
</style>