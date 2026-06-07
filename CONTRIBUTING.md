# Contributing to Salad 🥗

First off, thank you for considering contributing to Salad! It's people like you that make Salad a world-class productivity ecosystem.

## Code of Conduct
By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). We expect all contributors to maintain a welcoming, respectful, and inclusive environment.

## The Vision: A Productivity Ecosystem
Salad is more than just a screenshot tool; it's a platform. We provide a suite of built-in tools (Screenshot, Record, Clipboard, etc.) published by **hammaadworks**, but the real magic happens when the community builds upon it. 

We want developers to build tools that solve their specific productivity bottlenecks and share them with the world.

## How Can I Contribute?

### 1. Building Custom Tools (Plugins)
The most exciting way to contribute is by building a new tool for the Salad launcher!
*   **Read the Guide:** Check out the [Contributing & Building Tools](README.md#-contributing--building-tools) section in the README to learn about the `SaladTool` interface and our plugin architecture.
*   **Keep it Aesthetic:** Ensure your tool matches the Salad UI guidelines (Tailwind CSS, Lucide icons, dark/glassmorphic themes).
*   **Write Tests:** We have strict guardrails. Every new tool must include unit tests (using Vitest) to ensure it doesn't break the core app.

### 2. Reporting Bugs
*   Use the GitHub Issues tab.
*   Clearly describe the bug, how to reproduce it, your OS, and your Salad version.
*   Include screenshots or logs if possible.

### 3. Suggesting Enhancements
*   Have an idea for a core feature or a UI tweak? Open an Issue with the label `enhancement`.
*   Explain *why* the feature is useful and how it aligns with Salad's "minimalist, keyboard-first" philosophy.

## Development Setup

1.  **Fork & Clone:**
    ```bash
    git clone https://github.com/hammaadworks/salad.git
    cd salad
    ```
2.  **Install Dependencies:** (We use `pnpm`)
    ```bash
    pnpm install
    ```
3.  **Run Development Server:**
    ```bash
    pnpm dev
    ```
4.  **Run Tests:**
    ```bash
    pnpm test
    ```

## Pull Request Process
1.  Create a new branch (`git checkout -b feature/amazing-tool`).
2.  Commit your changes (`git commit -m 'Add Amazing Tool'`).
3.  Ensure your code follows our style guide and passes all tests (`pnpm test`).
4.  Push to the branch (`git push origin feature/amazing-tool`).
5.  Open a Pull Request and provide a detailed description of your changes.

Let's build the ultimate productivity machine together! 🚀
