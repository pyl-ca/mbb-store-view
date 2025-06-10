import axios from 'axios'
import type { Product, ProductFilter, ProductListResponse } from '../types/product'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9999'

export const productApi = {
  async getProducts(filter: ProductFilter): Promise<ProductListResponse> {
    const response = await axios.get(`${API_BASE_URL}/products`, {
      params: filter
    })
    return response.data
  },

  async getProductById(id: number): Promise<Product> {
    const response = await axios.get(`${API_BASE_URL}/products/${id}`)
    return response.data
  },

  async getCategories() {
    const response = await axios.get(`${API_BASE_URL}/categories`)
    return response.data
  }
}
