const secret = process.env.JWT_SECRET || 'deepgram-secret';
const deepGramUri = process.env.DEEPGRAM_STT_DOMAIN;
const deepGramApiKey = process.env.DEEPGRAM_API_KEY;
const deepGramEnv = process.env.DEEPGRAM_ENV;

export const config = {
    jwtSecret: secret,
    deepGramUri,
    deepGramApiKey,
    deepGramEnv,
}