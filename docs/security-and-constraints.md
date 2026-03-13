# 1. Security and Constraints

## 1.1. Document scope

1.1.1. This document defines practical boundaries for Codex usage in WebStorm AI Assistant.

## 1.2. Core boundaries

1.2.1. Default to least privilege (`Read-only` first).  
1.2.2. Grant edit autonomy only for explicit, bounded tasks.  
1.2.3. Keep system-level and out-of-workspace actions blocked by default.  

## 1.3. Sensitive actions requiring explicit approval

1.3.1. Dependency installation or upgrades.  
1.3.2. Edits to CI/CD or infrastructure files.  
1.3.3. Environment/security config changes.  
1.3.4. Broad refactors with unclear blast radius.  
1.3.5. Any operation outside repository workspace.  

## 1.4. Important limitation

1.4.1. Do not treat `.aiignore` as a hard protection boundary for Codex workflows in WebStorm.  
1.4.2. Practical implications:
1.4.2.1. Keep sensitive material out of normal AI-processing scopes.  
1.4.2.2. Rely on stronger repo/process controls for sensitive assets.  

## 1.5. Context and quality controls

1.5.1. Keep prompts scoped and explicit.  
1.5.2. Avoid "do everything" requests for complex tasks.  
1.5.3. Require short plan and risk list before edits on risky tasks.  
1.5.4. Always review diff and run appropriate validation after edits.  

## 1.6. Rollback readiness

1.6.1. Keep change scopes small to simplify rollback.  
1.6.2. Prefer incremental edits over large one-shot rewrites.  
1.6.3. Verify each step before moving to next risky operation.  
