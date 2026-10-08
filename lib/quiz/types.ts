export interface QuizSong {
  id: string;
  title: string;
  artist: string;
  releaseYear: string;
  synonymTitle: string;
  genre?: string;
  hints: [string, string];
  altTitles?: string[];
  /** Pack slugs this song is assigned to. A song can belong to more than one. */
  quizzes: string[];
  reviewStatus: "draft" | "published";
}

export type QuizKind = "artist" | "decade" | "seasonal";

export interface QuizPackConfig {
  slug: string;
  kind: QuizKind;
  heading: string;
  title: string;
  description: string;
  intro: string;
  /** Populated from the catalog at read time, not stored here. */
}
