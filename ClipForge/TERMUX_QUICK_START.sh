#!/bin/bash

# ClipForge Termux 32-bit Quick Start Script
# هذا السكريبت يقوم بتثبيت جميع المتطلبات وتشغيل المشروع

# ألوان للنص
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# دالة لعرض الرسائل
function message() {
    echo -e "${BLUE}[ClipForge Termux]${NC} $1"
}

function success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

function warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

function error() {
    echo -e "${RED}[✗]${NC} $1"
}

# التحقق من أن السكريبت يعمل ك root
if [ "$EUID" -eq 0 ]; then
    error "لا تعمل هذا السكريبت ك root"
    exit 1
fi

# التحقق من أن النظام هو Termux
if [ ! -d "$PREFIX" ]; then
    error "هذا السكريبت مخصص ل Termux فقط"
    exit 1
fi

# بداية السكريبت
clear
echo ""
echo "  ██████╗██╗░░░░░░██████╗░██████╗░██████╗░██████╗"
echo "  ██╔══██╗██║░░░░░░██╔══██╗██╔══██╗██╔══██╗██╔══██╗"
echo "  ██████╔╝██║░░░░░░██║░░██║██████╔╝██║░░██║██████╔╝"
echo "  ██╔══██╗██║░░░░░░██║░░██║██╔══██╗██║░░██║██╔══██╗"
echo "  ██║░░██║███████╗░██████╔╝██║░░██║██████╔╝██║░░██║"
echo "  ╚═╝░░╚═╝╚══════╝╚═════╝░╚═╝░░╚═╝╚═════╝░╚═╝░░╚═╝"
echo ""
echo "  ClipForge Termux 32-bit Auto Installer"
echo ""

# الخطوة 1: تحديث النظام
message "بدء تحديث النظام..."
pkg update -y > /dev/null 2>&1
pkg upgrade -y > /dev/null 2>&1
success "تم تحديث النظام"

# الخطوة 2: تثبيت المتطلبات
message "تثبيت المتطلبات الأساسية..."

# Node.js
if ! command -v node &> /dev/null; then
    message "تثبيت Node.js..."
    pkg install nodejs -y > /dev/null 2>&1
    if ! command -v node &> /dev/null; then
        error "فشل تثبيت Node.js"
        exit 1
    fi
    NODE_VERSION=$(node -v)
    success "تم تثبيت Node.js $NODE_VERSION"
else
    warning "Node.js مثبت مسبقًا: $(node -v)"
fi

# Git
if ! command -v git &> /dev/null; then
    message "تثبيت Git..."
    pkg install git -y > /dev/null 2>&1
    success "تم تثبيت Git"
else
    warning "Git مثبت مسبقًا"
fi

# Python
if ! command -v python &> /dev/null; then
    message "تثبيت Python..."
    pkg install python -y > /dev/null 2>&1
    success "تم تثبيت Python"
else
    warning "Python مثبت مسبقًا"
fi

# FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    message "تثبيت FFmpeg..."
    pkg install ffmpeg -y > /dev/null 2>&1
    success "تم تثبيت FFmpeg"
else
    warning "FFmpeg مثبت مسبقًا"
fi

# curl
if ! command -v curl &> /dev/null; then
    message "تثبيت curl..."
    pkg install curl -y > /dev/null 2>&1
    success "تم تثبيت curl"
else
    warning "curl مثبت مسبقًا"
fi

# التحقق من إصدار Node.js
NODE_MAJOR=$(node -v | cut -d. -f1 | tr -d 'v')
if [ "$NODE_MAJOR" -lt 16 ]; then
    error "Node.js إصدار $NODE_MAJOR غير كافي. مطلوب ≥16"
    exit 1
fi

# الخطوة 3: تثبيت yt-dlp
message "تثبيت yt-dlp..."
if ! command -v yt-dlp &> /dev/null; then
    pip install yt-dlp > /dev/null 2>&1
    if ! command -v yt-dlp &> /dev/null; then
        error "فشل تثبيت yt-dlp"
        exit 1
    fi
    success "تم تثبيت yt-dlp"
