# 1. WebStorm Baseline Setup (Current Phase)

## 1.1. Setup intent

1.1.1. This setup is intentionally minimal and stable.

## 1.2. Current phase assumptions

1.2.1. WebStorm + JetBrains AI Assistant is already installed.  
1.2.2. Current access source is `ChatGPT account`.  
1.2.3. Current active coding agent is `Codex`.  
1.2.4. No additional providers/models are enabled yet.  

## 1.3. Step-by-step baseline

1.3.1. Open `Settings -> Tools -> AI Assistant`.  
1.3.2. Confirm only `ChatGPT account` is used for this phase.  
1.3.3. In AI Chat, keep Codex as active agent.  
1.3.4. Set reasoning default practice to `medium`.  
1.3.5. Apply `.aiassistant/rules/master-rule.md` as `Always` project rule.  
1.3.6. Add selected templates from `.aiassistant/prompts/` into Prompt Library.  
1.3.7. Keep execution default as `Read-only`; switch to `Agent` only per policy.  

## 1.4. Daily usage discipline

1.4.1. Start non-trivial tasks in `Read-only`.  
1.4.2. Request analysis + plan before editing.  
1.4.3. Use `Agent` only for bounded in-repo edits.  
1.4.4. Reserve higher reasoning for genuinely complex tasks.  

## 1.5. What not to do in this phase

1.5.1. Do not add OpenAI API token in parallel yet.  
1.5.2. Do not enable third-party or local model providers yet.  
1.5.3. Do not enable broad MCP toolsets before baseline behavior is stable.  

## 1.6. Ready for next phase when

1.6.1. Policy v1 is consistently followed.  
1.6.2. Rule and prompt templates produce predictable output.  
1.6.3. Team/user confirms that current baseline is stable for daily work.  
