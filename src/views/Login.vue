<template>
  <div class="login">
    <div class="card">
      <h2>AI论坛 - 账号登录</h2>
      <form @submit.prevent="login">
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
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            class="form-control" 
            required
          >
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        
        <div class="register-link">
          还没有账号？ <router-link to="/register">立即注册</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Login',
  data() {
    return {
      username: '',
      password: '',
      loading: false,
      error: null
    }
  },
  methods: {
    async login() {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/auth/login', {
          username: this.username,
          password: this.password
        })
        
        // 保存token和用户信息
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
          this.error = '登录失败，请稍后再试'
        }
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login {
  max-width: 500px;
  margin: 0 auto;
}

.login h2 {
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

.register-link {
  margin-top: 1rem;
  text-align: center;
}

.register-link a {
  color: #4299e1;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>