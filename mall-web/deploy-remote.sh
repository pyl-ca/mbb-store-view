#!/bin/bash

# 远程部署脚本 - 从本地到服务器的完整部署流程
echo "🚀 开始远程部署 Mall Web 项目..."

# 配置变量
SERVER="root@39.107.74.208"
TARGET_DIR="/code/mall-web"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查必要文件
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 请在项目根目录执行此脚本${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 步骤1: 上传项目文件到服务器...${NC}"

# 使用 rsync 上传，排除不必要的文件
rsync -avz --progress \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='*.log' \
    --exclude='.vscode' \
    --exclude='.idea' \
    . $SERVER:$TARGET_DIR/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 文件上传成功${NC}"
else
    echo -e "${RED}❌ 文件上传失败${NC}"
    exit 1
fi

echo -e "${YELLOW}🐳 步骤2: 在服务器上执行 Docker 部署...${NC}"

# 在服务器上执行部署命令
ssh $SERVER << 'ENDSSH'
    cd /code/mall-web
    
    echo "🔧 设置执行权限..."
    chmod +x deploy.sh
    
    echo "🚀 开始 Docker 构建和部署..."
    ./deploy.sh
    
    echo "📊 检查部署状态..."
    if docker ps | grep -q mall-web-frontend; then
        echo "✅ 部署成功！"
        echo "🌐 访问地址: http://39.107.74.208"
        echo "🔍 健康检查: http://39.107.74.208/health"
    else
        echo "❌ 部署失败，查看日志:"
        docker logs mall-web-frontend
        exit 1
    fi
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 远程部署完成！${NC}"
    echo -e "${GREEN}🌐 访问地址: http://39.107.74.208${NC}"
    echo -e "${GREEN}🔍 健康检查: http://39.107.74.208/health${NC}"
else
    echo -e "${RED}❌ 远程部署失败${NC}"
    exit 1
fi
