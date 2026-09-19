# Pico AWS test foundation

This stack is intentionally small and serverless. It creates a Cognito user pool, one on-demand DynamoDB table, an encrypted SQS queue, an EventBridge bus, a 128 MB Lambda exposed through an HTTP API at `GET /health`, and a least-privilege Amplify SSR compute role that can access only the Pico table.

It does **not** create Bedrock provisioned throughput, OpenSearch, RDS, EC2, ECS, a NAT gateway, or any continuously running compute. AWS can still charge when usage exceeds an account's current free allowances, so inspect Billing and Free Tier before deployment and remove the stack after testing.

## Validate without creating resources

```bash
aws cloudformation validate-template \
  --template-body file://infra/aws/pico-foundation.yaml \
  --region us-east-1
```

## Deploy the test stack

```bash
aws cloudformation deploy \
  --template-file infra/aws/pico-foundation.yaml \
  --stack-name pico-dev \
  --region us-east-1 \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
  --parameter-overrides Stage=dev \
  --tags Project=Pico Environment=dev \
  --no-fail-on-empty-changeset
```

After deployment, copy the CloudFormation outputs into `apps/web/.env.local`:

```dotenv
AWS_REGION=us-east-1
PICO_AWS_API_URL=https://example.execute-api.us-east-1.amazonaws.com
PICO_DYNAMODB_TABLE=pico-dev
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_example
NEXT_PUBLIC_COGNITO_CLIENT_ID=example
```

The AWS MCP OAuth login is for Codex administration. It is not an application credential and is never copied into the project. Deployed Lambda functions use their IAM execution role.

## Remove all test resources

```bash
aws cloudformation delete-stack --stack-name pico-dev --region us-east-1
aws cloudformation wait stack-delete-complete --stack-name pico-dev --region us-east-1
```
