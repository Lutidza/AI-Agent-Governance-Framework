# Dialogue Analysis

Source dialogue was focused on fine-tuning Codex in WebStorm (JetBrains AI Assistant), with explicit emphasis on operational control over UI toggles.

## Confirmed baseline

- Auth currently used: `ChatGPT account`
- Active agent currently used: `Codex`
- Other models/providers must not be configured yet
- Architecture must remain ready for future provider/model expansion

## Key design principles extracted

- Configuration must be separated into independent layers:
  - Access layer
  - Model/Reasoning policy layer
  - Instruction layer (Rules + Prompt Library)
  - Tooling layer (MCP and execution mode)
- Behavior must be defined by task class and risk level, not by model name.
- Defaults must stay strict; permissions are elevated only for concrete need.
- Policy is treated as an operational contract, not optional guidance.

## Most important implementation targets

- Create a clear Policy v1 document for daily usage.
- Set default execution mode to `Read-only`.
- Use `Agent` only for controlled in-repo edits.
- Keep `Agent (full access)` as exceptional mode only.
- Use `medium` reasoning as default and `high` only for complex tasks.
- Require analyze -> plan -> execute flow for risky tasks.
- Explicitly list actions forbidden without direct approval.

## Security caveat to preserve

- Do not rely on `.aiignore` as a hard boundary for Codex in WebStorm.
- Keep sensitive-data strategy independent from `.aiignore`.

## Outcome for this repository phase

- Document-first baseline
- Policy-first usage model
- Prompt/rule templates for immediate use
- Expansion-ready architecture without enabling extra providers yet
