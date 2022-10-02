import fs from 'fs';
import os from 'os';
import path from 'path';
import process from 'process';
import readline from 'readline';
import { Writable } from 'stream';

class Credentials
{
    private methods = [
        () => this.getCredentialsFromEnvironmentVariables(),
        () => this.getCredentialsFromCredentialsFile()
    ];

    private accessKeyId: string | undefined;
    private secretAccessKey: string | undefined;
    private sessionToken: string | undefined;
    private source: string = 'unknown source';

    public getAccessKeyId(): string | undefined
    {
        return this.accessKeyId;
    }

    public getSecretAccessKey(): string | undefined
    {
        return this.secretAccessKey;
    }

    public getSessionToken(): string | undefined
    {
        return this.sessionToken;
    }

    public getSource(): string | undefined
    {
        return this.source;
    }

    public async readCredentials(): Promise<void>
    {
        while (this.methods.length > 0)
        {
            if (this.methods[0]())
                return;

            this.methods.shift();
        }

        await this.getCredentialsFromPrompt();
    }

    public valid(): boolean
    {
        return !(
            !this.accessKeyId ||
            !this.secretAccessKey ||
            !this.sessionToken
        );
    }

    private getCredentialsFromCredentialsFile(): boolean
    {
        const homeDirectory = os.homedir();
        const credentialsFile = path.join(homeDirectory, '.aws', 'credentials');

        try
        {
            const contents = fs.readFileSync(credentialsFile, 'utf8');
            const lines = contents.split(/\r?\n/);

            let accessKeyId: string | undefined;
            let secretAccessKey: string | undefined;
            let sessionToken: string | undefined;

            for (const line of lines)
            {
                const lineParts = line.replace(' ', '').split('=');

                switch (lineParts[0])
                {
                    case 'aws_access_key_id':
                        accessKeyId = lineParts[1];
                        break;
                    case 'aws_secret_access_key':
                        secretAccessKey = lineParts[1];
                        break;
                    case 'aws_session_token':
                        sessionToken = lineParts[1];
                        break;
                }
            }

            if (
                !accessKeyId ||
                !secretAccessKey ||
                !sessionToken
            )
                return false;

            this.setCredentials(
                accessKeyId,
                secretAccessKey,
                sessionToken,
                'credentials file'
            );

            return true;
        }
        catch
        {
            return false;
        }
    }

    private getCredentialsFromEnvironmentVariables(): boolean
    {
        if (
            !process.env.AWS_ACCESS_KEY_ID ||
            !process.env.AWS_SECRET_ACCESS_KEY ||
            !process.env.AWS_SESSION_TOKEN
        )
            return false;

        this.setCredentials(
            process.env.AWS_ACCESS_KEY_ID,
            process.env.AWS_SECRET_ACCESS_KEY,
            process.env.AWS_SESSION_TOKEN,
            'environment variables'
        );

        return true;
    }

    private async getCredentialsFromPrompt(): Promise<void>
    {
        const credentials: { [key: string]: string | null } = {
            'aws_access_key_id': null,
            'aws_secret_access_key': null,
            'aws_session_token': null
        };

        const mutedStdout = new Writable({
            write: (chunk, encoding, callback) => callback()
        });

        const reader = readline.createInterface({
            input: process.stdin,
            output: mutedStdout,
            terminal: true
        });

        console.log('Paste AWS credentials (not shown) then press enter:');

        for await (const line of reader)
        {
            let { key, value } = this.parseConsoleInput(line);

            for (let index = 0; !key && index < Object.keys(credentials).length; index++)
            {
                const credentialKey = Object.keys(credentials)[index];

                if (credentials[credentialKey] === null)
                    key = credentialKey;
            }

            if (key)
                credentials[key] = value;

            if (!Object.values(credentials).some(value => !value))
                break;
        }

        this.setCredentials(
            credentials['aws_access_key_id'] as string,
            credentials['aws_secret_access_key'] as string,
            credentials['aws_session_token'] as string,
            'console input'
        );
    }

    private parseConsoleInput(input: string): { key: string | null, value: string }
    {
        const regexpSize = /^(?:export |SET |\$Env:)?([a-zA-Z_]+) ?= ?"?([\w+=\/]+)"?$/;
        const matches = input.match(regexpSize);

        if (!matches)
        {
            return {
                key: null,
                value: input
            };
        }

        return {
            key: matches[1].toLowerCase(),
            value: matches[2]
        };
    }

    private setCredentials(accessKeyId: string, secretAccessKey: string, sessionToken: string, source: string): void
    {
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
        this.sessionToken = sessionToken;
        this.source = source;
    }
}

export { Credentials };
