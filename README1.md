# Border Checker

Border Checker is a full-stack decision-support application for cross-border
data transfer and data sovereignty review. It combines discovered technical
metadata with manual policy context, evaluates GDPR, Saudi PDPL, Korea PIPA,
Brazil LGPD, and Taiwan PDPA rule packs, and returns only qualitative decisions
with explainable actions and legal basis references.

This project is intentionally positioned as an internal compliance support tool.
It does not replace legal advice.

## What It Does

- Merges cloud or discovered technical metadata with business and policy inputs
- Evaluates multi-jurisdiction policy packs with rule precedence only
- Returns one normalized decision grade:
  - `deny`
  - `manual_review`
  - `condition_allow`
  - `allow`
- Preserves triggered-rule rationale, legal basis references, required actions,
  next steps, and review hints
- Provides a Korean-language Next.js UI connected to the real FastAPI backend
- Provides a guided step-by-step input workflow with pack-specific questions and persisted values

## Architecture

- `backend/`
  - FastAPI API layer
  - merge, evaluate, packs, and demo-sample endpoints
  - rule evaluation engine with triggered-rule trace output
  - multi-pack policy directories under `policy_packs/`
- `frontend/`
  - Next.js App Router UI
  - real fetch integration to backend APIs
  - pack selector, guided step wizard, merge preview, decision result, and explainability panels
- `backend/sample_inputs/`
  - reference inputs for backend testing and policy-pack maintenance

## Decision Model

Scoring is removed from the product.

Final decisions are resolved by strict rule precedence only:

`deny > manual_review > condition_allow > allow`

If multiple rules trigger, the strictest decision wins while all triggered
rules, actions, and references remain visible in the response.

## Main API Endpoints

- `GET /api/v1/packs`
  - lists supported pack summaries
- `GET /api/v1/packs/{pack_id}/detail`
  - returns pack metadata used by the frontend
- `POST /api/v1/merge`
  - merges custom technical and policy inputs
- `POST /api/v1/evaluate`
  - runs the qualitative policy evaluation
- `POST /api/v1/cloud-discovery/aws`
  - collects or normalizes AWS S3 technical facts into `normalized_cloud_data`
- `POST /api/v1/cloud-discovery/azure`
  - collects or normalizes Azure Storage Account technical facts into `normalized_cloud_data`
- `POST /api/v1/cloud-discovery/normalize`
  - converts supplied mock/sample cloud discovery JSON into normalized technical inputs
- `GET /api/v1/samples/demo`
  - returns backend demo scenarios for API testing or pack validation

## Cloud Discovery

Cloud discovery is an input-assist layer, not legal automation. It only fills
technical facts that can be observed or inferred from cloud configuration, such
as:

- `current_region`
- `encryption_at_rest`
- `encryption_at_rest_effective`
- `bucket_default_encryption_configured`
- `kms_encryption_configured`
- `encryption_source`
- `encryption_in_transit`
- `access_control_in_place`
- `contains_sensitive_data`
- `data_type`
- `uses_processor`

Values that require legal or privacy judgment remain manual or unknown, including
lawful basis, notices, risk assessments, transfer exceptions, DPA existence,
DPO/legal review, and similar confirmations.

Mock/sample mode works without cloud SDKs:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/cloud-discovery/aws ^
  -H "Content-Type: application/json" ^
  -d "{\"resource_type\":\"s3_bucket\",\"resource_id\":\"customer-records-prod\",\"mode\":\"mock\",\"sample_discovery\":{\"region\":\"ap-northeast-2\",\"encryption\":{\"default_sse_enabled\":true}}}"
