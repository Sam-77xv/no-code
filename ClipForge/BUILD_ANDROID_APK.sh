#!/bin/bash

# ClipForge Android APK Builder
# هذا السكريبت يبني تطبيق ClipForge ك APK باستخدام Tauri

# ألوان للنص
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# دالة لعرض الرسائل
function message() {
    echo -e "${BLUE}[ClipForge Android]${NC} $1"
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

# التحقق من أن السكريبت يعمل على نظام مناسب
if [ "$(uname -m)" != "x86_64" ] && [ "$(uname -m)" != "aarch64" ]; then
    error "هذا السكريبت يتطلب نظام 64-bit (x86_64 أو aarch64)"
    exit 1
fi

# التحقق من أن النظام ليس Termux (لأن Tauri requires full system)
if [ -d "$PREFIX" ]; then
    error "هذا السكريبت لا يعمل على Termux. استخدم جهاز كمبيوتر."
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
echo "  ClipForge Android APK Builder"
echo ""

# الخطوة 1: التحقق من المتطلبات
message "التحقق من المتطلبات..."

# التحقق من Node.js
if ! command -v node &> /dev/null; then
    error "Node.js غير مثبت. الرجاء تثبيت Node.js ≥18.0.0"
    exit 1
fi

NODE_VERSION=$(node -v)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1 | tr -d 'v')
if [ "$NODE_MAJOR" -lt 18 ]; then
    error "Node.js إصدار $NODE_VERSION غير كافي. مطلوب ≥18.0.0"
    exit 1
fi
success "Node.js $NODE_VERSION مثبت"

# التحقق من npm/pnpm
if ! command -v pnpm &> /dev/null; then
    message "تثبيت pnpm..."
    npm install -g pnpm > /dev/null 2>&1
    if ! command -v pnpm &> /dev/null; then
        error "فشل تثبيت pnpm"
        exit 1
    fi
    success "تم تثبيت pnpm"
else
    success "pnpm مثبت مسبقًا"
fi

# التحقق من Rust
if ! command -v rustc &> /dev/null; then
    message "تثبيت Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y > /dev/null 2>&1
    source "$HOME/.cargo/env"
    if ! command -v rustc &> /dev/null; then
        error "فشل تثبيت Rust"
        exit 1
    fi
    success "تم تثبيت Rust"
else
    success "Rust مثبت مسبقًا"
fi

# التحقق من Java (مطلوب ل Android)
if ! command -v java &> /dev/null; then
    error "Java غير مثبت. الرجاء تثبيت Java JDK 17+"
    exit 1
fi
JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d" " -f3 | tr -d '"')
JAVA_MAJOR=$(echo $JAVA_VERSION | cut -d. -f1)
if [ "$JAVA_MAJOR" -lt 17 ]; then
    error "Java إصدار $JAVA_VERSION غير كافي. مطلوب ≥17"
    exit 1
fi
success "Java $JAVA_VERSION مثبت"

# التحقق من Android SDK
if [ -z "$ANDROID_HOME" ]; then
    error "Android SDK غير مضبوط. الرجاء تثبيت Android Studio أو ضبط ANDROID_HOME"
    exit 1
fi
success "Android SDK مضبوط في $ANDROID_HOME"

# التحقق من Android NDK
if [ -z "$ANDROID_NDK_HOME" ]; then
    error "Android NDK غير مضبوط. الرجاء تثبيت Android NDK"
    exit 1
fi
success "Android NDK مضبوط في $ANDROID_NDK_HOME"

# الخطوة 2: تثبيت التبعيات
message "تثبيت تبعيات المشروع..."
cd /workspace/github__machbrandido-art__no-code/ClipForge

# تثبيت جميع حزم المشروع
pnpm install > /dev/null 2>&1
if [ $? -ne 0 ]; then
    error "فشل تثبيت حزم المشروع"
    exit 1
fi
success "تم تثبيت حزم المشروع"

