import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product, ProductFilter, ProductListResponse } from '../types/product'
import { productApi } from '../api/product'

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([])
  const totalProducts = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(12)
  const loading = ref(false)
  const currentFilter = ref<ProductFilter>({
    page: 1,
    pageSize: 12
  })

  const filteredProducts = computed(() => products.value)

  async function fetchProducts(filter?: Partial<ProductFilter>) {
    try {
      loading.value = true
      const newFilter = { ...currentFilter.value, ...filter }
      const response = await productApi.getProducts(newFilter)
      products.value = response.items
      totalProducts.value = response.total
      currentFilter.value = newFilter
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function getProductById(id: number) {
    try {
      return await productApi.getProductById(id)
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  }

  return {
    products,
    totalProducts,
    currentPage,
    pageSize,
    loading,
    filteredProducts,
    fetchProducts,
    getProductById
  }
})
