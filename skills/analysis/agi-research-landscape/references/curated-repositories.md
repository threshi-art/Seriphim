# Curated Starting Set

Refresh all facts before reuse. The notes below were reviewed on 15 August 2026.

| Repository | Role | Why it is useful | Caveat |
|---|---|---|---|
| [opencog/atomspace](https://github.com/opencog/atomspace) | Symbolic representation | In-memory metagraph store, typed expressions, querying, graph rewriting, and executable graphs. | High integration complexity; not a full cognitive system. |
| [soartech/jsoar](https://github.com/soartech/jsoar) | Cognitive architecture | Pure Java Soar implementation with documentation and releases. | Best studied as a symbolic control-loop reference, not an AGI product. |
| [infer-actively/pymdp](https://github.com/infer-actively/pymdp) | Active inference | Documented Python package for discrete-state MDP active inference; companion JOSS paper. | Research library, not a full autonomous system. |
| [danijar/dreamerv3](https://github.com/danijar/dreamerv3) | World-model RL | Predictive world model and imagined-trajectory policy learning across diverse simulated domains. | Requires simulation and compute; no language or broad social reasoning. |
| [arcprize/ARC-AGI](https://github.com/arcprize/ARC-AGI) | Evaluation | Open Python toolkit for ARC-AGI-3 interactive environments. | Benchmark tooling only; avoid overfitting a system to one benchmark. |
| [microsoft/agent-framework](https://github.com/microsoft/agent-framework) | Agent infrastructure | Current multi-language framework for production AI-agent workflows. | Orchestration and operations, not a cognitive theory. |
| [SHI-Yu-Zhe/awesome-agi-cocosci](https://github.com/SHI-Yu-Zhe/awesome-agi-cocosci) | Discovery index | Curated AGI and computational-cognitive-science references. | Reading map, not implementation code. |

## Status notes

- The historic [`opencog/opencog`](https://github.com/opencog/opencog) framework repository declares itself unmaintained and points to component repositories. Prefer the maintained components for new source review.
- [`microsoft/autogen`](https://github.com/microsoft/autogen) declares maintenance mode and directs new work to Microsoft Agent Framework.
- NARS and broad neurosymbolic searches produce many small or lightly validated projects. Use those only as secondary, sandboxed research leads after reviewing a paper or an established benchmark.

## Suggested modular research order

1. Prototype inspectable representation and provenance.
2. Add a traceable deliberation loop.
3. Compare learning approaches only in a controlled simulation.
4. Evaluate with held-out tasks and a benchmark harness.
5. Integrate approved modules behind explicit permissions, human approval, and rollback boundaries.

