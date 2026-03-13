# 1. Codex Operating Policy v1

## 1.1. Policy intent

1.1.1. The goal is controlled, predictable AI-assisted development where access, reasoning depth, and execution autonomy are selected by task risk, not by convenience.

## 1.2. Defaults

1.2.1. Default mode: `Read-only`.  
1.2.2. Default reasoning: `medium`.  
1.2.3. Default flow: `analyze -> plan -> execute -> verify`.  

## 1.3. Execution modes

### 1.3.1. Read-only (default)

1.3.1.1. Use for architecture analysis.  
1.3.1.2. Use for bug investigation.  
1.3.1.3. Use for code explanation.  
1.3.1.4. Use for review preparation.  
1.3.1.5. Use for change planning.  

### 1.3.2. Agent (controlled edits)

1.3.2.1. Use only for bounded edits inside workspace:
1.3.2.1.1. Small refactors.  
1.3.2.1.2. Focused bug fixes.  
1.3.2.1.3. Tests and typings updates.  
1.3.2.1.4. Local config adjustments in repository.  
1.3.2.2. Precondition: short analysis and plan are provided first.  

### 1.3.3. Agent (full access)

1.3.3.1. Policy: disallowed for daily engineering work.  
1.3.3.2. Policy: allowed only as explicit exceptional scenario.  

## 1.4. Reasoning policy

### 1.4.1. low

1.4.1.1. Use for trivial transformations.  
1.4.1.2. Use for cosmetic edits.  
1.4.1.3. Use for short utility responses.  

### 1.4.2. medium (default)

1.4.2.1. Use for normal daily development.  
1.4.2.2. Use for typical refactoring.  
1.4.2.3. Use for routine debugging.  
1.4.2.4. Use for test maintenance.  

### 1.4.3. high

1.4.3.1. Use for complex multi-step debugging.  
1.4.3.2. Use for architectural tradeoff analysis.  
1.4.3.3. Use for high-risk refactoring across boundaries.  

## 1.5. Task classes and required mode

### 1.5.1. Class A: Analysis tasks

1.5.1.1. Examples:
1.5.1.1.1. "Explain architecture".  
1.5.1.1.2. "Find probable bug root cause".  
1.5.1.1.3. "Propose implementation options".  
1.5.1.2. Policy:
1.5.1.2.1. Mode: `Read-only`.  
1.5.1.2.2. Reasoning: `medium` or `high` if uncertainty is high.  

### 1.5.2. Class B: Safe local edits

1.5.2.1. Examples:
1.5.2.1.1. "Refactor one module".  
1.5.2.1.2. "Add tests for existing behavior".  
1.5.2.1.3. "Rename symbols in one bounded area".  
1.5.2.2. Policy:
1.5.2.2.1. Mode: `Agent`.  
1.5.2.2.2. Reasoning: `medium`.  
1.5.2.2.3. Scope must remain bounded.  

### 1.5.3. Class C: Risky changes

1.5.3.1. Examples:
1.5.3.1.1. Schema changes.  
1.5.3.1.2. Dependency updates.  
1.5.3.1.3. Broad refactors across subsystems.  
1.5.3.1.4. Build/release pipeline edits.  
1.5.3.2. Policy:
1.5.3.2.1. Start in `Read-only`.  
1.5.3.2.2. Require explicit plan and approval before edits.  
1.5.3.2.3. `full access` remains off unless explicitly approved.  

### 1.5.4. Class D: External/system actions

1.5.4.1. Examples:
1.5.4.1.1. Edits outside workspace.  
1.5.4.1.2. System-level installs/config changes.  
1.5.4.1.3. Broad environment reconfiguration.  
1.5.4.2. Policy:
1.5.4.2.1. Blocked by default.  
1.5.4.2.2. Requires explicit, separate approval scenario.  

## 1.6. Forbidden without explicit user request

1.6.1. Public API breaking changes.  
1.6.2. Dependency installation or upgrades.  
1.6.3. CI/CD and infrastructure edits.  
1.6.4. External path edits outside workspace.  
1.6.5. Large-scale automated multi-subsystem rewrites.  
1.6.6. Changes in security-sensitive environment/config files.  

## 1.7. Mandatory post-edit report

1.7.1. After any edit session, assistant must provide:
1.7.1.1. Touched files.  
1.7.1.2. What changed and why.  
1.7.1.3. Potential risks.  
1.7.1.4. What to verify manually (tests/lint/runtime checks).  

## 1.8. Model-agnostic rule

1.8.1. All policy references must be role-based and risk-based (`mode`, `reasoning`, `task class`, `approval`) and must not hardcode one model identity.
