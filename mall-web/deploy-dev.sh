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

# 显示帮助信息
show_help() {
    echo ""
    echo -e "${BLUE}Mall Web 前端开发工具${NC}"
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

# 健康检查
health_check() {
    log_step "执行健康检查..."

    local max_attempts=30
    local attempt=1
    local health_url="http://$SERVER_IP:$PORT"

    log_info "等待容器启动..."
    sleep 3

    while [ $attempt -le $max_attempts ]; do
        log_info "健康检查尝试 $attempt/$max_attempts..."

        # 检查容器是否运行
        if ! docker ps | grep -q $CONTAINER_NAME; then
            log_error "容器未运行"
            docker logs $CONTAINER_NAME
            exit 1
        fi

        # 检查HTTP响应
        if curl -f -s $health_url > /dev/null 2>&1; then
            log_success "健康检查通过"
            return 0
        fi

        sleep 2
        ((attempt++))
    done

    log_warning "健康检查超时，但容器可能仍在启动中"
    return 1
}

# 显示部署结果
show_deployment_result() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}           部署完成 (开发环境)           ${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""

    # 容器信息
    echo -e "${BLUE}📊 容器信息:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep $CONTAINER_NAME || true
    echo ""

    # 访问信息
    echo -e "${GREEN}� 访问地址:${NC}"
    echo -e "   主页: ${CYAN}http://$SERVER_IP:$PORT${NC}"
    echo -e "   健康检查: ${CYAN}http://$SERVER_IP:$PORT/health${NC}"
    echo ""

    # 开发工具
    echo -e "${PURPLE}🛠️  开发工具:${NC}"
    echo -e "   实时日志: ${YELLOW}docker logs -f $CONTAINER_NAME${NC}"
    echo -e "   进入容器: ${YELLOW}docker exec -it $CONTAINER_NAME sh${NC}"
    echo -e "   重启容器: ${YELLOW}docker restart $CONTAINER_NAME${NC}"
    echo -e "   停止容器: ${YELLOW}docker stop $CONTAINER_NAME${NC}"
    echo ""

    # 网络信息
    echo -e "${BLUE}🌐 网络信息:${NC}"
    echo -e "   网络名称: $NETWORK_NAME"
    echo -e "   容器IP: $(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $CONTAINER_NAME 2>/dev/null || echo '获取失败')"
    echo ""

    # 环境信息
    echo -e "${BLUE}⚙️  环境信息:${NC}"
    echo -e "   环境: $NODE_ENV"
    echo -e "   镜像: $IMAGE_NAME"
    echo -e "   API地址: http://localhost:9999"
    echo ""

    # 快速命令
    echo -e "${YELLOW}⚡ 快速命令:${NC}"
    echo -e "   查看实时日志: ${CYAN}./deploy-dev.sh logs${NC}"
    echo -e "   重新部署: ${CYAN}./deploy-dev.sh${NC}"
    echo -e "   停止服务: ${CYAN}./deploy-dev.sh stop${NC}"
    echo ""
}

# 命令行参数处理
handle_command() {
    case "${1:-deploy}" in
        "deploy"|"")
            log_info "执行完整部署流程..."
            check_requirements
            create_network
            cleanup_old_resources
            build_image
            start_container
            health_check
            show_deployment_result
            ;;
        "logs")
            log_info "显示容器日志..."
            if docker ps | grep -q $CONTAINER_NAME; then
                docker logs -f $CONTAINER_NAME
            else
                log_error "容器 $CONTAINER_NAME 未运行"
                exit 1
            fi
            ;;
        "stop")
            log_info "停止开发环境..."
            docker stop $CONTAINER_NAME 2>/dev/null || true
            docker rm $CONTAINER_NAME 2>/dev/null || true
            log_success "开发环境已停止"
            ;;
        "restart")
            log_info "重启开发环境..."
            docker restart $CONTAINER_NAME 2>/dev/null || {
                log_warning "容器不存在，执行完整部署..."
                handle_command "deploy"
            }
            ;;
        "status")
            log_info "检查开发环境状态..."
            echo ""
            if docker ps | grep -q $CONTAINER_NAME; then
                echo -e "${GREEN}✅ 容器运行中${NC}"
                docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep $CONTAINER_NAME
                echo ""
                echo -e "${BLUE}访问地址: http://$SERVER_IP:$PORT${NC}"
            else
                echo -e "${RED}❌ 容器未运行${NC}"
            fi
            ;;
        "clean")
            log_info "清理开发环境资源..."
            docker stop $CONTAINER_NAME 2>/dev/null || true
            docker rm $CONTAINER_NAME 2>/dev/null || true
            docker rmi $IMAGE_NAME 2>/dev/null || true
            docker network rm $NETWORK_NAME 2>/dev/null || true
            log_success "开发环境资源已清理"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 显示帮助信息
show_help() {
    echo ""
    echo -e "${CYAN}Mall Web 开发环境部署脚本${NC}"
    echo ""
    echo -e "${YELLOW}用法:${NC}"
    echo "  $0 [命令]"
    echo ""
    echo -e "${YELLOW}命令:${NC}"
    echo "  deploy    执行完整部署流程 (默认)"
    echo "  logs      显示容器实时日志"
    echo "  stop      停止开发环境"
    echo "  restart   重启开发环境"
    echo "  status    检查环境状态"
    echo "  clean     清理所有资源"
    echo "  help      显示此帮助信息"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo "  $0              # 执行部署"
    echo "  $0 logs         # 查看日志"
    echo "  $0 status       # 检查状态"
    echo ""
}

# 主函数
main() {
    # 显示脚本信息
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}    Mall Web 开发环境部署脚本 v2.0      ${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""

    # 处理命令
    handle_command "$1"
}

# 执行主函数
main "$1"
