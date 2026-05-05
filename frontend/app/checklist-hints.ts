const HINT_PATTERNS = [
  {
    keywords: ["SCC", "표준계약조항"],
    hint: "국외이전 계약상 보호장치입니다. 실제 서명본과 부속서 최신 상태를 확인하면 좋습니다.",
  },
  {
    keywords: ["DPA", "프로세서 계약", "처리자 계약"],
    hint: "외부 업체와의 개인정보 처리 계약입니다. 역할, 감사권, 보안책임이 들어가야 읽기 쉽습니다.",
  },
  {
    keywords: ["DPIA", "영향 평가"],
    hint: "고위험 처리 전에 위험과 완화조치를 적는 문서입니다. 결과와 잔여 위험 승인 여부를 같이 봅니다.",
  },
  {
    keywords: ["privacy by design", "프라이버시 설계", "기본값 검토"],
    hint: "서비스 설계 단계에서부터 개인정보를 적게 보고, 기본 설정도 보수적으로 잡았는지 확인하는 개념입니다.",
  },
  {
    keywords: ["DPO", "개인정보 보호 책임자"],
    hint: "대규모 또는 민감한 처리에서는 전담 책임자가 필요한지 먼저 판단하고, 필요하면 지정 여부를 확인합니다.",
  },
  {
    keywords: ["ROPA", "처리 활동 기록부", "처리 기록"],
    hint: "누가 어떤 데이터를 왜 처리하는지 남기는 내부 기록입니다. 감사 대응과 변경 추적에 중요합니다.",
  },
  {
    keywords: ["민감정보", "민감한"],
    hint: "건강, 생체, 인사처럼 민감한 정보는 일반 데이터보다 더 강한 근거와 보호조치를 요구할 수 있습니다.",
  },
  {
    keywords: ["이전 영향 평가", "TIA", "위험평가"],
    hint: "대상국 환경과 보호조치의 실효성을 확인하는 문서입니다. 국외이전 검토에서 핵심 증빙으로 쓰입니다.",
  },
  {
    keywords: ["예외 이전", "예외 경로", "derogation"],
    hint: "정식 보호조치 대신 예외적으로만 쓰는 경로입니다. 반복 운영보다는 제한적 상황에서만 신중하게 씁니다.",
  },
  {
    keywords: ["보완조치", "추가 보호조치"],
    hint: "암호화, 분리보관, 계약상 제한처럼 기본 계약 외에 덧붙이는 추가 통제입니다.",
  },
  {
    keywords: ["BCR", "공통구속규칙", "구속규칙"],
    hint: "같은 기업집단 안에서 데이터를 옮길 때 쓰는 내부 규칙입니다. 공식 승인과 실제 운영 일치 여부가 중요합니다.",
  },
  {
    keywords: ["인증", "행동강령"],
    hint: "승인된 인증이나 행동강령은 보호조치의 근거가 될 수 있습니다. 최신 유효성과 적용 범위를 같이 보면 좋습니다.",
  },
  {
    keywords: ["권리 요청", "정보주체 권리", "열람", "삭제", "정정", "이동권"],
    hint: "고객이나 임직원이 자기 개인정보에 대해 요청했을 때 처리하는 절차입니다. 담당자와 응답 경로가 있으면 좋습니다.",
  },
  {
    keywords: ["처리방침", "개인정보 처리방침", "고지"],
    hint: "사용자에게 왜 처리하는지, 어디로 이전하는지 설명하는 문서입니다. 실제 화면 문구와 최신 여부를 같이 확인합니다.",
  },
  {
    keywords: ["침해", "브리치", "72시간", "신고", "통지"],
    hint: "사고가 나면 언제 누구에게 보고할지 정리한 대응 체계입니다. 연락 체계와 보고 기준이 명확해야 합니다.",
  },
  {
    keywords: ["암호화", "접근통제"],
    hint: "기본 보안 통제 항목입니다. 저장·전송 보호와 권한 제한이 실제로 켜져 있는지 보면 좋습니다.",
  },
  {
    keywords: ["하위처리자", "재이전", "재위탁"],
    hint: "벤더가 다시 다른 업체를 쓰거나 다른 나라로 넘길 수 있는지에 대한 통제입니다. 사전 승인과 통지 조항을 많이 봅니다.",
  },
  {
    keywords: ["적법 근거", "처리 근거", "동의", "정당한 이익"],
    hint: "이 처리를 왜 할 수 있는지 설명하는 법적 이유입니다. 목적과 실제 운영 방식이 맞아야 합니다.",
  },
  {
    keywords: ["처리 목적", "목적 정의", "목적 제한"],
    hint: "왜 이 데이터를 쓰는지 먼저 분명해야 이후 계약, 고지, 보관기간도 자연스럽게 맞출 수 있습니다.",
  },
  {
    keywords: ["최소화", "필요 최소", "범위 축소"],
    hint: "업무에 꼭 필요한 정보만 다루는 원칙입니다. 필드 수, 기간, 대상자를 줄이는 식으로 실무 반영합니다.",
  },
  {
    keywords: ["보관기간", "파기", "삭제 주기"],
    hint: "언제까지 들고 있고 언제 지울지 정한 기준입니다. 실제 삭제 절차나 보존 예외도 같이 정리하면 좋습니다.",
  },
  {
    keywords: ["수탁자 보증", "프로세서 준수 검증", "벤더 실사"],
    hint: "외부 업체가 개인정보를 안전하게 처리할 수 있는지 확인한 흔적입니다. 보안 자료와 계약 조건을 같이 봅니다.",
  },
  {
    keywords: ["적정 보호 수준", "adequate", "적정성"],
    hint: "상대 국가의 보호 수준이 충분하다고 인정된 경우를 뜻합니다. 공식 근거가 유지되는지 확인이 필요합니다.",
  },
  {
    keywords: ["동의 철회"],
    hint: "동의 기반 처리라면 사용자가 동의를 쉽게 철회할 수 있어야 합니다. 실제 화면이나 고객지원 경로가 있으면 좋습니다.",
  },
  {
    keywords: ["정확성", "최신성"],
    hint: "개인정보가 오래되거나 틀리지 않게 관리하는 절차입니다. 정정 요청 반영 흐름과 함께 확인합니다.",
  },
  {
    keywords: ["GDPR Art. 6"],
    hint: "개인정보 처리를 시작할 수 있는 기본 적법 근거 조문입니다.",
  },
  {
    keywords: ["GDPR Art. 9"],
    hint: "민감정보를 다룰 때 추가 예외 요건이 필요한 조문입니다.",
  },
  {
    keywords: ["GDPR Art. 12", "Art. 15-22"],
    hint: "이용자 요청을 이해하기 쉽게 받고, 권리 행사를 실제로 처리해야 한다는 흐름입니다.",
  },
  {
    keywords: ["GDPR Art. 28"],
    hint: "외부 업체를 쓸 때 계약, 감독, 하위처리자 통제가 필요한 조문입니다.",
  },
  {
    keywords: ["GDPR Art. 30"],
    hint: "처리 활동과 이전 내용을 내부 기록으로 남겨야 한다는 조문입니다.",
  },
  {
    keywords: ["GDPR Art. 32"],
    hint: "암호화, 접근통제 같은 기본 보안 조치가 필요한 조문입니다.",
  },
  {
    keywords: ["GDPR Art. 33", "Art. 34"],
    hint: "개인정보 침해 발생 시 빠른 신고·통지 준비가 필요하다는 조문입니다.",
  },
  {
    keywords: ["GDPR Art. 35"],
    hint: "고위험 처리 전에 DPIA를 해야 하는 조문입니다.",
  },
  {
    keywords: ["GDPR Art. 37"],
    hint: "일부 조직은 DPO를 지정해야 한다는 조문입니다.",
  },
  {
    keywords: ["GDPR Art. 44", "GDPR Art. 45", "GDPR Art. 46", "GDPR Art. 49"],
    hint: "EU 밖 이전이 가능한지 보는 핵심 이전 조문들입니다. 적정성, 보호조치, 예외 경로를 구분해 봅니다.",
  },
  {
    keywords: ["PDPL Art. 4", "PDPL Art. 21"],
    hint: "정보주체 권리와 그 요청에 대응하는 운영 절차를 요구하는 흐름입니다.",
  },
  {
    keywords: ["PDPL Art. 8"],
    hint: "외부 프로세서를 쓰더라도 최종 책임은 컨트롤러에게 남는다는 취지의 조문입니다.",
  },
  {
    keywords: ["PDPL Art. 12"],
    hint: "개인정보 처리방침과 기본 고지를 정리해야 한다는 흐름입니다.",
  },
  {
    keywords: ["PDPL Art. 14"],
    hint: "개인정보를 정확하고 최신 상태로 유지해야 한다는 흐름입니다.",
  },
  {
    keywords: ["PDPL Art. 20", "Implementing Regulation Art. 24"],
    hint: "보안 사고 대응과 적시에 알릴 준비가 되어 있어야 한다는 흐름입니다.",
  },
  {
    keywords: ["PDPL Art. 22"],
    hint: "내부 영향 검토와 문서화 같은 책임성 요소를 뒷받침하는 흐름입니다.",
  },
  {
    keywords: ["PDPL Art. 29", "Transfer Regulation Art. 5", "Transfer Regulation Art. 6", "Transfer Regulation Art. 8"],
    hint: "사우디 밖 이전 시 적정 보호 수준, 승인된 보호조치, 예외 경로, 위험평가를 함께 보는 핵심 규정 흐름입니다.",
  },
  {
    keywords: ["PDPL Art. 30", "Implementing Regulation Art. 32"],
    hint: "고위험 처리에서는 DPO 필요 여부를 공식 기준에 맞춰 판단해야 한다는 흐름입니다.",
  },
];

export function buildChecklistItemHint(item: string) {
  const normalized = item.toLowerCase();
  const matched = HINT_PATTERNS.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())),
  );

  return matched?.hint ?? null;
}

export function buildChecklistHintMap(items: string[]) {
  return items.reduce<Record<string, string>>((accumulator, item) => {
    const hint = buildChecklistItemHint(item);
    if (hint) {
      accumulator[item] = hint;
    }
    return accumulator;
  }, {});
}
