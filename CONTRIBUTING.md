# Contributing to LLM Token Calculator

First off, thanks for taking the time to contribute! This project aims to help developers estimate costs for LLM APIs accurately.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (text inputs, expected vs actual token counts)
- **Include screenshots** if applicable
- **Describe the behavior you observed and what you expected**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful** to most users
- **List any alternative solutions** you've considered

### Adding New Models

We welcome contributions to expand our model coverage! To add new models:

1. Check if the model exists in the [LiteLLM pricing database](https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json)
2. If not available via API, add to the fallback list in `lib/model-prices.ts`
3. Include accurate pricing information with sources
4. Add appropriate provider categorization

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure your code follows the existing style
4. Make sure your code lints (`npm run lint`)
5. Issue that pull request!

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/llm-token-calculator.git

# Navigate to the project
cd llm-token-calculator

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Project Structure

```
llm-token-calculator/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components
├── lib/                   # Utility functions
│   ├── calculator.ts     # Cost calculation logic
│   ├── model-prices.ts   # Fallback model pricing
│   ├── tokenizer.ts      # Token counting logic
│   └── types.ts          # TypeScript types
└── public/               # Static assets
```

## Code Style

- Use TypeScript for all new code
- Follow the existing code style (Prettier + ESLint)
- Use meaningful variable and function names
- Add JSDoc comments for public functions
- Keep components small and focused

## Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

Thank you for contributing!