# الخطوة 3: بناء تطبيق الويب
message "بناء تطبيق الويب..."
pnpm --filter @clipforge/web build > /dev/null 2>&1
if [ $? -ne 0 ]; then
    error "فشل بناء تطبيق الويب"
    exit 1
fi
success "تم بناء تطبيق الويب"

# الخطوة 4: تثبيت Tauri CLI
message "تثبيت Tauri CLI..."
cd apps/desktop
pnpm install > /dev/null 2>&1
if [ $? -ne 0 ]; then
    error "فشل تثبيت Tauri CLI"
    exit 1
fi
success "تم تثبيت Tauri CLI"

# الخطوة 5: بناء APK
message "بناء APK (قد يستغرق وقتًا طويلاً)..."

# ضبط بيئة Android
message "ضبط بيئة Android..."
export ANDROID_NDK_HOME=$(dirname $(which ndk-build) | xargs dirname | xargs dirname)
export ANDROID_HOME=$(dirname $(which adb) | xargs dirname | xargs dirname)
export PATH="$ANDROID_HOME/platform-tools:$PATH"
export PATH="$ANDROID_HOME/tools:$PATH"

# التحقق من وجود Android targets
message "التحقق من Android targets..."
if ! command -v adb &> /dev/null; then
    error "adb غير موجود. الرجاء تثبيت Android SDK Platform-Tools"
    exit 1
fi

# بناء APK
message "بدء بناء APK..."
pnpm tauri android build > /dev/null 2>&1

if [ $? -ne 0 ]; then
    error "فشل بناء APK. جرب:"
    error "  1. التأكد من أن Android Studio مثبت بشكل صحيح"
    error "  2. التأكد من أن AVD (Android Virtual Device) موجود"
    error "  3. التأكد من أن جميع متطلبات Android مثبتة"
    warning "جرب بناء APK يدويًا:"
    warning "  cd apps/desktop"
    warning "  pnpm tauri android build"
    exit 1
fi

success "تم بناء APK بنجاح!"

# الخطوة 6: العثور على ملف APK
message "البحث عن ملف APK..."
APK_FILE=$(find src-tauri/target -name "*.apk" 2>/dev/null | head -1)

if [ -z "$APK_FILE" ]; then
    error "لم يتم العثور على ملف APK"
    warning "جرب البحث يدويًا في:"
    warning "  apps/desktop/src-tauri/target/"
    exit 1
fi

success "تم العثور على ملف APK: $APK_FILE"

# الخطوة 7: نسخ ملف APK إلى مجلد سهلة
message "نسخ ملف APK إلى مجلد releases..."
mkdir -p ../../releases
cp "$APK_FILE" ../../releases/ClipForge-$(date +%Y%m%d-%H%M%S).apk
success "تم نسخ ملف APK إلى releases/"

# عرض معلومات البناء
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
echo "${GREEN}✓ تم بناء ClipForge APK بنجاح!${NC}"
echo ""
echo "  معلومات البناء:"
echo "  - Node.js: $NODE_VERSION"
echo "  - Rust: $(rustc --version | head -1)"
echo "  - Java: $JAVA_VERSION"
echo "  - Android SDK: $ANDROID_HOME"
echo "  - Android NDK: $ANDROID_NDK_HOME"
echo ""
echo "  ملف APK:"
echo "  ${YELLOW}$APK_FILE${NC}"
echo ""
echo "  ملف APK في مجلد releases:"
echo "  ${YELLOW}releases/ClipForge-$(date +%Y%m%d-%H%M%S).apk${NC}"
echo ""
echo "  أوامر إضافية:"
echo ""
echo "  ${YELLOW}1. تثبيت APK على جهاز Android:${NC}"
echo "     adb install $APK_FILE"
echo ""
echo "  ${YELLOW}2. نشر Release على GitHub:${NC}"
echo "     gh release create v1.0.0 releases/ClipForge-*.apk"
echo ""
echo "  ${YELLOW}3. بناء جميع المنصات:${NC}"
echo "     pnpm tauri build --targets all"
echo ""
