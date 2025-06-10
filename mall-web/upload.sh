#!/bin/bash

# 上传脚本 - 支持源码和构建文件上传
# 注意：当前 Dockerfile 已优化为直接使用构建后的 dist 文件
echo "🚀 开始上传项目文件..."

SERVER="root@39.107.74.208"
TARGET_DIR="/code/mall-web"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查是否有构建文件
if [ -d "dist" ]; then
    echo -e "${BLUE}📦 发现构建文件，选择上传方式：${NC}"
    echo "1) 上传构建后的文件 (dist目录) - 推荐"
    echo "2) 上传源码文件"
    read -p "请选择 (1/2): " choice

    if [ "$choice" = "1" ]; then
        echo -e "${YELLOW}� 上传构建文件到服务器...${NC}"

        # 上传dist目录（保持目录结构）
        echo "上传 dist 目录..."
        scp -r dist/ $SERVER:$TARGET_DIR/

        # 上传必要的配置文件和脚本
        echo "上传配置文件..."
        scp Dockerfile nginx.conf deploy.sh $SERVER:$TARGET_DIR/

        # 设置服务器上的文件权限
        echo "设置文件权限..."
        ssh $SERVER "cd $TARGET_DIR && chmod +x deploy.sh && chmod -R 755 dist/"

        echo -e "${GREEN}✅ 构建文件上传完成！${NC}"
        echo -e "${GREEN}🔗 现在可以SSH到服务器执行部署：${NC}"
        echo "ssh $SERVER"
        echo "cd $TARGET_DIR"
        echo "./deploy.sh"
        exit 0
    fi
fi

echo -e "${YELLOW}�📦 创建临时打包文件...${NC}"

# 创建要上传的文件列表
cat > upload_files.txt << EOF
package.json
package-lock.json
vite.config.ts
tsconfig.json
tsconfig.app.json
tsconfig.node.json
index.html
Dockerfile
nginx.conf
.dockerignore
deploy.sh
deploy-remote.sh
.env.production
README.md
DEPLOY-GUIDE.md
REFUND_FEATURE_README.md
REVIEW_FEATURE_README.md
项目文档整理.md
src/
public/
review-service/
EOF

echo -e "${YELLOW}📤 上传源码文件到服务器...${NC}"

# 创建临时打包文件（排除 node_modules）
tar --exclude='node_modules' --exclude='.git' -czf project.tar.gz -T upload_files.txt

# 上传打包文件到服务器
scp project.tar.gz $SERVER:$TARGET_DIR/

# 在服务器上解压
ssh $SERVER "cd $TARGET_DIR && tar -xzf project.tar.gz && rm project.tar.gz"

# 清理临时文件
rm upload_files.txt project.tar.gz

echo -e "${GREEN}✅ 源码上传完成！${NC}"
echo -e "${GREEN}🔗 现在可以SSH到服务器执行部署：${NC}"
echo "ssh $SERVER"
echo "cd $TARGET_DIR"
echo "./deploy.sh"
