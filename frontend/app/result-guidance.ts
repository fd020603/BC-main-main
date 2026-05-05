import type { EvaluationResult } from "./workspace-types";

const ARTICLE_EXPLAINERS = [
  {
    match: "GDPR Art. 44",
    plain: "EU 밖으로 데이터를 보낼 때 따라야 하는 기본 규칙입니다.",
  },
  {
    match: "GDPR Art. 45",
    plain: "상대 국가가 충분한 보호 수준으로 인정된 경우의 허용 경로입니다.",
  },
  {
    match: "GDPR Art. 46",
    plain: "SCC 같은 계약·보호조치를 갖춰서 이전하는 경로입니다.",
  },
  {
    match: "GDPR Art. 49",
    plain: "예외적으로만 허용되는 이전 사유입니다.",
  },
  {
    match: "GDPR Art. 28",
    plain: "외부 처리업체를 쓸 때 계약과 감독을 요구하는 규칙입니다.",
  },
  {
    match: "GDPR Art. 13",
    plain: "개인정보 처리와 국외이전 사실을 이용자에게 알려야 한다는 규칙입니다.",
  },
  {
    match: "GDPR Art. 12",
    plain: "이용자 요청을 이해하기 쉽게 받고 처리해 줘야 한다는 규칙입니다.",
  },
  {
    match: "GDPR Art. 24",
    plain: "회사가 개인정보 보호 책임을 실제로 관리하고 증명해야 한다는 규칙입니다.",
  },
  {
    match: "GDPR Art. 25",
    plain: "서비스 설계 단계부터 개인정보 최소화가 반영돼야 한다는 규칙입니다.",
  },
  {
    match: "GDPR Art. 30",
    plain: "처리 활동과 이전 내용을 내부 문서로 남겨야 한다는 규칙입니다.",
  },
  {
    match: "GDPR Art. 32",
    plain: "암호화, 접근통제 같은 기본 보안 조치를 요구하는 규칙입니다.",
  },
  {
    match: "GDPR Art. 33",
    plain: "침해 사고가 나면 빠르게 신고·통지 판단을 할 수 있어야 한다는 규칙입니다.",
  },
  {
    match: "GDPR Art. 35",
    plain: "위험이 큰 처리라면 사전에 영향평가를 해야 한다는 규칙입니다.",
  },
  {
    match: "GDPR Art. 37",
    plain: "일부 고위험 조직은 개인정보 보호 책임자를 지정해야 한다는 규칙입니다.",
  },
  {
    match: "PDPL Art. 4",
    plain: "정보주체가 열람·정정·삭제 등 권리를 행사할 수 있어야 한다는 규칙입니다.",
  },
  {
    match: "PDPL Art. 12",
    plain: "회사는 개인정보 처리방침을 마련하고 제공해야 한다는 규칙입니다.",
  },
  {
    match: "PDPL Art. 29",
    plain: "사우디 밖으로 데이터를 보내는 기본 국외이전 규칙입니다.",
  },
  {
    match: "PDPL Art. 14",
    plain: "개인정보는 정확하고 최신 상태로 관리되어야 한다는 규칙입니다.",
  },
  {
    match: "PDPL Art. 20",
    plain: "침해 사고가 나면 정해진 시한 안에 대응·통지 준비가 되어 있어야 한다는 규칙입니다.",
  },
  {
    match: "PDPL Art. 21",
    plain: "정보주체 요청에 대응하는 운영 절차가 있어야 한다는 규칙입니다.",
  },
  {
    match: "PDPL Art. 22",
    plain: "상황에 따라 처리 영향 검토 같은 내부 책임성 문서가 필요하다는 취지의 규칙입니다.",
  },
  {
    match: "PDPL Art. 30",
    plain: "고위험 처리 상황에서는 개인정보 보호 책임자 지정 필요성을 봐야 한다는 규칙입니다.",
  },
  {
    match: "PDPL Art. 8",
    plain: "외부 처리업체를 쓸 때 계약과 관리 책임을 요구하는 규칙입니다.",
  },
  {
    match: "PDPL Art. 13",
    plain: "개인정보 처리와 이전 사실을 고지해야 한다는 규칙입니다.",
  },
  {
    match: "PDPL Art. 31",
    plain: "내부 기록과 책임성 문서를 유지해야 한다는 취지의 규칙입니다.",
  },
  {
    match: "PDPL Art. 32",
    plain: "상황에 따라 개인정보 보호 책임자를 지정해야 할 수 있다는 규칙입니다.",
  },
  {
    match: "Transfer Regulation Art. 5",
    plain: "승인된 보호조치가 있으면 국외이전을 검토할 수 있다는 규칙입니다.",
  },
  {
    match: "Transfer Regulation Art. 6",
    plain: "보호조치가 없을 때 사용할 수 있는 예외 경로와 조건입니다.",
  },
  {
    match: "Transfer Regulation Art. 8",
    plain: "국외이전 위험평가와 사전 검토를 요구하는 규칙입니다.",
  },
  {
    match: "Implementing Regulation Art. 24",
    plain: "보안과 침해 대응 절차를 실제 운영 수준으로 준비해야 한다는 취지의 기준입니다.",
  },
  {
    match: "Implementing Regulation Art. 32",
    plain: "DPO 지정 필요 여부를 공식 기준에 따라 판단해야 한다는 취지의 기준입니다.",
  },
];

