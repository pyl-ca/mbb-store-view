#!/bin/bash

# Mall Web 前端开发工具
# 简化的前端开发脚本

echo "🚀 Mall Web 前端开发工具"

# 基础配置
PORT="5173"
API_URL="http://localhost:9999"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# 检查 Node.js 和 npm
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        echo "请安装 Node.js: https://nodejs.org/"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm 未安装${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js $(node --version) 和 npm $(npm --version) 已安装${NC}"
}

# 安装依赖
install_deps() {
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        echo -e "${YELLOW}📦 安装依赖...${NC}"
        npm install
        echo -e "${GREEN}✅ 依赖安装完成${NC}"
    else
        echo -e "${BLUE}ℹ️  依赖已是最新${NC}"
    fi
}

# 启动开发服务器
start_dev_server() {
    echo -e "${YELLOW}🚀 启动开发服务器...${NC}"
    echo -e "${BLUE}📍 访问地址: http://localhost:$PORT${NC}"
    echo -e "${BLUE}🔗 API地址: $API_URL${NC}"
    echo ""
    echo -e "${YELLOW}按 Ctrl+C 停止服务器${NC}"
    echo ""
    
    # 启动 Vite 开发服务器
    npm run dev
}

# 构建生产版本
build_production() {
    echo -e "${YELLOW}🔨 构建生产版本...${NC}"
    npm run build
    
    if [ -d "dist" ]; then
        echo -e "${GREEN}✅ 构建完成！${NC}"
        echo -e "${BLUE}📁 构建文件位于: ./dist${NC}"
        
        # 显示构建文件大小
        if command -v du &> /dev/null; then
            DIST_SIZE=$(du -sh dist | cut -f1)
            echo -e "${BLUE}📊 构建大小: $DIST_SIZE${NC}"
        fi
    else
        echo -e "${RED}❌ 构建失败${NC}"
        exit 1
    fi
}

# 预览生产版本
preview_production() {
    if [ ! -d "dist" ]; then
        echo -e "${YELLOW}📦 dist 目录不存在，先构建...${NC}"
        build_production
    fi
    
    echo -e "${YELLOW}👀 预览生产版本...${NC}"
    echo -e "${BLUE}📍 预览地址: http://localhost:4173${NC}"
    echo ""
    npm run preview
}

# 清理构建文件
clean_build() {
    echo -e "${YELLOW}🧹 清理构建文件...${NC}"
    
    if [ -d "dist" ]; then
        rm -rf dist
        echo -e "${GREEN}✅ dist 目录已清理${NC}"
    fi
    
    if [ -d "node_modules/.cache" ]; then
        rm -rf node_modules/.cache
        echo -e "${GREEN}✅ 缓存已清理${NC}"
    fi
    
    echo -e "${GREEN}✅ 清理完成${NC}"
}

# 显示帮助信息
show_help() {
    echo ""
    echo -e "${CYAN}Mall Web 前端开发工具${NC}"
    echo ""
    echo -e "${YELLOW}用法:${NC}"
    echo "  $0 [命令]"
    echo ""
    echo -e "${YELLOW}命令:${NC}"
    echo "  dev       启动开发服务器 (默认)"
    echo "  build     构建生产版本"
    echo "  preview   预览生产版本"
    echo "  clean     清理构建文件"
    echo "  deps      安装/更新依赖"
    echo "  help      显示帮助信息"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo "  $0              # 启动开发服务器"
    echo "  $0 dev          # 启动开发服务器"
    echo "  $0 build        # 构建生产版本"
    echo "  $0 preview      # 预览生产版本"
    echo ""
    echo -e "${YELLOW}开发地址:${NC}"
    echo "  开发服务器: http://localhost:$PORT"
    echo "  API服务器: $API_URL"
    echo ""
}

# 主函数
main() {
    case "${1:-dev}" in
        "dev"|"")
            check_node
            install_deps
            start_dev_server
            ;;
        "build")
            check_node
            install_deps
            build_production
            ;;
        "preview")
            check_node
            install_deps
            preview_production
            ;;
        "clean")
            clean_build
            ;;
        "deps")
            check_node
            echo -e "${YELLOW}📦 安装/更新依赖...${NC}"
            npm install
            echo -e "${GREEN}✅ 依赖更新完成${NC}"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            echo -e "${RED}❌ 未知命令: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$1"
