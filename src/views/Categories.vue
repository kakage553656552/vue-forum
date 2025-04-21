<template>
  <div class="categories">
    <h1>AI论坛 - 分类列表</h1>
    
    <div class="category-list" v-if="categories.length">
      <div v-for="category in categories" :key="category.id" class="category-item">
        <h3>{{ category.name }}</h3>
        <p>{{ category.description }}</p>
        <div class="category-stats">
          <span>主题数量: {{ category.topicCount || 0 }}</span>
          <span>帖子数量: {{ category.postCount || 0 }}</span>
        </div>
        <button @click="navigateToCategory(category.id)" class="btn-view">浏览分类</button>
      </div>
    </div>
    
    <div v-else-if="loading" class="loading">
      正在加载分类...
    </div>
    
    <div v-else class="no-categories">
      暂无分类数据
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Categories',
  data() {
    return {
      categories: [],
      loading: true
    }
  },
  created() {
    this.fetchCategories()
  },
  methods: {
    async fetchCategories() {
      try {
        const response = await axios.get('/api/categories')
        this.categories = response.data
        this.loading = false
      } catch (error) {
        console.error('获取分类失败:', error)
        this.loading = false
      }
    },
    navigateToCategory(categoryId) {
      this.$router.push(`/category/${categoryId}`)
    }
  }
}
</script>

<style scoped>
.categories {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  margin-bottom: 30px;
  color: #333;
  text-align: center;
}

.category-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.category-item {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.category-item h3 {
  margin-top: 0;
  color: #2c3e50;
}

.category-stats {
  display: flex;
  justify-content: space-between;
  margin: 15px 0;
  font-size: 0.9rem;
  color: #666;
}

.btn-view {
  width: 100%;
  padding: 8px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-view:hover {
  background-color: #3aa876;
}

.loading, .no-categories {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style> 