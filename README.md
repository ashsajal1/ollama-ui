# Ollama UI

A modern, feature-rich web interface built with Next.js and shadcn/ui for interacting with local Ollama large language models.

<!-- ![Screenshot Placeholder](<link-to-your-screenshot.png>) Optional: Add a screenshot -->

## ✨ Features

*   **Real-time Chat:** Engage in conversations with your local Ollama models.
*   **Streaming Responses:** Get model responses streamed token-by-token for a fluid experience.
*   **Model Selection:** Easily switch between different Ollama models installed on your system.
*   **Chat History:**
    *   Persistent storage of chat conversations (requires backend API setup).
    *   View past chats in a collapsible sidebar.
    *   Create new chat sessions.
    *   Rename existing chats.
    *   Delete unwanted chats with confirmation.
*   **Pre-defined Prompts:** Quickly start conversations with helpful prompt suggestions.
*   **Theme Toggle:** Switch between Light, Dark, and System themes.
*   **Responsive Design:** Usable across different screen sizes.
*   **Notifications:** Uses toasts for feedback on actions (e.g., errors, success).
*   **Loading Indicators:** Visual cues (like NProgress bar) during model loading or response generation.
*   **Built with Modern Tools:** Leverages Next.js App Router, TypeScript, and Tailwind CSS.

## 🛠️ Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **State Management:** React Hooks (`useState`, `useEffect`, `useRef`)
*   **API Interaction:** Fetch API (for Ollama and internal chat history API)
*   **Progress Indicator:** next-nprogress-bar
*   **Theming:** next-themes
*   **Backend Target:** Ollama

## 📋 Prerequisites

*   Node.js (v18 or later recommended)
*   npm, yarn, or pnpm
*   A running Ollama instance.
    *   Ensure Ollama is accessible (default: `http://localhost:11434`).
    *   Pull the models you want to use (e.g., `ollama pull llama2`).
*   (For Chat History Persistence) A backend API service running at `/api/chat` endpoints to handle chat creation, loading, updating, and deletion. The provided code assumes this exists but doesn't implement the persistence layer itself (e.g., database connection).

## 🚀 Getting Started

For detailed setup instructions including database configuration and common commands, please see our [How to Use Guide](HOW_TO_USE.md).

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ashsajal1/ollama-ui
    cd ollama-ui
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Environment Variables (Optional):**
    If your Ollama instance is running on a different address or port, you might need to configure the base URL used in `@/lib/ollama.ts`. Create a `.env.local` file if needed.
    ```env
    # .env.local
    # Example: If Ollama runs elsewhere
    # OLLAMA_BASE_URL=http://your-ollama-host:11434
    ```
    *(Note: The provided `ollama.ts` library isn't shown, so adapt this based on how it determines the Ollama URL).*

4.  **(If implementing persistence) Set up your backend:**
    Ensure your backend service for handling `/api/chat/...` routes is running and configured (e.g., database connection strings).

5.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

6.  Open http://localhost:3000 in your browser.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License. <!-- Optional: Add a LICENSE file -->
