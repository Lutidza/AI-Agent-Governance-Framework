# workflows

Здесь находятся repeatable workflow-спецификации.

- Каждый workflow MUST иметь входы, шаги, критерии завершения и формат handoff.
- Workflow-спецификации MUST храниться модульно через `aagf/docs/spec/workflows/rules.index.yaml` + `aagf/docs/spec/workflows/rules/*.yaml`.
- Bootstrap-интеграция MUST быть формализована как отдельный workflow `AAGF-WF-BOOTSTRAP` с фазами Install -> Detect -> Confirm -> Compose -> Generate -> Sync -> Lock.
