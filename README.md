# Border Checker

Border Checker는 **국경 간 데이터 이전(cross-border data transfer)** 및 **데이터 주권(data sovereignty)** 검토를 지원하는 풀스택 의사결정 지원 애플리케이션입니다.  
클라우드에서 발견한 기술 메타데이터와 사용자가 직접 입력한 정책·비즈니스 맥락을 결합한 뒤, GDPR, Saudi PDPL, Korea PIPA, Brazil LGPD, Taiwan PDPA 정책 팩을 평가하여 설명 가능한 정성적 판단 결과를 제공합니다.

본 프로젝트는 내부 컴플라이언스 검토를 보조하기 위한 도구입니다.  
법률 자문이나 변호사의 검토를 대체하지 않습니다.

---

## 주요 기능

- 클라우드 또는 기타 발견된 기술 메타데이터와 비즈니스·정책 입력값 병합
- 여러 관할권의 정책 팩을 규칙 우선순위 기반으로 평가
- 하나의 정규화된 최종 판단 등급 반환
  - `deny`
  - `manual_review`
  - `condition_allow`
  - `allow`
- 발동된 규칙의 근거, 법적 근거 조항, 필수 조치, 다음 단계, 검토 힌트 제공
- 실제 FastAPI 백엔드와 연결된 한국어 Next.js UI 제공
- 정책 팩별 질문으로 구성된 단계별 입력 흐름과 입력값 유지 기능 제공

---

## 아키텍처

### `backend/`

- FastAPI 기반 API 계층
- 입력 병합, 정책 평가, 정책 팩 조회, 데모 샘플 API 제공
- 발동된 규칙 추적 결과를 포함하는 규칙 평가 엔진
- `policy_packs/` 하위에 다중 관할권 정책 팩 디렉터리 구성

### `frontend/`

- Next.js App Router 기반 UI
- 백엔드 API와 실제 fetch 연동
- 정책 팩 선택, 단계별 입력 마법사, 병합 미리보기, 판단 결과, 설명 패널 제공

### `backend/sample_inputs/`

- 백엔드 테스트 및 정책 팩 유지보수를 위한 기준 입력 샘플 제공

---

## 판단 모델

본 프로젝트에서는 점수 기반 판단을 제거했습니다.

최종 판단은 아래의 엄격한 규칙 우선순위만으로 결정됩니다.

```text
deny > manual_review > condition_allow > allow
```

여러 규칙이 동시에 발동되는 경우, 가장 엄격한 판단이 최종 결과가 됩니다.  
다만 발동된 모든 규칙, 필수 조치, 법적 근거, 검토 힌트는 응답에 그대로 포함됩니다.

---

## 주요 API 엔드포인트

### `GET /api/v1/packs`

지원되는 정책 팩 목록을 반환합니다.

### `GET /api/v1/packs/{pack_id}/detail`

프론트엔드에서 사용하는 정책 팩 메타데이터를 반환합니다.

### `POST /api/v1/merge`

사용자 정의 기술 입력값과 정책 입력값을 병합합니다.

### `POST /api/v1/evaluate`

정성적 정책 평가를 실행합니다.

### `POST /api/v1/cloud-discovery/aws`

AWS S3 기술 사실을 수집하거나 정규화하여 `normalized_cloud_data`로 반환합니다.

### `POST /api/v1/cloud-discovery/azure`

Azure Storage Account 기술 사실을 수집하거나 정규화하여 `normalized_cloud_data`로 반환합니다.

### `POST /api/v1/cloud-discovery/normalize`

전달된 mock/sample 클라우드 발견 JSON을 정규화된 기술 입력값으로 변환합니다.

### `GET /api/v1/samples/demo`

API 테스트 또는 정책 팩 검증을 위한 백엔드 데모 시나리오를 반환합니다.

---

## Cloud Discovery

Cloud Discovery는 법률 판단 자동화 기능이 아니라, **입력값 보조 계층**입니다.  
즉, 클라우드 설정에서 관찰하거나 추론 가능한 기술 사실만 자동으로 채웁니다.

예시는 다음과 같습니다.

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

반대로 법률적·프라이버시 판단이 필요한 값은 자동으로 확정하지 않고 수동 입력 또는 unknown 상태로 남깁니다.

예시는 다음과 같습니다.

- 적법근거
- 고지 여부
- 위험평가 여부
- 이전 예외 해당 여부
- DPA 존재 여부
- DPO 또는 법무 검토 여부
- 기타 법적 해석이 필요한 확인 사항

### Mock/Sample 모드

