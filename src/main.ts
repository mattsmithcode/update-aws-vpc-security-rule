import { Credentials } from './auth/credentials';
import { Ec2 } from './aws/ec2';
import process from 'process';
import prompts from 'prompts';

async function start()
{
    const credentials = new Credentials();

    while (!credentials.valid())
        await credentials.readCredentials();

    process.env.AWS_ACCESS_KEY_ID = credentials.getAccessKeyId();
    process.env.AWS_SECRET_ACCESS_KEY = credentials.getSecretAccessKey();
    process.env.AWS_SESSION_TOKEN = credentials.getSessionToken();

    console.log('Credentials set\n');

    const region = await prompts({
        type: 'text',
        name: 'value',
        message: 'Enter AWS region',
        validate: value => /^([a-z]+-)+[0-9]+$/.test(value) ? true : 'Invalid region format'
    });
}

start();
