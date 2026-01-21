# CopilotKit <> strands Starter

This is a starter template for building AI agents using [strands](https://strands.com) and [CopilotKit](https://copilotkit.ai). It provides a modern Next.js application with an integrated investment analyst agent that can research stocks, analyze market data, and provide investment insights.

## Prerequisites

- Node.js 20+ 
- Python 3.12+
- AWS Account with Bedrock access configured
- AWS Credentials (via environment variables, ~/.aws/credentials, or IAM role)
- Any of the following package managers:
  - pnpm (recommended)
  - npm
  - yarn
  - bun

> **Note:** This repository ignores lock files (package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb) to avoid conflicts between different package managers. Each developer should generate their own lock file using their preferred package manager. After that, make sure to delete it from the .gitignore.

## Getting Started

1. Install dependencies using your preferred package manager:
```bash
# Using pnpm (recommended)
pnpm install

# Using npm
npm install

# Using yarn
yarn install

# Using bun
bun install
```

> **Note:** Installing the package dependencies will also install the agent's python dependencies via the `install:agent` script.

2. Set up your AWS credentials for Bedrock:

You can configure AWS credentials in one of the following ways:

**Option 1: Environment Variables**
```bash
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_REGION="us-east-1"  # or your preferred region
```

**Option 2: AWS Credentials File**
```bash
aws configure
```

**Option 3: Create a `.env.local` file**
```bash
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
BEDROCK_MODEL=claude-3-haiku  # Optional: choose your model
```

**Note:** Make sure your AWS credentials have the following IAM permissions:
- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`

3. Start the development server:
```bash
# Using pnpm
pnpm dev

# Using npm
npm run dev

# Using yarn
yarn dev

# Using bun
bun run dev
```

This will start both the UI and agent servers concurrently.

## Available Scripts
The following scripts can also be run using your preferred package manager:
- `dev` - Starts both UI and agent servers in development mode
- `dev:debug` - Starts development servers with debug logging enabled
- `dev:ui` - Starts only the Next.js UI server
- `dev:agent` - Starts only the strands agent server
- `build` - Builds the Next.js application for production
- `start` - Starts the production server
- `lint` - Runs ESLint for code linting
- `install:agent` - Installs Python dependencies for the agent

## 📚 Documentation

The main UI component is in `src/app/page.tsx`. You can:
- Modify the theme colors and styling
- Add new frontend actions
- Customize the CopilotKit sidebar appearance

Otherwise, check out the documentation relevant to your task:

- [Strands Documentation](https://strandsagents.com/latest/documentation/docs/) - Learn more about Strands and its features
- [CopilotKit Documentation](https://docs.copilotkit.ai) - Explore CopilotKit's capabilities
- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API

## Contributing

Feel free to submit issues and enhancement requests! This starter is designed to be easily extensible.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

### Agent Connection Issues
If you see "I'm having trouble connecting to my tools", make sure:
1. The strands agent is running on port 8000
2. Your AWS credentials are configured correctly (check environment variables or ~/.aws/credentials)
3. Your AWS account has access to the Bedrock models you're trying to use
4. The AWS region you're using has the requested model available
5. Both servers started successfully

### AWS Bedrock Issues
If you encounter errors related to AWS Bedrock:
1. Verify your AWS credentials are valid: `aws sts get-caller-identity`
2. Check that the model is enabled in your AWS Bedrock console
3. Ensure your IAM user/role has the required Bedrock permissions
4. Verify the region matches where the model is available

### Python Dependencies
If you encounter Python import errors:
```bash
cd agent
uv sync
```