```

For the normalize endpoint, wrap the raw sample like this:

```json
{
  "provider": "aws",
  "resource_type": "s3_bucket",
  "resource_id": "customer-records-prod",
  "raw_discovery": {
    "region": "ap-northeast-2",
    "encryption": { "default_sse_enabled": true }
  }
}
```

Live mode is intentionally optional. The browser sends only resource identifiers
such as an S3 bucket name or Azure Storage Account name; cloud credentials stay
on the backend/server side.

- AWS: install `boto3`, then set `AWS_PROFILE` and/or `AWS_REGION` on the backend
- Azure: install `azure-identity` and `azure-mgmt-storage`, then set
  `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP`, and Azure service principal
  environment variables on the backend

Do not place access keys, secret keys, or tokens in frontend code or browser
storage. Use `backend/.env.example` as a template and keep real credentials in
local/server environment variables.

## AWS Online Integration - Web-Based Flow

For production-oriented browser-based onboarding, users do not run AWS CLI
commands and do not paste AWS access keys into the frontend. The recommended
path is IAM Role + ExternalId.

1. Click `AWS 연결 시작` in Border Checker.
2. Border Checker generates a `connection_id` and random per-connection
   `external_id`.
3. Click the AWS Console CloudFormation Quick Create link.
4. Create the stack. The template creates a stack-scoped `BorderCheckerRole-*`
   with an `sts:ExternalId` trust condition.
5. Paste the CloudFormation output `RoleArn` back into Border Checker.
6. Click `연결 확인`; the backend tests `sts:AssumeRole`.
7. Enter an S3 bucket name and click `버킷 검사하기`.
8. Click `권장 설정 적용 미리보기`, review the planned changes, then click
   `선택한 설정 적용` to apply:
   - AES256 default encryption
   - Public Access Block 4 settings
   - HTTPS-only bucket policy
   - S3 tags for `data_type`, `contains_sensitive_data`, `uses_processor`
9. Checked technical facts are copied into the policy evaluation input
   automatically after inspection. Legal judgment fields remain manual.

Backend environment variables:

```bash
BORDER_CHECKER_AWS_PRINCIPAL_ARN=arn:aws:iam::<backend-account-id>:role/<backend-role>
BORDER_CHECKER_AWS_CFN_TEMPLATE_URL=https://.../aws_border_checker_role.yaml
AWS_REGION=ap-northeast-2
AWS_PROFILE=optional-local-profile
```

The CloudFormation template is stored at:

```bash
backend/app/cloud_templates/aws_border_checker_role.yaml
```

The template grants S3 read permissions needed for inspection and, only when
`EnableRemediation=true`, S3 write permissions needed to apply recommended
settings. `EnableRemediation` defaults to `false`, and `s3:CreateBucket` is
intentionally excluded.

## AWS Online Integration - Simple Access Key Flow

The simple Access Key flow is for local development, class demos, and fast
testing only. Users can enter an
AWS Access Key ID, Secret Access Key, Region, and S3 Bucket Name directly in the
web UI, then run the S3 configuration check without installing or running AWS
CLI.

Security notes:

- The entered keys are not saved to the database.
- The entered keys are not saved to frontend `localStorage`, `sessionStorage`,
  cookies, or any other browser storage.
- The backend uses the keys only in memory for the current request.
- Do not log request bodies for these endpoints.
- Production use should use the IAM Role + STS AssumeRole flow instead.

Read-only check permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetBucketLocation",
        "s3:GetBucketEncryption",
        "s3:GetBucketTagging",
        "s3:GetBucketPolicy",
        "s3:GetBucketPublicAccessBlock"
      ],
      "Resource": "*"
    }
  ]
}
```

Permissions for selected recommended settings:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetBucketLocation",
        "s3:GetBucketEncryption",
        "s3:GetBucketTagging",
        "s3:GetBucketPolicy",
        "s3:GetBucketPublicAccessBlock",
        "s3:PutBucketEncryption",
        "s3:PutBucketTagging",
        "s3:PutBucketPolicy",
        "s3:PutBucketPublicAccessBlock"
      ],
      "Resource": "*"
    }
  ]
}
```

## Run Locally

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend default URL:

```bash
http://127.0.0.1:8000
```

### 2. Frontend

```bash
cd frontend
npm ci
npm run dev
```

Frontend default URL:

```bash
http://127.0.0.1:3000
```

Optional environment variable:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Demo Flow

1. Open the frontend
2. Choose the legal pack, then answer the step-by-step guided questions
3. Click the merge preview button to inspect the merged input
4. Click the evaluation button
5. Review the final decision, triggered rules, legal basis, and next steps

## Sample Scenarios Included

- Korea adequacy path: expected `allow`
- US transfer with SCC path and missing documentation: expected `condition_allow`
- Sensitive-data transfer with incomplete evidence: expected `manual_review`
- Third-country transfer with no valid mechanism: expected `deny`

Other pack metadata also includes sample scenario definitions for internal
validation, but the main site uses direct user input rather than a sample-loader
flow.

## Policy Pack Files

- GDPR pack:
  - `backend/policy_packs/gdpr/gdpr_pack_v3.json`
  - `backend/policy_packs/gdpr/input_schema_v2.json`
- Saudi PDPL pack:
  - `backend/policy_packs/saudi_pdpl/saudi_pdpl_pack_v1.json`
  - `backend/policy_packs/saudi_pdpl/input_schema_v1.json`
- Korea PIPA pack:
  - `backend/policy_packs/korea_pipa/pipa_pack_v1.json`
  - `backend/policy_packs/korea_pipa/input_schema_v1.json`
- Brazil LGPD pack:
  - `backend/policy_packs/lgpd/lgpd_pack_v1.json`
  - `backend/policy_packs/lgpd/input_schema_v1.json`
- Taiwan PDPA pack:
  - `backend/policy_packs/taiwan_pdpa/taiwan_pack_v1.json`
  - `backend/policy_packs/taiwan_pdpa/input_schema_v1.json`

If you want to change policy logic, start here:

- update rules in the relevant JSON file under `backend/policy_packs/<pack_id>/`
- adjust pack-specific derived facts in `backend/app/services/derived_fields.py`
- update pack loading in `backend/app/services/pack_loader.py`
- update guided input definitions in `frontend/app/guided-pack-config.ts`

## Verification

Backend tests:

```bash
cd backend
python -m unittest discover -s tests
```

Frontend checks:

```bash
cd frontend
npm.cmd run lint
```

## Limitations

- This tool is a policy-based decision-support aid, not a legal advice engine
- Unknown or incomplete facts may correctly produce `manual_review`
- The policy packs are operational and demo-ready, but not a substitute for
  case-specific legal review

## Disclaimer

This tool is a policy-based decision-support aid and does not replace formal
legal review, DPO review, or legal counsel where interpretation is uncertain.
