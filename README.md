# update-aws-vpc-security-rule

Update IP address on AWS VPC security group inbound rule. This will update the selected security rule using the user's public IP address.

## Running

Install package dependencies and build the application using `npm` or `yarn`:

```console
npm install
npm run build
```

or

```console
yarn install
yarn build
```

Run the application using:

```console
npm start
```

or

```console
yarn start
```

Alternatively, the application can be built and run in one step by running:

```console
npm run build:run
```

or

```console
yarn build:run
```

## Usage

The public IP address is automatically determined when the application is started. If the IP address cannot be determined (e.g. if the user is offline) the application will exit.

If IP detection was successful, the user is prompted for AWS credentials, region, security group, and finally the security group rule.

<img src="https://github.com/mattsmithcode/update-aws-vpc-security-rule/raw/main/assets/usage.gif" alt="Usage example" width="640" height="151" />

The selected security rule will be updated with the public IP address.

## AWS Credentials

Credentials will be attempted to be read from three different sources in the following order:

- Environment variables
  - If `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_SESSION_TOKEN` environment variable are set, these will be used
- AWS credentials file
  - Read from `~/.aws/credentials`
  - A current limitation means that if multiple configurations exist in the credentials file, the *last* configuration will be used
- Console input
  - If credentials could not be read from either of the above methods, the user will be prompted to paste them in the console
  - Any of the formats provided by AWS (Linux/macOS, Windows, or PowerShell) can be used

## Planned Improvements

- Improve methods of reading AWS credentials, particularly when using a credentials file and the AWS CLI
- Add a CLI mode to allow options to be specified via command arguments as well as interactively
- Publish to `npm`

## Licence

[ISC](https://github.com/mattsmithcode/update-aws-vpc-security-rule/blob/main/LICENCE)
