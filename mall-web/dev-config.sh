#!/bin/bash

# 开发环境配置文件
# 此文件包含开发环境的所有配置变量

# 基础配置
export DEV_IMAGE_NAME="mall-web-dev"
export DEV_CONTAINER_NAME="mall-web-frontend-dev"
export DEV_PORT="3000"
export DEV_SERVER_IP="localhost"
export DEV_NODE_ENV="development"
export DEV_NETWORK_NAME="mall-dev-network"

# API配置
export DEV_API_BASE_URL="http://localhost:9999"
export DEV_GATEWAY_URL="http://localhost:9999"

# 数据库配置（如果需要）
export DEV_DB_HOST="localhost"
export DEV_DB_PORT="3306"
export DEV_DB_NAME="mall_dev"

# Redis配置（如果需要）
export DEV_REDIS_HOST="localhost"
export DEV_REDIS_PORT="6379"

# 文件上传配置
export DEV_UPLOAD_MAX_SIZE="10485760"  # 10MB
export DEV_UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,image/gif,image/webp"

# 开发工具配置
export DEV_HOT_RELOAD="true"
export DEV_DEBUG_MODE="true"
export DEV_SOURCE_MAP="true"

# Docker配置
export DEV_DOCKER_REGISTRY=""  # 留空使用本地镜像
export DEV_DOCKER_TAG="latest"
export DEV_RESTART_POLICY="unless-stopped"

# 健康检查配置
export DEV_HEALTH_CHECK_TIMEOUT="30"
export DEV_HEALTH_CHECK_INTERVAL="2"
export DEV_HEALTH_CHECK_PATH="/"

# 日志配置
export DEV_LOG_LEVEL="debug"
export DEV_LOG_FORMAT="json"

# 开发环境特定配置
export DEV_MOCK_API="false"
export DEV_CORS_ENABLED="true"
export DEV_PROXY_ENABLED="true"

# 颜色配置
export COLOR_RED='\033[0;31m'
export COLOR_GREEN='\033[0;32m'
export COLOR_YELLOW='\033[1;33m'
export COLOR_BLUE='\033[0;34m'
export COLOR_PURPLE='\033[0;35m'
export COLOR_CYAN='\033[0;36m'
export COLOR_NC='\033[0m'

# 函数：加载配置
load_dev_config() {
    echo "📋 加载开发环境配置..."
    
    # 检查是否有自定义配置文件
    if [ -f ".env.development.local" ]; then
        echo "🔧 发现本地开发配置文件，正在加载..."
        source .env.development.local
    fi
    
    echo "✅ 开发环境配置加载完成"
}

# 函数：显示配置信息
show_dev_config() {
    echo ""
    echo -e "${COLOR_CYAN}开发环境配置信息:${COLOR_NC}"
    echo -e "  镜像名称: ${COLOR_YELLOW}$DEV_IMAGE_NAME${COLOR_NC}"
    echo -e "  容器名称: ${COLOR_YELLOW}$DEV_CONTAINER_NAME${COLOR_NC}"
    echo -e "  端口: ${COLOR_YELLOW}$DEV_PORT${COLOR_NC}"
    echo -e "  API地址: ${COLOR_YELLOW}$DEV_API_BASE_URL${COLOR_NC}"
    echo -e "  网络: ${COLOR_YELLOW}$DEV_NETWORK_NAME${COLOR_NC}"
    echo -e "  环境: ${COLOR_YELLOW}$DEV_NODE_ENV${COLOR_NC}"
    echo ""
}

# 函数：验证配置
validate_dev_config() {
    local errors=0
    
    echo "🔍 验证开发环境配置..."
    
    # 检查必要的配置
    if [ -z "$DEV_IMAGE_NAME" ]; then
        echo -e "${COLOR_RED}❌ DEV_IMAGE_NAME 未设置${COLOR_NC}"
        ((errors++))
    fi
    
    if [ -z "$DEV_CONTAINER_NAME" ]; then
        echo -e "${COLOR_RED}❌ DEV_CONTAINER_NAME 未设置${COLOR_NC}"
        ((errors++))
    fi
    
    if [ -z "$DEV_PORT" ]; then
        echo -e "${COLOR_RED}❌ DEV_PORT 未设置${COLOR_NC}"
        ((errors++))
    fi
    
    if [ -z "$DEV_API_BASE_URL" ]; then
        echo -e "${COLOR_RED}❌ DEV_API_BASE_URL 未设置${COLOR_NC}"
        ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
        echo -e "${COLOR_GREEN}✅ 配置验证通过${COLOR_NC}"
        return 0
    else
        echo -e "${COLOR_RED}❌ 配置验证失败，发现 $errors 个错误${COLOR_NC}"
        return 1
    fi
}

# 如果直接执行此脚本，显示配置信息
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    load_dev_config
    show_dev_config
    validate_dev_config
fi
