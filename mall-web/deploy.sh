#!/bin/bash

# Mall Web 前端项目部署脚本
# 服务器IP: 39.107.74.208

echo "🚀 开始部署 Mall Web 前端项目..."

# 设置变量
IMAGE_NAME="mall-web"
CONTAINER_NAME="mall-web-frontend"
PORT="80"
SERVER_IP="39.107.74.208"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 停止并删除旧容器...${NC}"
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

echo -e "${YELLOW}🗑️ 删除旧镜像...${NC}"
docker rmi $IMAGE_NAME 2>/dev/null || true

echo -e "${YELLOW}🔨 构建新镜像...${NC}"
if docker build -t $IMAGE_NAME .; then
    echo -e "${GREEN}✅ 镜像构建成功${NC}"
else
    echo -e "${RED}❌ 镜像构建失败${NC}"
    exit 1
fi

echo -e "${YELLOW}🚀 启动新容器...${NC}"
if docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:80 \
  --restart unless-stopped \
  $IMAGE_NAME; then
    echo -e "${GREEN}✅ 容器启动成功${NC}"
else
    echo -e "${RED}❌ 容器启动失败${NC}"
    exit 1
fi

# 等待容器启动
echo -e "${YELLOW}⏳ 等待容器启动...${NC}"
sleep 5

# 检查容器状态
if docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${GREEN}✅ 容器运行正常${NC}"
    echo ""
    echo "📊 容器信息:"
    docker ps | grep $CONTAINER_NAME
    echo ""
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo -e "${GREEN}🌐 访问地址: http://$SERVER_IP${NC}"
    echo -e "${GREEN}🔍 健康检查: http://$SERVER_IP/health${NC}"
else
    echo -e "${RED}❌ 容器启动失败${NC}"
    echo "查看容器日志:"
    docker logs $CONTAINER_NAME
    exit 1
fi

# 显示有用的命令
echo ""
echo "📝 常用命令:"
echo "  查看日志: docker logs -f $CONTAINER_NAME"
echo "  停止容器: docker stop $CONTAINER_NAME"
echo "  重启容器: docker restart $CONTAINER_NAME"
echo "  进入容器: docker exec -it $CONTAINER_NAME sh"