const CATEGORY_EXPLAINERS: Record<string, string> = {
  lawfulness: "이 처리를 왜 할 수 있는지에 대한 법적 근거",
  cross_border_transfer: "국외이전 자체를 허용할 수 있는 경로와 보호조치",
  transfer_mechanism: "국외이전 경로를 정당화하는 계약·보호장치",
  processor_management: "외부 업체를 쓸 때 필요한 계약과 관리",
  security_controls: "암호화, 접근통제, 침해 대응 같은 보안 통제",
  transparency_and_accountability: "고지, 기록, 문서화 같은 책임성 항목",
  accountability: "내부 문서, 책임자, 영향검토 같은 운영 책임성 항목",
  governance_foundation: "처리 목적, 최소화, 보관기간 같은 기본 거버넌스 항목",
  sensitive_data: "민감정보 처리에 필요한 추가 요건",
  special_category_data: "민감정보 처리에 필요한 추가 요건",
  allowance_path: "현재 구조에서 허용 가능하다고 보는 이유",
};

type BeginnerGuidance = {
  businessMeaning: string;
  canProceedNow: string;
  primaryReason: string;
  legalExplanation: string;
  decisionImpact: string;
  supportingDetails: string[];
  firstAction: string;
  whoShouldBeInvolved: string;
  quickChecklist: string[];
  glossary: string[];
};

type TriggeredRule = EvaluationResult["triggered_rules"][number];

function dedupe(values: string[]) {
  return values.filter((value, index) => value && values.indexOf(value) === index);
}

function explainArticles(articles: string[]) {
  const notes = articles.flatMap((article) =>
    ARTICLE_EXPLAINERS.filter((item) => article.includes(item.match)).map(
      (item) => `${item.match}: ${item.plain}`,
    ),
  );

  return dedupe(notes).slice(0, 5);
}

