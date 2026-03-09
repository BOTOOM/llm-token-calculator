# Tokonomics

[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-pink)](https://github.com/sponsors/BOTOOM)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/edwardiazdev)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0-black)](https://v0.app)

A powerful token counter and cost calculator for LLM APIs. Compare pricing across OpenAI, Anthropic, Google, Mistral, AWS Bedrock, Qwen, and more.

## Features

- **Real-time Token Counting**: Accurate token counting using js-tiktoken for OpenAI models
- **Multi-Provider Support**: Compare costs across 50+ models from major providers
- **Live Pricing Data**: Fetches current pricing from LiteLLM's maintained database
- **Usage Projections**: Estimate daily and monthly costs based on your usage patterns
- **Input & Output Analysis**: Calculate tokens for both prompts and expected responses
- **Light & Dark Mode**: Automatically detects system preference with manual toggle
- **Privacy First**: All calculations happen client-side, no data sent to servers

## Supported Providers

| Provider | Models |
|----------|--------|
| OpenAI | GPT-4.1, GPT-5, GPT-5.4, o1, o3, o4-mini, Codex |
| Anthropic | Claude 3.5, Claude 4, Claude 4.6 Opus/Sonnet |
| Google | Gemini 2.5, Gemini 3, Gemini 3.1 Flash/Pro |
| AWS Bedrock | Nova, Nova 2, Titan Text, Titan Multimodal |
| Mistral | Large, Small, Codestral, Pixtral |
| Qwen | QwQ, Qwen 2.5, Qwen VL |
| DeepSeek | V3, R1, Coder V2 |
| Meta | Llama 4, Llama 3.3 |
| Groq | Fast inference models |
| xAI | Grok 2 |
| Cohere | Command R+ |
| AI21 | Jamba 1.5 |

## Getting Started

```bash
# Clone the repository
git clone https://github.com/BOTOOM/llm-token-calculator.git

# Navigate to the project
cd llm-token-calculator

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the calculator.

## How It Works

1. **Paste your prompt** in the input area (or enter token count directly)
2. **Optionally add expected output** to calculate total tokens
3. **View token counts** across different providers
4. **Configure usage** (requests/day, active days)
5. **Filter models** by capabilities (vision, reasoning, coding, etc.)
6. **Compare costs** in the interactive table

### Pricing Formula

```
Total Cost = (Input Tokens * Input Rate) + (Output Tokens * Output Rate)
```

## Tech Stack

- [Next.js 16](https://nextjs.org) - React framework
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [js-tiktoken](https://github.com/dqbd/tiktoken) - Token counting
- [LiteLLM](https://github.com/BerriAI/litellm) - Pricing data source
- [next-themes](https://github.com/pacocoursey/next-themes) - Theme management

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) first.

## Security

For security issues, please see our [Security Policy](SECURITY.md).

## Support the Project

If you find this tool useful, consider supporting its development:

- [Sponsor on GitHub](https://github.com/sponsors/BOTOOM)
- [Buy Me a Coffee](https://buymeacoffee.com/edwardiazdev)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- [Live Demo](https://tokonomics.dev)
- [GitHub Repository](https://github.com/BOTOOM/llm-token-calculator)
- [Report Issues](https://github.com/BOTOOM/llm-token-calculator/issues)

---

Built with [v0](https://v0.app) | Pricing data from [LiteLLM](https://github.com/BerriAI/litellm)
