export type Difficulty = "easy" | "medium" | "hard" | "viral";

export interface Song {
  id: string;
  title: string;         // real title e.g. "Shape of You"
  artist: string;
  releaseYear: string;   // e.g. "2017"
  synonymTitle: string;  // e.g. "Form of You"
  difficulty: Difficulty;
  genre?: string;        // e.g. "Pop/R&B"
  hints: [string, string, string]; // [alt_synonym, release_year, artist]
}

export const songs: Song[] = [
  // EASY
  {
    id: "shape-of-you",
    title: "Shape of You",
    artist: "Ed Sheeran",
    releaseYear: "2017",
    synonymTitle: "Form of You",
    difficulty: "easy",
    hints: ["Contour of Yourself", "Pop", "Artist: Ed Sheeran"],
  },
  {
    id: "blinding-lights",
    title: "Blinding Lights",
    artist: "The Weeknd",
    releaseYear: "2019",
    synonymTitle: "Dazzling Illumination",
    difficulty: "easy",
    hints: ["Glaring Beams", "Pop/R&B", "Artist: The Weeknd"],
  },
  {
    id: "rolling-in-the-deep",
    title: "Rolling in the Deep",
    artist: "Adele",
    releaseYear: "2010",
    synonymTitle: "Moving Within the Depths",
    difficulty: "easy",
    hints: ["Tumbling Through the Abyss", "Soul/pop", "Artist: Adele"],
  },

  // MEDIUM
  {
    id: "smells-like-teen-spirit",
    title: "Smells Like Teen Spirit",
    artist: "Nirvana",
    releaseYear: "1991",
    synonymTitle: "Adolescent Essence Aroma",
    difficulty: "medium",
    hints: ["Reeks of Youthful Energy", "Rock", "Artist: Nirvana"],
  },
  {
    id: "counting-stars",
    title: "Counting Stars",
    artist: "OneRepublic",
    releaseYear: "2013",
    synonymTitle: "Tallying Celestial Bodies",
    difficulty: "medium",
    hints: ["Tallying Galaxies", "Pop rock", "Artist: OneRepublic"],
  },
  {
    id: "firework",
    title: "Firework",
    artist: "Katy Perry",
    releaseYear: "2010",
    synonymTitle: "Pyrotechnic Burst",
    difficulty: "medium",
    hints: ["Explosive Spark", "Pop", "Artist: Katy Perry"],
  },

  // HARD
  {
    id: "electric-feel",
    title: "Electric Feel",
    artist: "MGMT",
    releaseYear: "2008",
    synonymTitle: "Charged Sensation",
    difficulty: "hard",
    hints: ["Voltage Perception", "Indie/psych", "Artist: MGMT"],
  },
  {
    id: "take-me-to-church",
    title: "Take Me to Church",
    artist: "Hozier",
    releaseYear: "2013",
    synonymTitle: "Escort Me to the Sanctuary",
    difficulty: "hard",
    hints: ["Bring Me to the Temple", "Indie/soul", "Artist: Hozier"],
  },
  {
    id: "midnight-city",
    title: "Midnight City",
    artist: "M83",
    releaseYear: "2011",
    synonymTitle: "Witching Hour Metropolis",
    difficulty: "hard",
    hints: ["Witching Hour Settlement", "Synth/electronic", "Artist: M83"],
  },

  // EASY
  {
    id: "levitating",
    title: "Levitating",
    artist: "Dua Lipa",
    releaseYear: "2020",
    synonymTitle: "Floating Skyward",
    difficulty: "easy",
    hints: ["Hovering Weightlessly", "Pop", "Artist: Dua Lipa"],
  },

  // MEDIUM
  {
    id: "uptown-funk",
    title: "Uptown Funk",
    artist: "Mark Ronson ft. Bruno Mars",
    releaseYear: "2014",
    synonymTitle: "Elevated District Groove",
    difficulty: "medium",
    hints: ["Highbrow District Groove", "Funk/pop", "Artist: Bruno Mars"],
  },
  {
    id: "somebody-that-i-used-to-know",
    title: "Somebody That I Used to Know",
    artist: "Gotye",
    releaseYear: "2011",
    synonymTitle: "An Individual I Once Recognized",
    difficulty: "medium",
    hints: ["A Figure I Once Recalled", "Indie pop", "Artist: Gotye"],
  },

  // HARD
  {
    id: "pumped-up-kicks",
    title: "Pumped Up Kicks",
    artist: "Foster the People",
    releaseYear: "2010",
    synonymTitle: "Inflated Footwear",
    difficulty: "hard",
    hints: ["Inflated Sneakers", "Indie pop", "Artist: Foster the People"],
  },

  // VIRAL / THROWBACK
  {
    id: "all-star",
    title: "All Star",
    artist: "Smash Mouth",
    releaseYear: "1999",
    synonymTitle: "Every Celestial Body",
    difficulty: "viral",
    hints: ["Total Celestial Body", "Alt rock", "Artist: Smash Mouth"],
  },

  // VIRAL / THROWBACK
  {
    id: "mr-brightside",
    title: "Mr. Brightside",
    artist: "The Killers",
    releaseYear: "2003",
    synonymTitle: "Mr. Optimistic",
    difficulty: "viral",
    hints: ["Mr. Sunny Disposition", "Indie rock", "Artist: The Killers"],
  },
  {
    id: "hey-ya",
    title: "Hey Ya!",
    artist: "Outkast",
    releaseYear: "2003",
    synonymTitle: "Greetings, You!",
    difficulty: "viral",
    hints: ["Salutations, You!", "Hip hop/funk", "Artist: Outkast"],
  },
  {
    id: "party-in-the-usa",
    title: "Party in the USA",
    artist: "Miley Cyrus",
    releaseYear: "2009",
    synonymTitle: "Celebration in the United States",
    difficulty: "viral",
    hints: ["Gathering in the Nation", "Pop", "Artist: Miley Cyrus"],
  },
];
