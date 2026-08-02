/** Curated math & physics theorems for quick reference in the analyst workspace */

export type TheoremEntry = {
  id: string;
  domain: "math" | "physics";
  name: string;
  statement: string;
};

export const WORKSPACE_THEOREMS: TheoremEntry[] = [
  {
    id: "pythagorean",
    domain: "math",
    name: "Pythagorean theorem",
    statement: "In a right triangle, a² + b² = c² where c is the hypotenuse.",
  },
  {
    id: "bayes",
    domain: "math",
    name: "Bayes' theorem",
    statement: "P(A|B) = P(B|A)·P(A) / P(B) — posterior from likelihood, prior, and evidence.",
  },
  {
    id: "fourier",
    domain: "math",
    name: "Fourier theorem (periodic functions)",
    statement: "Well-behaved periodic functions can be expressed as sums of sines and cosines (Fourier series).",
  },
  {
    id: "central-limit",
    domain: "math",
    name: "Central limit theorem",
    statement: "The sum (or mean) of many independent random variables tends toward a normal distribution under mild conditions.",
  },
  {
    id: "greens",
    domain: "math",
    name: "Green's theorem",
    statement: "Relates a line integral around a simple closed curve C to a double integral over the plane region D bounded by C.",
  },
  {
    id: "stokes",
    domain: "math",
    name: "Stokes' theorem",
    statement: "The surface integral of the curl of a vector field over a surface Σ equals the line integral of the field around ∂Σ.",
  },
  {
    id: "euler-polyhedron",
    domain: "math",
    name: "Euler's polyhedron formula",
    statement: "For convex polyhedra, V − E + F = 2 (vertices, edges, faces).",
  },
  {
    id: "noether",
    domain: "physics",
    name: "Noether's theorem",
    statement: "Every differentiable symmetry of the action corresponds to a conserved quantity.",
  },
  {
    id: "heisenberg",
    domain: "physics",
    name: "Heisenberg uncertainty",
    statement: "Δx·Δp ≥ ℏ/2 — complementary observables cannot be simultaneously known to arbitrary precision.",
  },
  {
    id: "einstein-mass-energy",
    domain: "physics",
    name: "Mass–energy equivalence",
    statement: "E = mc² — rest energy and mass are equivalent up to the speed of light squared.",
  },
  {
    id: "maxwell-faraday",
    domain: "physics",
    name: "Faraday's law (Maxwell)",
    statement: "A changing magnetic flux induces a circulating electric field; one of Maxwell's equations.",
  },
  {
    id: "second-law",
    domain: "physics",
    name: "Second law of thermodynamics",
    statement: "Entropy of an isolated system never decreases; defines arrow of time for macroscopic processes.",
  },
  {
    id: "schrodinger",
    domain: "physics",
    name: "Schrödinger equation (time-dependent)",
    statement: "iℏ ∂ψ/∂t = Ĥψ governs quantum state evolution under Hamiltonian Ĥ.",
  },
  {
    id: "gauss-flux",
    domain: "physics",
    name: "Gauss's law",
    statement: "Electric flux through a closed surface is proportional to enclosed charge (Maxwell, electrostatics).",
  },
  {
    id: "newton-gravity",
    domain: "physics",
    name: "Newton's law of gravitation",
    statement: "F = G m₁ m₂ / r² — attractive force between point masses.",
  },
];

export function randomTheorem(): TheoremEntry {
  return WORKSPACE_THEOREMS[Math.floor(Math.random() * WORKSPACE_THEOREMS.length)]!;
}
