# دليل بناء ClipForge ك APK للاندرويد

## 📋 ملخص

هذا الدليل يشرح كيفية **بناء تطبيق ClipForge ك ملف APK** يمكن تثبيته على أي جهاز اندرويد. سنستخدم **Tauri v2** الذي يدعم الآن بناء تطبيقات اندرويد.

---

## 🎯 المتطلبات الأساسية

### 1. جهاز كمبيوتر 64-bit
- **نظام التشغيل**: Windows 10/11, macOS, أو Linux (64-bit)
- **المساحة**: 20GB+ مساحة حرة (ل Android SDK, NDK, وتبعيات المشروع)
- **الذاكرة**: 8GB+ RAM (مفضل 16GB)

### 2. برامج مطلوبة

#### Node.js
```bash
# تثبيت Node.js 18+
# من الموقع الرسمي: https://nodejs.org/
node -v  # يجب أن يكون ≥18.0.0
npm -v   # يجب أن يكون ≥9.0.0
```

#### Rust
```bash
# تثبيت Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustc --version  # يجب أن يكون ≥1.70.0
```

#### pnpm
```bash
# تثبيت pnpm
npm install -g pnpm
pnpm -v  # يجب أن يكون ≥8.0.0
```

#### Java JDK 17+
```bash
# على Ubuntu/Debian
sudo apt install openjdk-17-jdk

# على macOS
brew install openjdk@17

# على Windows
# تنزيل من: https://adoptium.net/
java -version  # يجب أن يظهر Java 17+
```

#### Android Studio (مطلوب ل Android SDK و NDK)
1. تنزيل Android Studio من: https://developer.android.com/studio
2. تثبيت Android Studio
3. خلال التثبيت، تأكد من تثبيت:
   - ✅ Android SDK
   - ✅ Android SDK Command-line Tools
   - ✅ Android Emulator
   - ✅ Android Virtual Device (AVD)
   - ✅ Android NDK (Side by side)

#### متطلبات Android محددة
```bash
# بعد تثبيت Android Studio

# ضبط متغيرات البيئة (إضف إلى ~/.bashrc أو ~/.zshrc)
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_NDK_HOME=$HOME/Android/Sdk/ndk/<version>
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# التحقق
adb --version
sdkmanager --list
```

#### تثبيت Android Targets
```bash
# تثبيت Android SDK 33
sdkmanager "platforms;android-33"
sdkmanager "build-tools;33.0.0"

# تثبيت NDK
sdkmanager "ndk;25.2.9519653"

# تثبيت CMake
sdkmanager "cmake;3.22.1"

# تثبيت Android Emulator (اختياري)
sdkmanager "emulator"

# قبول التراخيص
yes | sdkmanager --licenses > /dev/null
```

---

## 🛠️ إعداد المشروع

### 1. استنساخ المشروع
```bash
git clone https://github.com/machbrandido-art/no-code.git
cd no-code/ClipForge
```

### 2. تثبيت التبعيات
```bash
# تثبيت جميع حزم المشروع
pnpm install
```

### 3. بناء تطبيق الويب
```bash
# بناء Next.js للتطبيق
pnpm --filter @clipforge/web build
```

---

## 📱 إعداد Tauri ل Android

### 1. الانتقال إلى مجلد desktop
```bash
cd apps/desktop
```

### 2. تثبيت Tauri CLI
```bash
pnpm install
```

### 3. إعداد Android Target
```bash
# إضافة Android target
pnpm tauri android init
```

**خلال عملية الإعداد:**
- **Package name**: `com.machbrandido.clipforge`
- **App name**: `ClipForge`
- **Version**: `1.0.0`
- **Minimum SDK**: `21` (Android 5.0+)
- **Target SDK**: `33` (Android 13)

### 4. تعديل tauri.conf.json

تم تعديل الملف بالفعل ليدعم اندرويد. تأكد من أن:
```json
{
  "tauri": {
    "bundle": {
      "android": {
        "packageName": "com.machbrandido.clipforge",
        "versionCode": 1,
        "versionName": "1.0.0",
        "minSdkVersion": 21,
        "targetSdkVersion": 33
      }
    }
  }
}
```

### 5. إنشاء أيقونات اندرويد

```bash
# إنشاء مجلد أيقونات اندرويد
mkdir -p src-tauri/icons/android

# إنشاء أيقونات بمقاسات مختلفة (اختياري)
# يمكنك استخدام أداة مثل: https://romannurik.github.io/AndroidAssetStudio/
# أو استخدام أيقونة موجودة
cp src-tauri/icons/icon.png src-tauri/icons/android/
```

---

## 🚀 بناء APK

### طريقة 1: استخدام السكريبت الآلي
```bash
# من جذر المشروع
chmod +x BUILD_ANDROID_APK.sh
./BUILD_ANDROID_APK.sh
```

### طريقة 2: البناء اليدوي

```bash
# من مجلد desktop
cd apps/desktop

# بناء APK
pnpm tauri android build
```

**ملاحظة:** قد يستغرق البناء 10-30 دقيقة حسب سرعة جهازك

### طريقة 3: بناء مع AVD (للاختبار)

```bash
# إنشاء AVD (إذا لم يكن موجودًا)
avdmanager create avd -n Pixel_5_API_33 -k "system-images;android-33;google_apis;x86_64" -d pixel_5

# تشغيل AVD
emulator -avd Pixel_5_API_33 &

# بناء APK مع AVD
pnpm tauri android run
```

---

## 📂 موقع ملف APK

بعد بناء ناجح، ستجد ملف APK في:
```
apps/desktop/src-tauri/target/
  ├── debug/          # نسخة debug
  │   └── clipforge-desktop-debug.apk
  └── release/        # نسخة release
      └── clipforge-desktop-release.apk
```

