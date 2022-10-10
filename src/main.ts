import { SecurityGroupRule } from '@aws-sdk/client-ec2';
import fetch from 'node-fetch';
import process from 'process';
import prompts from 'prompts';
import readline from 'readline';
import { Credentials } from './auth/credentials';
import { Ec2 } from './aws/ec2';

const exitOnAbort = (state: { aborted: boolean }) => {
    if (state.aborted)
    {
        console.log();
        process.exit();
    }
};

async function getPublicIpAddress(): Promise<string>
{
    try
    {
        const response = await fetch('https://v4.ident.me');

        return await response.text();
    }
    catch (error)
    {
        console.error('Could not determine public IP address');
        process.exit(1);
    }
}

async function promptForSecurityRule(securityRules: SecurityGroupRule[], ipAddress: string): Promise<SecurityGroupRule>
{
    while (true)
    {
        const results = await prompts([
            {
                type: 'select',
                name: 'rule',
                message: 'Select security rule',
                choices: securityRules
                    .sort((a, b) => {
                        return (a.Description ?? a.SecurityGroupRuleId ?? '')
                            .localeCompare(
                                b.Description ?? b.SecurityGroupRuleId ?? ''
                            )
                    })
                    .map(rule => ({
                        title: rule.Description ?? rule.SecurityGroupRuleId as string,
                        value: rule
                    })),
                onState: exitOnAbort
            },
            {
                type: 'toggle',
                name: 'confirm',
                message: prev => `This will update the IP address for ${prev.Description} to ${ipAddress}. Are you sure?`,
                active: 'Yes',
                inactive: 'No',
                onState: exitOnAbort
            }
        ]);

        if (results.confirm)
            return results.rule;

        readline.moveCursor(process.stdout, 0, -2);
        readline.clearScreenDown(process.stdout);
    }
}

async function start()
{
    const ipAddress = await getPublicIpAddress();
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
        validate: value => /^([a-z]+-)+[0-9]+$/.test(value) ? true : 'Invalid region format',
        onState: exitOnAbort
    });
    const client = new Ec2(region.value);

    const securityGroups = await client.getSecurityGroups();
    const securityGroup = await prompts({
        type: 'select',
        name: 'value',
        message: 'Select security group',
        choices: securityGroups
            .sort((a, b) => {
                return (a.GroupName ?? '')
                    .localeCompare(b.GroupName ?? '');
            })
            .map(group => ({
            title: group.GroupName as string,
            value: group.GroupId as string
        })),
        onState: exitOnAbort
    });

    const securityRules = await client.getSecurityRules(securityGroup.value);
    const securityRule = await promptForSecurityRule(
        securityRules.filter(rule => !rule.IsEgress),
        ipAddress
    );

    const updated = await client.setSecurityRuleIpAddress(
        securityGroup.value,
        securityRule,
        ipAddress
    );

    console.log(
        updated ?
            '\nSecurity rule updated' :
            '\nSecurity rule update failed'
    );
}

start();