function buildRestrictionSentence(
  rule: TriggeredRule | undefined,
  finalDecision: EvaluationResult["final_decision"],
  categoryHint: string,
) {
  if (!rule) {
    return "현재 입력 기준에서는 결론을 뒤집을 만한 차단 조항이 뚜렷하게 발동하지 않았습니다.";
  }

  if (rule.rule_id.includes("sensitive-legitimate-interest")) {
    return `${rule.article}에 의해 민감정보 처리에는 정당한 이익 경로를 사용할 수 없습니다. 민감정보를 계속 처리하려면 동의, 법적 의무 등 허용 가능한 근거를 다시 잡아야 합니다.`;
  }

  if (rule.category === "lawfulness") {
    return `${rule.article} 기준으로 개인정보 처리는 목적과 연결된 적법 근거가 먼저 확인되어야 합니다. 현재는 그 근거가 비어 있어 이 데이터 처리 또는 이전을 승인 근거로 사용할 수 없습니다.`;
  }

  if (
    rule.category === "sensitive_data"
    || rule.category === "special_category_data"
  ) {
    return `${rule.article} 기준으로 민감정보는 일반 개인정보보다 강한 처리 근거와 증빙이 필요합니다. 현재 입력으로는 추가 요건이 확인되지 않아 해당 민감정보 처리를 그대로 진행하기 어렵습니다.`;
  }

  if (
    rule.category === "cross_border_transfer"
    || rule.category === "transfer_mechanism"
  ) {
    return `${rule.article} 기준으로 국외이전은 적정성 결정, 승인된 보호조치, 또는 제한적으로 허용되는 예외 경로 중 하나가 확인되어야 합니다. 현재는 유효한 이전 경로가 부족해 해당 리전으로 보내는 경로를 사용할 수 없습니다.`;
  }

  if (rule.category === "processor_management") {
    return `${rule.article} 기준으로 외부 처리자를 쓰려면 계약 조건, 감독 책임, 재위탁 통제가 확인되어야 합니다. 이 증빙이 부족하면 벤더 경로를 운영 승인 근거로 삼기 어렵습니다.`;
  }

  if (rule.category === "security_controls") {
    return `${rule.article} 기준으로 보안 통제와 사고 대응 준비가 실제 운영 수준으로 확인되어야 합니다. 현재는 보호조치 증빙이 부족해 보완 전 진행 위험이 큽니다.`;
  }

  if (finalDecision === "manual_review") {
    return `${rule.article} 기준으로 ${categoryHint}을 사람이 확인해야 합니다. 지금 입력만으로는 자동 승인 근거로 쓰기 어렵습니다.`;
  }

  if (finalDecision === "condition_allow") {
    return `${rule.article} 기준으로 ${categoryHint}에 대한 보완이 필요합니다. 조치를 끝내고 증빙을 남긴 뒤에야 운영 반영 근거가 충분해집니다.`;
  }

  return `${rule.article} 기준으로 ${categoryHint}이 확인되어 현재 입력 범위에서는 진행 가능한 경로로 볼 수 있습니다.`;
}

function buildDecisionImpact(
  finalDecision: EvaluationResult["final_decision"],
) {
  if (finalDecision === "deny") {
    return "운영 관점에서는 배포, 데이터 복제, 벤더 전달을 잠시 멈추고 법적 근거 또는 이전 경로를 재설계해야 합니다.";
  }

  if (finalDecision === "manual_review") {
    return "운영 관점에서는 자동 승인으로 넘기지 말고, 담당자가 계약서·고지·증빙 문서를 대조한 뒤 승인 여부를 정해야 합니다.";
  }

  if (finalDecision === "condition_allow") {
    return "운영 관점에서는 진행 방향은 열려 있지만, 결과에 나온 보완 조치가 완료되어야 실제 반영할 수 있습니다.";
  }

  return "운영 관점에서는 현재 입력된 사실관계가 유지되는 한 진행 가능하지만, 범위나 대상 리전이 바뀌면 다시 검토해야 합니다.";
}

