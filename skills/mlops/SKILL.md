---
name: ml-model-operations
description: "ML/model operations umbrella: model hubs, local inference, LLM evaluation, DSPy optimization, experiment tracking, and model/media tooling."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [MLOps, LLMs, Inference, Evaluation, HuggingFace, Experiments]
---

# ML/Model Operations

## Absorbed operational workflows

- `lm-evaluation-harness` / `evaluating-llms-harness`: run reproducible LLM benchmarks such as MMLU and GSM8K, pin model/task/config versions, capture command lines and result JSON, and report benchmark caveats instead of treating scores as universal truth.
- `vllm` / `serving-llms-vllm`: serve LLMs with vLLM or an OpenAI-compatible API, covering quantization, GPU memory sizing, throughput tuning, and smoke tests before exposing the endpoint.
- `jupyter-live-kernel`: use a stateful Jupyter kernel for iterative ML/data exploration when variables and notebook state need to persist across steps; prefer one-shot execution for stateless scripts.


Use this umbrella for model tooling across discovery, inference, serving, evaluation, optimization, and experiment tracking. Pick the subsection that matches the user's workflow and preserve reproducibility: exact model ids, revisions, commands, seeds, hardware, and outputs.

## Model Discovery And Assets

Absorbs `huggingface-hub`: search, download, upload, and version models/datasets with `hf` or API clients.

## Local And Server Inference

Absorbs `llama-cpp` and `serving-llms-vllm`: use llama.cpp for GGUF/local inference and vLLM for high-throughput OpenAI-compatible serving.

## Evaluation And Optimization

Absorbs `evaluating-llms-harness` and `dspy`: benchmark LLMs with lm-eval-harness and optimize declarative LM programs with DSPy.

## Experiment Tracking

Absorbs `weights-and-biases`: log metrics/artifacts, run sweeps, manage model registry, and build dashboards.

## Model Editing And Specialized Media Models

Absorbs `obliteratus`, `segment-anything-model`, and `audiocraft-audio-generation`: handle model-editing experiments, zero-shot image segmentation, and AudioCraft generation with careful safety and dependency checks.
