import { Credentials } from './auth/credentials';
import process from 'process';

async function start()
{
    const credentials = new Credentials();

    while (!credentials.valid())
        await credentials.readCredentials();

    process.env.AWS_ACCESS_KEY_ID = credentials.getAccessKeyId();
    process.env.AWS_SECRET_ACCESS_KEY = credentials.getSecretAccessKey();
    process.env.AWS_SESSION_TOKEN = credentials.getSessionToken();

    console.log('Credentials set\n');
}

start();