---

## 🔧 حل المشكلات الشائعة

### مشكلة 1: Java غير مثبت
```bash
java -version
# إذا لم يكن مثبتًا
# على Ubuntu: sudo apt install openjdk-17-jdk
# على macOS: brew install openjdk@17
```

### مشكلة 2: Android SDK غير مضبوط
```bash
# تأكد من أن ANDROID_HOME مضبوط
echo $ANDROID_HOME

# إذا لم يكن مضبوطًا
# على Linux/macOS
ANDROID_HOME=$HOME/Android/Sdk

# على Windows
ANDROID_HOME=C:\Users\<username>\AppData\Local\Android\Sdk
```

### مشكلة 3: NDK غير موجود
```bash
# تثبيت NDK عبر sdkmanager
sdkmanager "ndk;25.2.9519653"

# ضبط ANDROID_NDK_HOME
ANDROID_NDK_HOME=$ANDROID_HOME/ndk/25.2.9519653
export ANDROID_NDK_HOME
```

### مشكلة 4: خطأ في تراخيص Android
```bash
# قبول جميع التراخيص
yes | sdkmanager --licenses > /dev/null
```

### مشكلة 5: خطأ في Rust
```bash
# تحديث Rust
rustup update

# تثبيت targets المطلوبة
rustup target add aarch64-linux-android
rustup target add armv7-linux-androideabi
rustup target add x86_64-linux-android
rustup target add i686-linux-android
```

### مشكلة 6: خطأ في build-tools
```bash
# تثبيت build-tools
sdkmanager "build-tools;33.0.0"
sdkmanager "build-tools;34.0.0"
```

### مشكلة 7: خطأ في CMake
```bash
# تثبيت CMake
sdkmanager "cmake;3.22.1"
```

### مشكلة 8: خطأ في space
```bash
# حذف ملفات مؤقتة
rm -rf ~/.cargo/registry/cache
rm -rf ~/.cargo/git/db
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules

# إعادة المحاولة
pnpm install
```

---

## 📝 أوامر مفيدة

| الأمر | الوصف |
|-------|------|
| `pnpm tauri android build` | بناء APK |
| `pnpm tauri android run` | بناء وتشغيل على AVD |
| `pnpm tauri android build --debug` | بناء نسخة debug |
| `pnpm tauri android build --release` | بناء نسخة release |
| `adb install <file>.apk` | تثبيت APK على جهاز |
| `adb devices` | عرض الأجهزة المتصلة |
| `emulator -list-avds` | عرض AVDs المتاحة |

---

## 🎯 نشر Release على GitHub

### 1. إنشاء Release جديد
```bash
# الانتقال إلى جذر المشروع
cd /workspace/github__machbrandido-art__no-code

# إنشاء مجلد releases
mkdir -p releases

# نسخ ملف APK
cp ClipForge/apps/desktop/src-tauri/target/release/clipforge-desktop-release.apk releases/ClipForge-v1.0.0.apk
```

### 2. نشر باستخدام GitHub CLI
```bash
# تثبيت gh CLI (إذا لم يكن مثبتًا)
# على Ubuntu: sudo snap install gh
# على macOS: brew install gh
# على Windows: winget install --id GitHub.cli

# تسجيل الدخول إلى GitHub
gh auth login

# إنشاء Release
gh release create v1.0.0 releases/ClipForge-v1.0.0.apk \
  --title "ClipForge v1.0.0 - Android APK" \
  --notes "First Android release of ClipForge. Built with Tauri v2." \
  --target main
```

### 3. نشر يدويًا
1. اذهب إلى: https://github.com/machbrandido-art/no-code/releases
2. انقر على "Draft a new release"
3. أدخل:
   - **Tag version**: `v1.0.0`
   - **Release title**: `ClipForge v1.0.0 - Android APK`
   - **Description**: وصف للإصدار
4. اسحب ملف APK إلى قسم "Assets"
5. انقر على "Publish release"

---

## 📌 ملاحظات هامة

### 1. توقيع APK
لنشر التطبيق على Google Play، يجب **توقيع APK**:
```bash
# إنشاء key
keytool -genkey -v -keystore clipforge-release.keystore \
  -alias ClipForge -keyalg RSA -keysize 2048 -validity 10000

# توقيع APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore clipforge-release.keystore \
  clipforge-desktop-release.apk ClipForge
```

### 2. تحسين الأداء
- استخدم **release mode** للنشر
- قم ب **optimization** لملف APK
- حذف **debug symbols**

### 3. اختبار التطبيق
- اختبار على **AVD** (Android Virtual Device)
- اختبار على **جهاز حقيقي**
- اختبار على **إصدارات اندرويد مختلفة** (21, 24, 28, 33)

---

## 🔗 روابط مفيدة

- [Tauri Android Documentation](https://tauri.app/v2/guides/getting-started/setup/android)
- [Android Studio Download](https://developer.android.com/studio)
- [Android NDK Download](https://developer.android.com/ndk/downloads)
- [Rust Android Targets](https://doc.rust-lang.org/nightly/rustc/platform-support.html)
- [Java Download](https://adoptium.net/)

---

## 📞 دعم

إذا واجهت أي مشكلة:

1. تأكد من اتباع جميع الخطوات بشكل صحيح
2. تحقق من متطلبات النظام
3. تأكد من أن جميع متغيرات البيئة مضبوطة بشكل صحيح
4. جرب بناء **debug version** أولاً
5. تحقق من **logs** بحثًا عن أخطاء محددة

---

**تم إعداد المشروع لبناء APK**
**آخر تحديث: 2024**
