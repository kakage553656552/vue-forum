<template>
  <div id="app">
    <header class="header">
      <div class="container">
        <div class="logo">
          <h1><router-link to="/" class="logo-link">AI论坛</router-link></h1>
        </div>
        <nav class="nav">
          <ul>
            <li><router-link to="/" exact active-class="active">首页</router-link></li>
            <li><router-link to="/categories" active-class="active">分类</router-link></li>
            <li v-if="isLoggedIn"><router-link to="/create-post" class="create-post-link" active-class="active">发布帖子</router-link></li>
            <li v-if="isAdmin"><router-link to="/user-management" class="admin-link" active-class="active">用户管理</router-link></li>
            <li v-if="!isLoggedIn"><router-link to="/login" active-class="active">登录</router-link></li>
            <li v-if="!isLoggedIn"><router-link to="/register" active-class="active">注册</router-link></li>
          </ul>
        </nav>
        <div v-if="isLoggedIn" class="user-avatar">
          <el-dropdown trigger="click">
            <div class="avatar-container">
              <img :src="userAvatar" alt="用户头像" class="avatar-img">
            </div>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item>
                <router-link to="/profile" class="dropdown-link">个人中心</router-link>
              </el-dropdown-item>
              <el-dropdown-item divided>
                <a href="#" @click.prevent="logout" class="dropdown-link">退出登录</a>
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>
    </header>
    
    <main class="main">
      <div class="container">
        <router-view></router-view>
      </div>
    </main>
    
    <footer class="footer">
      <div class="container">
        <p>&copy; {{ new Date().getFullYear() }} AI论坛</p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      defaultAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    }
  },
  computed: {
    isLoggedIn() {
      return this.$root.$data.isLoggedIn;
    },
    isAdmin() {
      const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
      return this.isLoggedIn && user && user.role === 'admin';
    },
    userAvatar() {
      const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
      return user && user.avatar ? user.avatar : this.defaultAvatar;
    }
  },
  created() {
    // 监听用户信息更新事件
    window.addEventListener('user-updated', this.handleUserUpdated);
    
    // 使用事件总线监听头像更新
    this.$eventBus.$on('user-avatar-updated', this.handleAvatarUpdated);
  },
  beforeDestroy() {
    // 移除事件监听
    window.removeEventListener('user-updated', this.handleUserUpdated);
    
    // 移除事件总线监听
    this.$eventBus.$off('user-avatar-updated', this.handleAvatarUpdated);
  },
  methods: {
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      this.$root.$data.isLoggedIn = false
      this.$router.push('/login')
    },
    // 处理用户信息更新事件
    handleUserUpdated() {
      // 触发计算属性更新
      this.$forceUpdate();
    },
    // 处理头像更新事件
    handleAvatarUpdated(avatarUrl) {
      // 直接更新不需计算属性依赖的用户存储
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      userData.avatar = avatarUrl
      localStorage.setItem('user', JSON.stringify(userData))
      
      // 强制更新视图
      this.$forceUpdate();
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

.header {
  background-color: #4a5568;
  color: white;
  padding: 1rem 0;
  width: 100%;
}

.header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
  max-width: none;
  width: 100%;
}

.logo {
  margin-right: 1rem;
  flex-shrink: 0;
}

.logo h1 {
  font-size: 1.5rem;
  font-weight: 700;
  white-space: nowrap;
}

.logo-link {
  color: white;
  text-decoration: none;
  transition: color 0.3s;
}

.logo-link:hover {
  color: #cbd5e0;
}

.nav {
  flex: 1;
  display: flex;
  justify-content: center;
}

.nav ul {
  display: flex;
  list-style: none;
}

.nav li {
  margin-left: 1.5rem;
}

.nav a {
  color: white;
  text-decoration: none;
  font-weight: normal;
  transition: color 0.3s;
}

.nav a:hover {
  color: #cbd5e0;
}

.main {
  padding: 2rem 0;
  min-height: calc(100vh - 130px);
}

.footer {
  background-color: #2d3748;
  color: white;
  padding: 1rem 0;
  text-align: center;
}

.card {
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.btn {
  display: inline-block;
  background-color: #4a5568;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.btn:hover {
  background-color: #2d3748;
}

.btn-primary {
  background-color: #4299e1;
}

.btn-primary:hover {
  background-color: #3182ce;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  font-size: 1rem;
}

.create-post-link {
  color: white !important;
}

.create-post-link:hover {
  color: #cbd5e0 !important;
}

.admin-link {
  color: white !important;
}

.admin-link:hover {
  color: #cbd5e0 !important;
}

.nav a.active {
  color: #4cd964;
  font-weight: bold;
}

.create-post-link.active {
  color: #4cd964 !important;
}

.admin-link.active {
  color: #4cd964 !important;
}

.user-avatar {
  display: flex;
  align-items: center;
  margin-left: 1rem;
  flex-shrink: 0;
}

.avatar-container {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid #ffffff;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dropdown-link {
  text-decoration: none;
  color: #333;
  display: block;
  width: 100%;
}
</style>