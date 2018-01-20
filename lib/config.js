module.exports = {
    PORT: process.env.PORT || 3000,

    AUTH_USERNAME: process.env.AUTH_USERNAME,
    AUTH_PASSWORD: process.env.AUTH_PASSWORD,
    JWT_SECRET: process.env.JWT_SECRET || 'tasmanianDevil',
    DEFAULT_TOKEN_NAME: process.env.DEFAULT_TOKEN_NAME,

    IOTA_SEED: process.env.IOTA_SEED,
    IRI_HOST: process.env.IRI_HOST,
    IRI_PORT: process.env.IRI_PORT,
    IRI_TESTNET: process.env.IRI_TESTNET || false,

    MONGODB_URL: process.env.MONGODB_URL || 'localhost'
};