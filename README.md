# Agent M

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge&logo=shadcn-ui&logoColor=white)](https://ui.shadcn.com/)

A modern, agentic AI-powered trading platform frontend built with Next.js, TypeScript, and shadcn/ui. This application provides users with a comprehensive suite of tools for managing their stock portfolios, analyzing performance, and leveraging AI for trading insights.

## ✨ Key Features

<p align="center">
<img width="1920" height="1080" alt="Features" src="https://github.com/user-attachments/assets/5c84244c-a59f-4127-b668-d16c58509439" />
</p>

- **Dashboard**: A comprehensive overview of your portfolio, including summary cards and performance charts.
- **Portfolio Management**: View your current holdings in a clean, organized table.
- **AI-Powered Predictions**: Leverage AI to get stock predictions and insights.
- **Auto-Trading Watchlist**: Manage a watchlist for automated trading strategies.
- **AI Chatbot**: Interact with an AI-powered chatbot for trading assistance and inquiries.
- **Transaction History**: Keep track of all your past transactions.
- **Stock History**: View historical data for specific stocks in a modal view.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18.x or later)
- [pnpm](https://pnpm.io/) (or npm/yarn)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/SMU-IS/agentic-ai-trading-fe
    cd agentic-ai-trading-fe
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file by copying the sample file:

    ```bash
    cp .env.sample .env.local
    ```

    Then, fill in the required environment variables in `.env.local`.

4.  **Run the development server:**
    ```bash
    pnpm dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 📁 Project Structure

```
/
├── app/                  # Main application routes
│   ├── login/
│   └── portfolio/
├── components/           # Reusable components
│   ├── portfolio/        # Components specific to the portfolio feature
│   ├── ui/               # Base UI components (from shadcn/ui)
│   └── ...
├── lib/                  # Utility functions, data, and type definitions
├── public/               # Static assets
└── ...
```

## 🤝 Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details.

## 💻 Acknowledgement

Developed by Mvidia (Team 2), IS484 Project Experience <br />
In Collaboration With UBS.

<a href="https://www.linkedin.com/in/joshydavid/">
  <img src="https://github.com/user-attachments/assets/4dfe0c89-8ced-4e08-bcf3-6261bdbb956d" width="80">
</a> &nbsp;

<a href="https://www.linkedin.com/in/bryancjh/">
  <img src="https://github.com/user-attachments/assets/cc1782b1-e71f-410a-97a4-cfec08bccead" width="80">
</a> &nbsp;

<a href="https://www.linkedin.com/in/derricklkh/">
  <img src="https://github.com/user-attachments/assets/2db4b711-b7d0-4368-8d12-6449c3fa2aa2" width="80">
</a> &nbsp;

<a href="https://www.linkedin.com/in/shawn-ng-yh/">
  <img src="https://github.com/user-attachments/assets/6bd4f3a7-6784-402a-b891-03d91e15d705" width="80">
</a> &nbsp;

<a href="https://www.linkedin.com/in/jiayenbeh/">
  <img src="[https://github.com/user-attachments/assets/6bd4f3a7-6784-402a-b891-03d91e15d705](https://media.licdn.com/dms/image/v2/D5603AQEqWsXbDOKWyw/profile-displayphoto-scale_400_400/B56ZmbOb1OHAAg-/0/1759245877416?e=1770249600&v=beta&t=w4zr9NdTnsOEKuO3Woe02NOv6NVU2hH8FadXhy51Y0s)" width="80">
</a> &nbsp;

<a href="https://www.linkedin.com/in/shawn-ng-yh/">
  <img src="https://github.com/user-attachments/assets/6bd4f3a7-6784-402a-b891-03d91e15d705" width="80">
</a> &nbsp;
