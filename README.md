# 🧾 Local Transcript Reader

A local transcript reader powered by **Ollama**, **Node.js**, and **Vue.js** — completely **free and offline**.

---

## 🛠 Recommended IDE: VS Code

1. Download from [https://code.visualstudio.com/](https://code.visualstudio.com/)
2. Install based on your OS (Windows/macOS/Linux)
3. Open the project in **VS Code**

---

## 📦 Prerequisites

### Install GraphicsMagick & Ghostscript (required for `pdf2pic`)

**macOS (Homebrew)**:

```sh
brew install graphicsmagick ghostscript
```

⚠️ **Note:** You might need to reinstall Node.js if it breaks after this step.

---

## 📥 Install Node.js & npm

1. Visit [https://nodejs.org/en](https://nodejs.org/en)
2. Download the **LTS version**
3. Install using the provided installer
4. Verify installation:

```sh
node -v
npm -v
```

---

## 🌱 Install Vue CLI

```sh
npm install -g @vue/cli
```

Verify with:

```sh
vue --version
```

---

## 🧠 Download & Setup Ollama

1. Visit [https://ollama.com/download](https://ollama.com/download)
2. Install based on your OS
3. After installation, open the Ollama app or make sure it is running in the background before starting the project.
4. Open a new Terminal and start the Granite model by using:

```sh
ollama run granite3.2-vision:2b
```

---

## 🚀 Run the Project

### 1. Clone and Open the Project in VS Code

Navigate to the root of the project.

### 2. Install Backend Dependencies

```sh
npm install
```

### 3. Start the Backend Server

```sh
npm run dev
```

### 4. Run the Frontend (Vue)

```sh
cd frontend
npm install
npm run dev
```

Frontend will run at:

```
http://localhost:5173/
```

---

Enjoy running AI-powered transcript extraction fully offline! 🚀
