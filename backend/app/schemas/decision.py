from typing import Literal, TypeAlias


DecisionGrade: TypeAlias = Literal[
    "deny",
    "manual_review",
    "condition_allow",
    "allow",
]