Mock/Sample 모드는 클라우드 SDK 없이도 동작합니다.

```bash
curl -X POST http://127.0.0.1:8000/api/v1/cloud-discovery/aws ^
  -H "Content-Type: application/json" ^
  -d "{\"resource_type\":\"s3_bucket\",\"resource_id\":\"customer-records-prod\",\"mode\":\"mock\",\"sample_discovery\":{\"region\":\"ap-northeast-2\",\"encryption\":{\"default_sse_enabled\":true}}}"
```

### Normalize 엔드포인트 입력 예시

`normalize` 엔드포인트를 사용할 때는 원본 샘플을 아래와 같이 감싸서 전달합니다.

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

### Live 모드

Live 모드는 선택 사항입니다.  
브라우저는 S3 버킷 이름 또는 Azure Storage Account 이름 같은 리소스 식별자만 전송합니다.  
클라우드 자격증명은 백엔드 또는 서버 측 환경에만 유지됩니다.

- AWS: `boto3` 설치 후 백엔드에서 `AWS_PROFILE` 및/또는 `AWS_REGION` 설정
- Azure: `azure-identity`, `azure-mgmt-storage` 설치 후 백엔드에서 `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP`, Azure 서비스 주체 환경 변수 설정

Access Key, Secret Key, Token을 프론트엔드 코드나 브라우저 저장소에 넣지 마세요.  
실제 자격증명은 `backend/.env.example`을 참고하여 로컬 또는 서버 환경 변수에만 저장해야 합니다.

---

## AWS 온라인 연동 - 웹 기반 흐름

운영 환경에 가까운 브라우저 기반 온보딩에서는 사용자가 AWS CLI 명령어를 실행하거나 AWS Access Key를 프론트엔드에 붙여넣지 않습니다.  
권장 방식은 **IAM Role + ExternalId** 방식입니다.

1. Border Checker에서 `AWS 연결 시작`을 클릭합니다.
2. Border Checker가 `connection_id`와 연결별 랜덤 `external_id`를 생성합니다.
3. AWS Console CloudFormation Quick Create 링크를 클릭합니다.
4. CloudFormation 스택을 생성합니다. 템플릿은 `sts:ExternalId` 신뢰 조건이 포함된 스택 범위의 `BorderCheckerRole-*` 역할을 생성합니다.
5. CloudFormation 출력값인 `RoleArn`을 Border Checker에 붙여넣습니다.
6. `연결 확인`을 클릭하면 백엔드가 `sts:AssumeRole`을 테스트합니다.
7. S3 버킷 이름을 입력하고 `버킷 검사하기`를 클릭합니다.
8. `권장 설정 적용 미리보기`를 클릭하여 변경 예정 항목을 검토한 뒤, `선택한 설정 적용`을 클릭합니다.
   - AES256 기본 암호화
   - Public Access Block 4개 설정
   - HTTPS-only 버킷 정책
   - `data_type`, `contains_sensitive_data`, `uses_processor` S3 태그
9. 검사를 통해 확인된 기술 사실은 정책 평가 입력값에 자동으로 반영됩니다.  
   법률 판단이 필요한 필드는 계속 수동 입력으로 유지됩니다.

### 백엔드 환경 변수

```bash
BORDER_CHECKER_AWS_PRINCIPAL_ARN=arn:aws:iam::<backend-account-id>:role/<backend-role>
BORDER_CHECKER_AWS_CFN_TEMPLATE_URL=https://.../aws_border_checker_role.yaml
AWS_REGION=ap-northeast-2
AWS_PROFILE=optional-local-profile
```

CloudFormation 템플릿 위치는 다음과 같습니다.

```bash
backend/app/cloud_templates/aws_border_checker_role.yaml
```

이 템플릿은 검사에 필요한 S3 읽기 권한을 부여합니다.  
`EnableRemediation=true`인 경우에만 권장 설정 적용을 위한 S3 쓰기 권한을 추가합니다.  
`EnableRemediation`의 기본값은 `false`이며, `s3:CreateBucket` 권한은 의도적으로 제외되어 있습니다.

---

## AWS 온라인 연동 - 간단 Access Key 흐름

간단 Access Key 흐름은 **로컬 개발, 수업 시연, 빠른 테스트 전용**입니다.  
사용자는 웹 UI에서 AWS Access Key ID, Secret Access Key, Region, S3 Bucket Name을 직접 입력한 뒤, AWS CLI 설치 없이 S3 설정 검사를 실행할 수 있습니다.

### 보안 주의사항

