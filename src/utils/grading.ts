export interface GradeBand {
  min: number;
  letter: string;
  points: number;
}

export interface GradingScheme {
  caWeight: number;
  examWeight: number;
  projectWeight: number;
  assignmentWeight: number;
  bands: GradeBand[];
}

export const defaultGradingScheme: GradingScheme = {
  caWeight: 0.2,
  examWeight: 0.8,
  projectWeight: 0,
  assignmentWeight: 0,
  bands: [
    { min: 85, letter: "A", points: 4 }, { min: 75, letter: "B+", points: 3.5 },
    { min: 70, letter: "B", points: 3 }, { min: 65, letter: "B-", points: 2.5 },
    { min: 60, letter: "C", points: 2 }, { min: 55, letter: "C-", points: 1.5 },
    { min: 50, letter: "D", points: 1 }, { min: 0, letter: "F", points: 0 }
  ]
};

export function calculateGrade(scores: { ca?: number; exam?: number; project?: number; assignment?: number }, scheme: GradingScheme) {
  const weights = [scheme.caWeight, scheme.examWeight, scheme.projectWeight, scheme.assignmentWeight];
  if (weights.some((weight) => weight < 0) || Math.abs(weights.reduce((sum, weight) => sum + weight, 0) - 1) > 0.0001) {
    throw new Error("Grading scheme weights must be non-negative and total 100%");
  }
  const totalScore = (scores.ca || 0) * scheme.caWeight + (scores.exam || 0) * scheme.examWeight + (scores.project || 0) * scheme.projectWeight + (scores.assignment || 0) * scheme.assignmentWeight;
  const band = [...scheme.bands].sort((a, b) => b.min - a.min).find((item) => totalScore >= item.min);
  if (!band) throw new Error("Grading scheme must contain a band starting at 0");
  return { totalScore: Math.round(totalScore * 100) / 100, letterGrade: band.letter, gpaPoints: band.points };
}