else
    warning "yt-dlp مثبت مسبقًا"
fi

# الخطوة 4: استنساخ المشروع
message "استنساخ المشروع..."
if [ ! -d "no-code" ]; then
    git clone https://github.com/machbrandido-art/no-code.git > /dev/null 2>&1
    if [ ! -d "no-code" ]; then
        error "فشل استنساخ المشروع"
        exit 1
    fi
    cd no-code/ClipForge
    success "تم استنساخ المشروع"
else
    warning "المشروع موجود مسبقًا"
    cd no-code/ClipForge
fi

# الخطوة 5: تثبيت حزم المشروع
message "تثبيت حزم المشروع (قد يستغرق وقتًا)..."
npm install --legacy-peer-deps > /dev/null 2>&1
if [ $? -ne 0 ]; then
    error "فشل تثبيت حزم المشروع"
    warning "جرب: npm install --legacy-peer-deps يدويًا"
    exit 1
fi
success "تم تثبيت حزم المشروع"

# الخطوة 6: تثبيت حزم الويب
message "تثبيت حزم تطبيق الويب..."
cd apps/web
npm install --legacy-peer-deps > /dev/null 2>&1
if [ $? -ne 0 ]; then
    error "فشل تثبيت حزم الويب"
    warning "جرب: cd apps/web && npm install --legacy-peer-deps يدويًا"
    exit 1
fi
success "تم تثبيت حزم الويب"

# الخطوة 7: عرض التعليمات
clear
echo ""
echo "  ██████╗██╗░░░░░░██████╗░██████╗░██████╗░██████╗"
echo "  ██╔══██╗██║░░░░░░██╔══██╗██╔══██╗██╔══██╗██╔══██╗"
echo "  ██████╔╝██║░░░░░░██║░░██║██████╔╝██║░░██║██████╔╝"
echo "  ██╔══██╗██║░░░░░░██║░░██║██╔══██╗██║░░██║██╔══██╗"
echo "  ██║░░██║███████╗░██████╔╝██║░░██║██████╔╝██║░░██║"
echo "  ╚═╝░░╚═╝╚══════╝╚═════╝░╚═╝░░╚═╝╚═════╝░╚═╝░░╚═╝"
echo ""
echo ""
echo "${GREEN}✓ تم تثبيت ClipForge بنجاح على Termux 32-bit!${NC}"
echo ""
echo "  لتشغيل التطبيق:"
echo ""
echo "  ${YELLOW}1. الانتقال إلى مجلد المشروع:${NC}"
echo "     cd ~/no-code/ClipForge/apps/web"
echo ""
echo "  ${YELLOW}2. تشغيل في وضع التطوير:${NC}"
echo "     npm run dev"
echo ""
echo "  ${YELLOW}3. الوصول إلى التطبيق:${NC}"
echo "     - من Termux: lynx http://localhost:3000"
echo "     - من المتصفح: http://localhost:3000"
echo "     - مع ngrok: ./ngrok http 3000 (في Terminal آخر)"
echo ""
echo "  ${YELLOW}للمساعدة:${NC}"
echo "     cat ~/no-code/ClipForge/TERMUX_32BIT_GUIDE.md"
echo ""
echo "  ${BLUE}متطلبات إضافية (اختيارية):${NC}"
echo "     - ngrok للوصول الخارجي"
echo "     - lynx لمتصفح نصي"
echo ""
echo ""

# عرض معلومات النظام
echo "${BLUE}معلومات النظام:${NC}"
echo "  - Node.js: $(node -v)"
echo "  - npm: $(npm -v)"
echo "  - yt-dlp: $(yt-dlp --version 2>/dev/null || echo 'غير مثبت')"
echo "  - FFmpeg: $(ffmpeg -version 2>/dev/null | head -1 || echo 'غير مثبت')"
echo "  - المساحة الحرة: $(df -h / | awk 'NR==2 {print $4}')"
echo ""
