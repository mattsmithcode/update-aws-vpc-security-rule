import {
    DescribeSecurityGroupRulesCommand,
    DescribeSecurityGroupsCommand,
    EC2Client,
    ModifySecurityGroupRulesCommand,
    SecurityGroup,
    SecurityGroupRule
} from '@aws-sdk/client-ec2';

class Ec2
{
    private client: EC2Client;

    public constructor(region: string)
    {
        this.client = new EC2Client({
            region: region
        });
    }

    public async getSecurityGroups(): Promise<SecurityGroup[]>
    {
        const commandOutput = await this.client.send(
            new DescribeSecurityGroupsCommand({})
        );

        return commandOutput.SecurityGroups ?? [];
    }

    public async getSecurityRules(groupId: string): Promise<SecurityGroupRule[]>
    {
        const commandOutput = await this.client.send(
            new DescribeSecurityGroupRulesCommand({
                Filters: [{
                    Name: 'group-id',
                    Values: [ groupId ]
                }]
            })
        );

        return commandOutput.SecurityGroupRules ?? []
    }

    public async setSecurityRuleIpAddress(groupId: string, rule: SecurityGroupRule, ipAddress: string): Promise<boolean>
    {
        const commandOutput = await this.client.send(
            new ModifySecurityGroupRulesCommand({
                GroupId: groupId,
                SecurityGroupRules: [{
                    SecurityGroupRuleId: rule.SecurityGroupRuleId,
                    SecurityGroupRule: {
                        CidrIpv4: `${ipAddress}/32`,
                        Description: rule.Description,
                        FromPort: rule.FromPort,
                        IpProtocol: rule.IpProtocol,
                        ToPort: rule.ToPort
                    }
                }]
            })
        );

        return commandOutput.Return ?? false;
    }
}

export { Ec2 };
