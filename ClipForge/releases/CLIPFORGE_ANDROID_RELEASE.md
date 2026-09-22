# ClipForge Android APK Release v1.0.0

## 📦 معلومات الإصدار

- **الإصدار**: v1.0.0
- **التاريخ**: 2024
- **النوع**: Android APK
- **الحالة**: Development Release

---

## 🚀 كيفية بناء APK

### المتطلبات
✅ **نظام التشغيل**: Windows 10/11, macOS, أو Linux (64-bit)
✅ **Node.js**: ≥18.0.0
✅ **Rust**: ≥1.70.0
✅ **Java JDK**: ≥17
✅ **Android SDK**: مع NDK
✅ **Tauri**: v2.x

---

## 🛠️ خطوات البناء

### 1. استنساخ المشروع
```bash
git clone https://github.com/machbrandido-art/no-code.git
cd no-code/ClipForge
```

### 2. تثبيت التبعيات
```bash
# تثبيت pnpm (إذا لم يكن مثبتًا)
npm install -g pnpm

# تثبيت جميع حزم المشروع
pnpm install
```

### 3. بناء تطبيق الويب
```bash
pnpm --filter @clipforge/web build
```

### 4. بناء APK
```bash
cd apps/desktop
pnpm tauri android build
```

---

## 📁 موقع ملف APK

بعد البناء الناجح، ستجد ملف APK في:
```
ClipForge/apps/desktop/src-tauri/target/release/
  └── clipforge-desktop-release.apk
```

---

## 📱 تثبيت APK على جهاز اندرويد

### طريقة 1: عبر ADB
```bash
# توصيل الجهاز
adb devices

# تثبيت APK
adb install clipforge-desktop-release.apk
```

### طريقة 2: يدويًا
1. انسخ ملف APK إلى جهاز اندرويد
2. افتح ملف APK على الجهاز
3. اتبع تعليمات التثبيت

---

## ⚙️ إعداد بيئة Android

### تثبيت Android Studio
1. تنزيل من: https://developer.android.com/studio
2. تثبيت Android Studio
3. خلال التثبيت، تأكد من تثبيت:
   - Android SDK
   - Android SDK Command-line Tools
   - Android NDK (Side by side)
   - Android Emulator

### ضبط متغيرات البيئة
```bash
# على Linux/macOS (إضف إلى ~/.bashrc أو ~/.zshrc)
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_NDK_HOME=$HOME/Android/Sdk/ndk/<version>
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# على Windows (إضف إلى متغيرات النظام)
ANDROID_HOME=C:\Users\<username>\AppData\Local\Android\Sdk
ANDROID_NDK_HOME=%ANDROID_HOME%\ndk\<version>
```

### تثبيت Android Targets
```bash
# تثبيت SDK 33
sdkmanager "platforms;android-33"
sdkmanager "build-tools;33.0.0"

# تثبيت NDK
sdkmanager "ndk;25.2.9519653"

# تثبيت CMake
sdkmanager "cmake;3.22.1"

# قبول التراخيص
yes | sdkmanager --licenses > /dev/null
```

---

## 🔧 حل المشكلات

### مشكلة: Java غير مثبت
```bash
java -version
# إذا لم يكن مثبتًا
# على Ubuntu: sudo apt install openjdk-17-jdk
# على macOS: brew install openjdk@17
```

### مشكلة: Android SDK غير مضبوط
```bash
echo $ANDROID_HOME
# يجب أن يظهر مسار SDK
```

### مشكلة: NDK غير موجود
```bash
sdkmanager "ndk;25.2.9519653"
```

### مشكلة: Rust targets مفقودة
```bash
rustup target add aarch64-linux-android
rustup target add armv7-linux-androideabi
rustup target add x86_64-linux-android
rustup target add i686-linux-android
```

---

## 📚 الوثائق

- **[دليل البناء الكامل](ANDROID_BUILD_GUIDE.md)** - دليل مفصل بجميع الخطوات
- **[Tauri Android Docs](https://tauri.app/v2/guides/getting-started/setup/android)** - وثائق Tauri الرسمية
- **[Android Developer Docs](https://developer.android.com/docs)** - وثائق اندرويد

---

## 🎯 معلومات فنية

### إعدادات APK
```json
{
  "packageName": "com.machbrandido.clipforge",
  "versionCode": 1,
  "versionName": "1.0.0",
  "minSdkVersion": 21,
  "targetSdkVersion": 33
}
```

### المتطلبات
- **Android 5.0+** (API Level 21)
- **64-bit processor** (مفضل)
- **2GB RAM** (أقل حد)

---

## 📝 ملاحظات

1. **هذا إصدار تجريبي** - قد يحتوي على أخطاء
2. **مجاني ومفتوح المصدر** - تحت رخصة MIT
3. **يدعم جميع المنصات** - Windows, macOS, Linux, Android
4. **متوافق مع Tauri v2** - آخر إصدار مستقر

---

## 🔗 روابط مفيدة

- [المستودع الرئيسي](https://github.com/machbrandido-art/no-code)
- [Tauri](https://tauri.app/)
- [Next.js](https://nextjs.org/)
- [Android Developers](https://developer.android.com/)

---

## 📞 دعم

إذا واجهت أي مشكلة:
1. تأكد من اتباع جميع الخطوات بشكل صحيح
2. تحقق من متطلبات النظام
3. جرب بناء **debug version** أولاً
4. فتح **issue** على GitHub

---

**تم إعداد هذا الإصدار لبناء ClipForge ك APK**
**آخر تحديث: 2024**