export function buildBeginnerGuidance(
  evaluationResult: EvaluationResult,
): BeginnerGuidance {
  const primaryRule = evaluationResult.triggered_rules[0];
  const finalDecision = evaluationResult.final_decision;
  const evidenceGaps = evaluationResult.qualitative_review_hints.evidence_gaps;
  const requiredActions = evaluationResult.required_actions;
  const quickChecklist = dedupe([
    ...requiredActions.slice(0, 3),
    ...evidenceGaps.slice(0, 2).map((item) => `${item} 준비 또는 확인`),
  ]).slice(0, 4);

  let businessMeaning =
    "현재 입력 기준으로는 크게 막히는 요소가 보이지 않습니다.";
  let canProceedNow = "현재 입력만 기준으로 보면 진행 가능성이 있습니다.";
  let whoShouldBeInvolved = "운영 담당자가 현재 통제 상태를 유지하면서 변경 시 재검토하면 좋습니다.";

  if (finalDecision === "deny") {
    businessMeaning =
      "지금 상태로는 이 이전 또는 처리를 진행하면 안 되는 상황에 가깝습니다.";
    canProceedNow =
      "바로 진행하지 말고, 핵심 법적 근거나 국외이전 경로를 먼저 다시 정리해야 합니다.";
    whoShouldBeInvolved =
      "법무 또는 프라이버시 담당자, 그리고 계약·보안 담당자가 함께 다시 검토하는 것이 좋습니다.";
  } else if (finalDecision === "manual_review") {
    businessMeaning =
      "시스템이 자동으로 결론을 내리기엔 정보가 부족하거나 해석이 애매한 상태입니다.";
    canProceedNow =
      "바로 진행 결정을 내리기보다, 담당자가 문서와 사실관계를 추가 확인한 뒤 판단해야 합니다.";
    whoShouldBeInvolved =
      "프라이버시 또는 법무 담당자가 우선 검토하고, 필요하면 보안·벤더 관리 담당자도 함께 보는 것이 좋습니다.";
  } else if (finalDecision === "condition_allow") {
    businessMeaning =
      "방향 자체는 가능하지만, 몇 가지 필수 보완이 끝나야 안전하게 진행할 수 있는 상태입니다.";
    canProceedNow =
      "지금 바로 운영 반영하기보다, 결과에 나온 조치를 먼저 완료한 뒤 진행하는 편이 좋습니다.";
    whoShouldBeInvolved =
      "실무 담당자가 조치를 정리하고, 프라이버시 또는 보안 담당자가 완료 여부를 확인하면 좋습니다.";
  }

  const categoryHint = primaryRule
    ? CATEGORY_EXPLAINERS[primaryRule.category] ?? "핵심 규정 요건"
    : "기본 검토 요건";
  const primaryReason = primaryRule
    ? `가장 큰 이유는 ${categoryHint}입니다. ${primaryRule.message}`
    : "현재 입력 기준으로 최종 결정을 바꿀 만큼 강하게 발동한 핵심 규칙은 많지 않습니다.";
  const legalExplanation = buildRestrictionSentence(
    primaryRule,
    finalDecision,
    categoryHint,
  );
  const supportingDetails = dedupe([
    primaryRule?.rationale && primaryRule.rationale !== primaryRule.message
      ? primaryRule.rationale
      : "",
    primaryRule?.required_evidence?.[0]
      ? `확인할 증빙: ${primaryRule.required_evidence[0]}`
      : "",
    primaryRule?.required_actions?.[0]
      ? `필요 조치: ${primaryRule.required_actions[0]}`
      : "",
  ]).slice(0, 3);

  return {
    businessMeaning,
    canProceedNow,
    primaryReason,
    legalExplanation,
    decisionImpact: buildDecisionImpact(finalDecision),
    supportingDetails,
    firstAction:
      requiredActions[0] ??
      "현재 구조와 문서 상태가 바뀌면 다시 검토를 돌려보는 것이 좋습니다.",
    whoShouldBeInvolved,
    quickChecklist:
      quickChecklist.length > 0
        ? quickChecklist
        : ["현재 결과를 저장하고, 실제 운영 변경 시 다시 검토해 보세요."],
    glossary: explainArticles(evaluationResult.legal_basis_articles),
  };
}
