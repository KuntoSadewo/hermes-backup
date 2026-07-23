# Installing External Skill Packages

## Pattern: SUPERAGENT-style zip packages

When user sends a zip containing a skill framework (like SUPERAGENT v7):

### 1. Extract & Inspect
```bash
cd /tmp && unzip -o package.zip -d package-name
cat package-name/README.md  # understand what it is
cat package-name/INDEX.md   # skill index if exists
```

### 2. Identify New vs Overlap
```bash
# List existing skills
ls ~/.hermes/skills/

# Compare with package skills
ls package-name/skills/
```

### 3. Install Skills (SKILL.md files)
```bash
for pair in "sk49.md:skill-name" "sk50.md:another-name"; do
  src="${pair%%:*}"
  dst="${pair##*:}"
  mkdir -p ~/.hermes/skills/$dst
  cp package-name/skills/$src ~/.hermes/skills/$dst/SKILL.md
done
```

### 4. Install Tools (Python scripts)
```bash
mkdir -p ~/.hermes/skills/superagent-tools
cp package-name/tools/*.py ~/.hermes/skills/superagent-tools/
```

### 5. Verify
```bash
ls ~/.hermes/skills/ | wc -l  # total count
ls ~/.hermes/skills/new-skill/SKILL.md  # verify files
```

## Pitfalls
- **Don't overwrite existing skills** — check for conflicts first
- **Commercial licenses** — respect single-buyer/no-resale terms
- **Protected skills** — never modify bundled/hermes-agent skills
- **Tool dependencies** — some tools need extra pip packages, check imports
