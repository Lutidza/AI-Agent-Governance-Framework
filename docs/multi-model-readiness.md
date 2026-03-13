# 1. Multi-Model Readiness Architecture

## 1.1. Design goal

1.1.1. This project is designed to stay stable today and expand later without policy rewrite.

## 1.2. Principle

1.2.1. Decouple workflow from specific model names.  
1.2.2. Use stable abstractions:
1.2.2.1. Access source.  
1.2.2.2. Task class.  
1.2.2.3. Execution mode.  
1.2.2.4. Reasoning depth.  
1.2.2.5. Approval gates.  
1.2.2.6. Verification requirements.  

## 1.3. Layered architecture

### 1.3.1. Layer A: Access

1.3.1.1. Current:
1.3.1.1.1. `ChatGPT account` only.  
1.3.1.2. Future:
1.3.1.2.1. Optional OpenAI API token.  
1.3.1.2.2. Optional third-party providers.  
1.3.1.2.3. Optional local/self-hosted providers.  

### 1.3.2. Layer B: Model policy

1.3.2.1. Current:
1.3.2.1.1. Codex with `medium` default reasoning.  
1.3.2.2. Future:
1.3.2.2.1. Map task classes to model profiles (fast/default/reasoning-intensive).  
1.3.2.2.2. Keep the same task-class policy from `Policy v1`.  

### 1.3.3. Layer C: Instructions

1.3.3.1. Stable assets:
1.3.3.1.1. Project rules.  
1.3.3.1.2. Prompt templates.  
1.3.3.1.3. Review conventions.  
1.3.3.2. This layer should change rarely and survive provider switches.  

### 1.3.4. Layer D: Tooling

1.3.4.1. Current:
1.3.4.1.1. Minimal baseline, no overloaded MCP surface.  
1.3.4.2. Future:
1.3.4.2.1. Add MCP servers only with explicit value and clear ownership.  
1.3.4.2.2. Document each added tool in a short runbook.  

## 1.4. Expansion checklist

1.4.1. Keep existing policy unchanged.  
1.4.2. Add one new provider/model profile.  
1.4.3. Run same task scenarios against old and new profiles.  
1.4.4. Compare output quality, risk profile, and operational cost.  
1.4.5. Adopt only if behavior improves without reducing controllability.  

## 1.5. Anti-pattern to avoid

1.5.1. Do not bake policy rules around one model identity.  
1.5.2. If model changes require workflow rewrite, architecture is not sufficiently decoupled.  
