# Deepgram AI Agent Technical Demo

Combine Text-to-Speech and Speech-to-Text into a conversational agent.

> Project codename EmilyAI

[![Discord](https://dcbadge.vercel.app/api/server/xWRaCDBtW4?style=flat)](https://discord.gg/xWRaCDBtW4)

The purpose of this demo is to showcase how you can build a Conversational AI application that engages users in natural language interactions, mimicking human conversation through natural language processing using [Deepgram](https://deepgram.com/).

Examples of where you would see this type of application include: virtual assistants for tasks like answering queries and controlling smart devices, educational tutors for personalized learning, healthcare advisors for medical information, and entertainment chat bots for engaging conversations and games.

These applications aim to enhance user experiences by offering efficient and intuitive interactions, reducing the need for human intervention in various tasks and services.

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker.

Check out our [KNOWN ISSUES](./KNOWN_ISSUES.md) before reporting.

## Demo features

- Capture streaming audio using [Deepgram Streaming Speech to Text](https://developers.deepgram.com/docs/getting-started-with-live-streaming-audio).
- Natural Language responses using an OpenAI LLM.
- Speech to Text conversion using [Deepgram Aura Text to Speech](https://developers.deepgram.com/docs/text-to-speech).

## What is Deepgram?

[Deepgram](https://deepgram.com/) is a foundational AI company providing speech-to-text and language understanding capabilities to make data readable and actionable by human or machines.

## Sign-up to Deepgram

Want to start building using this project? [Sign-up now for Deepgram and create an API key](https://console.deepgram.com/signup?jump=keys).

## Quickstart

### Manual

Follow these steps to get started with this starter application.

#### Clone the repository

Go to GitHub and [clone the repository](https://github.com/deepgram-starters/live-nextjs-starter).

#### Install dependencies

Install the project dependencies.

```bash
npm install
```

#### Edit the config file

Copy the code from `sample.env.local` and create a new file called `.env.local`.

```bash
DEEPGRAM_STT_DOMAIN=https://api.deepgram.com
DEEPGRAM_API_KEY=YOUR-DG-API-KEY
OPENAI_API_KEY=YOUR-OPENAI-API-KEY
DEEPGRAM_ENV=development or production
JWT_SECRET=YOUR-JWT-SECRET
```

1. For `DEEPGRAM_API_KEY` paste in the key you generated in the [Deepgram Console](https://console.deepgram.com/).
2. Set `DEEPGRAM_STT_DOMAIN` to be `https://api.deepgram.com`.
3. The`OPENAI_API_KEY` should be an OpenAI API Key that can access the chat completions API.
4. For `DEEPGRAM_ENV`: This is a custom environment variable specific to this application and is used to determine how API keys are handled. In development mode, it uses the API key directly from the environment. In production, it would create temporary API keys for each session.
5. For `JWT_SECRET`: This is used for JSON Web Token (JWT) authentication. The application uses this for: Generating authentication tokens when users first visit. Verifying tokens for protected API routes and securing the WebSocket connection

#### Run the application

Once running, you can [access the application in your browser](http://localhost:3000).

```bash
npm run dev
```

## Getting Help

We love to hear from you so if you have questions, comments or find a bug in the project, let us know! You can either:

- [Open an issue in this repository](https://github.com/deepgram-devs/deepgram-aura-tts-demo/issues)
- [Join the Deepgram Github Discussions Community](https://github.com/orgs/deepgram/discussions)
- [Join the Deepgram Discord Community](https://discord.gg/xWRaCDBtW4)

## Author

[Deepgram](https://deepgram.com)

## License

This project is licensed under the MIT license. See the [LICENSE](./LICENSE) file for more info.