- 입력된 키는 데이터베이스에 저장하지 않습니다.
- 입력된 키는 프론트엔드 `localStorage`, `sessionStorage`, 쿠키, 기타 브라우저 저장소에 저장하지 않습니다.
- 백엔드는 입력된 키를 현재 요청 처리 중 메모리에서만 사용합니다.
- 해당 엔드포인트에서는 request body를 로그로 남기지 않아야 합니다.
- 운영 환경에서는 Access Key 방식이 아니라 IAM Role + STS AssumeRole 방식을 사용해야 합니다.

### 읽기 전용 검사 권한 예시

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

### 선택한 권장 설정 적용 권한 예시

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

---

## 로컬 실행 방법

### 1. 백엔드 실행

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

백엔드 기본 URL은 다음과 같습니다.

```bash
http://127.0.0.1:8000
```

### 2. 프론트엔드 실행

```bash
cd frontend
npm ci
npm run dev
```

프론트엔드 기본 URL은 다음과 같습니다.

```bash
http://127.0.0.1:3000
```

선택적으로 아래 환경 변수를 설정할 수 있습니다.

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

---

## 데모 흐름

1. 프론트엔드에 접속합니다.
2. 법률 정책 팩을 선택한 뒤, 단계별 질문에 답합니다.
3. 병합 미리보기 버튼을 눌러 병합된 입력값을 확인합니다.
4. 평가 버튼을 눌러 정책 평가를 실행합니다.
5. 최종 판단, 발동된 규칙, 법적 근거, 다음 조치를 검토합니다.

---

## 포함된 샘플 시나리오

- 한국 적정성 경로: 예상 결과 `allow`
- SCC 경로를 사용하는 미국 이전 및 일부 문서화 누락: 예상 결과 `condition_allow`
- 증거가 불완전한 민감정보 이전: 예상 결과 `manual_review`
- 유효한 이전 메커니즘이 없는 제3국 이전: 예상 결과 `deny`

다른 정책 팩 메타데이터에도 내부 검증용 샘플 시나리오 정의가 포함되어 있습니다.  
다만 메인 사이트는 샘플 로더 흐름이 아니라 사용자의 직접 입력을 기준으로 동작합니다.

---

## 정책 팩 파일

### GDPR 팩

- `backend/policy_packs/gdpr/gdpr_pack_v3.json`
- `backend/policy_packs/gdpr/input_schema_v2.json`

### Saudi PDPL 팩

- `backend/policy_packs/saudi_pdpl/saudi_pdpl_pack_v1.json`
- `backend/policy_packs/saudi_pdpl/input_schema_v1.json`

### Korea PIPA 팩

- `backend/policy_packs/korea_pipa/pipa_pack_v1.json`
- `backend/policy_packs/korea_pipa/input_schema_v1.json`

### Brazil LGPD 팩

- `backend/policy_packs/lgpd/lgpd_pack_v1.json`
- `backend/policy_packs/lgpd/input_schema_v1.json`

### Taiwan PDPA 팩

- `backend/policy_packs/taiwan_pdpa/taiwan_pack_v1.json`
- `backend/policy_packs/taiwan_pdpa/input_schema_v1.json`

정책 로직을 수정하려면 아래 파일부터 확인하면 됩니다.

- `backend/policy_packs/<pack_id>/` 하위의 관련 JSON 규칙 파일 수정
- `backend/app/services/derived_fields.py`에서 정책 팩별 파생 필드 조정
- `backend/app/services/pack_loader.py`에서 정책 팩 로딩 방식 수정
- `frontend/app/guided-pack-config.ts`에서 단계별 입력 질문 정의 수정

---

## 검증 방법

### 백엔드 테스트

```bash
cd backend
python -m unittest discover -s tests
```

### 프론트엔드 검사

```bash
cd frontend
npm.cmd run lint
```

---

## 한계

- 이 도구는 정책 기반 의사결정 지원 도구이며, 법률 자문 엔진이 아닙니다.
- 알 수 없거나 불완전한 사실관계는 정상적으로 `manual_review` 결과를 만들 수 있습니다.
- 정책 팩은 운영 및 데모가 가능한 수준으로 구성되어 있지만, 개별 사안에 대한 법률 검토를 대체하지 않습니다.

---

## 면책 고지

Border Checker는 정책 기반 의사결정 지원 도구입니다.  
법률 해석이 불확실하거나 사안별 검토가 필요한 경우, 공식적인 법무 검토, DPO 검토, 또는 법률 전문가의 자문을 대체하지 않습니다.
