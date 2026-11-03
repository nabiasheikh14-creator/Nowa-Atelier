import type { Book } from "./types";
import { OWNER_ID } from "./owner";

const owner = OWNER_ID;

function cover(isbn: string): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

type Seed = Omit<Book, "owner_id" | "cover_url"> & { isbn: string };

const rows: Seed[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    synopsis:
      "A comfort-loving hobbit is talked into a journey and comes home with a better story than he left with. I keep it for the firelight chapters.",
    genre: "Fantasy",
    format: "physical",
    rating: 5,
    review:
      "The book I lend first. It still feels like being walked to the door of a larger world and told I may come along.",
    isbn: "9780547928227",
    status: "available",
    created_at: "2024-01-08T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    title: "The Name of the Wind",
    author: "Patrick Rothfuss",
    synopsis:
      "A magician tells his own legend over a single night in an inn, and the telling is more careful than the myth.",
    genre: "Fantasy",
    format: "physical",
    rating: 5,
    review:
      "I reread the frame story more than the fireworks. The silence in the inn is what I came for.",
    isbn: "9780756404741",
    status: "available",
    created_at: "2024-01-20T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    title: "A Wizard of Earthsea",
    author: "Ursula K. Le Guin",
    synopsis:
      "A proud student of magic releases his own shadow and has to cross the sea to meet it.",
    genre: "Fantasy",
    format: "physical",
    rating: 5,
    review:
      "Short, severe, and kind. This copy is out at the moment. I miss it on the shelf.",
    isbn: "9780547773742",
    status: "lent",
    created_at: "2024-02-02T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    title: "Piranesi",
    author: "Susanna Clarke",
    synopsis:
      "A man catalogs an endless house of statues and tides, until the house turns out to have a door he did not build.",
    genre: "Fantasy",
    format: "epub",
    rating: 5,
    review:
      "I read this on a train and kept looking up as if the carriage had grown additional halls. The digital copy is the one I return to.",
    isbn: "9781635575637",
    status: "available",
    created_at: "2024-02-18T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    title: "The Night Circus",
    author: "Erin Morgenstern",
    synopsis:
      "Two illusionists are bound into a contest staged inside a circus that opens only after dark.",
    genre: "Fantasy",
    format: "physical",
    rating: 4,
    review:
      "More atmosphere than plot, which is why it lives in this room. I open it when I want the lamps lower.",
    isbn: "9780307744432",
    status: "available",
    created_at: "2024-03-01T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    title: "The Lies of Locke Lamora",
    author: "Scott Lynch",
    synopsis:
      "A crew of confidence artists in a canal city attempts one elegant theft and finds the city less forgiving than the plan.",
    genre: "Fantasy",
    format: "epub",
    rating: 4.5,
    review:
      "The dialogue is the plot. I keep the file for journeys and still wish the binding were cloth.",
    isbn: "9780553588941",
    status: "available",
    created_at: "2024-03-14T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000007",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    synopsis:
      "Elizabeth Bennet and Mr. Darcy misread each other in a drawing room until the misreading becomes the romance.",
    genre: "Classics",
    format: "physical",
    rating: 5,
    review:
      "The sentences are so exact that I read some of them aloud to an empty chair. It never feels like a duty.",
    isbn: "9780141439518",
    status: "available",
    created_at: "2024-03-28T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000008",
    title: "Jane Eyre",
    author: "Charlotte Bronte",
    synopsis:
      "A governess with a strict sense of herself takes a post in a house that is keeping a secret on the third floor.",
    genre: "Classics",
    format: "physical",
    rating: 5,
    review:
      "I loved her stubbornness before I trusted the plot. The red room chapter still changes the temperature of the library.",
    isbn: "9780141441146",
    status: "available",
    created_at: "2024-04-09T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000009",
    title: "Frankenstein",
    author: "Mary Shelley",
    synopsis:
      "A student builds a person and then refuses the responsibility that creation asked of him.",
    genre: "Classics",
    format: "physical",
    rating: 4.5,
    review:
      "Slim enough to finish in an evening and large enough to ruin the evening in a useful way.",
    isbn: "9780141439471",
    status: "available",
    created_at: "2024-04-22T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000010",
    title: "Crime and Punishment",
    author: "Fyodor Dostoevsky",
    synopsis:
      "A student tests a theory about extraordinary men, commits a murder, and spends the rest of the book unable to live inside the theory.",
    genre: "Classics",
    format: "physical",
    rating: 5,
    review:
      "I read it too young and then again when I could hear the fever in the prose. The second time is the one I trust.",
    isbn: "9780143058144",
    status: "available",
    created_at: "2024-05-06T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000011",
    title: "Great Expectations",
    author: "Charles Dickens",
    synopsis:
      "Pip is given money and a story about where it came from, and both turn out to be a kind of haunting.",
    genre: "Classics",
    format: "epub",
    rating: 4,
    review:
      "I keep the file because the paperback fell apart. The marshes at the beginning are still the best weather in fiction.",
    isbn: "9780141439563",
    status: "available",
    created_at: "2024-05-19T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000012",
    title: "The Odyssey",
    author: "Homer",
    synopsis:
      "After the war, a man tries to get home while his house tries not to forget him. The sea is the long way around.",
    genre: "Classics",
    format: "physical",
    rating: 4.5,
    review:
      "I use the Fagles when I want the voice in the room. Some nights I only read the return.",
    isbn: "9780140268867",
    status: "available",
    created_at: "2024-06-02T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000013",
    title: "The Design of Everyday Things",
    author: "Don Norman",
    synopsis:
      "A patient argument that confusion is usually a property of the object, not a failing of the person holding it.",
    genre: "Design",
    format: "physical",
    rating: 5,
    review:
      "I leave this where I can reach it when a project starts blaming the user. The door chapter has saved me more than once.",
    isbn: "9780465050659",
    status: "available",
    created_at: "2024-06-16T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000014",
    title: "Grid Systems in Graphic Design",
    author: "Josef Muller-Brockmann",
    synopsis:
      "A Swiss manual for organizing a page so that type, image, and silence share one structure.",
    genre: "Design",
    format: "physical",
    rating: 5,
    review:
      "I do not follow it strictly. I like having it open nearby when a layout is getting loud.",
    isbn: "9783721201451",
    status: "available",
    created_at: "2024-07-01T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000015",
    title: "Thinking with Type",
    author: "Ellen Lupton",
    synopsis:
      "A field guide to letters, spacing, and the small decisions that make a page feel considered.",
    genre: "Design",
    format: "physical",
    rating: 4.5,
    review:
      "The one I actually hand to people. Clear without being cold, which is rare for a book about rules.",
    isbn: "9781568989693",
    status: "available",
    created_at: "2024-07-18T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000016",
    title: "Interaction of Color",
    author: "Josef Albers",
    synopsis:
      "Color is not a chip you pick. It changes according to whatever you set beside it.",
    genre: "Design",
    format: "epub",
    rating: 4.5,
    review:
      "The plates want paper, and I know that. I still reread the exercises when a palette starts to lie to me.",
    isbn: "9780300179354",
    status: "available",
    created_at: "2024-08-02T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000017",
    title: "The Elements of Typographic Style",
    author: "Robert Bringhurst",
    synopsis:
      "A craftsman's book on rhythm, proportion, and the manners of type on a page.",
    genre: "Design",
    format: "physical",
    rating: 5,
    review:
      "I read a few pages at a time, the way it seems to expect. It made me slower in a way I wanted.",
    isbn: "9780881792126",
    status: "available",
    created_at: "2024-08-20T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000018",
    title: "Design as Art",
    author: "Bruno Munari",
    synopsis:
      "Short essays on orange peel, lamps, and the idea that design is a form of courtesy.",
    genre: "Design",
    format: "physical",
    rating: 4,
    review:
      "Light in the hand and serious underneath. Good company on the side table.",
    isbn: "9780141035819",
    status: "available",
    created_at: "2024-09-04T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000019",
    title: "Meditations",
    author: "Marcus Aurelius",
    synopsis:
      "Private notes from a Roman emperor to himself about how to meet the day without making it worse.",
    genre: "Self-Help",
    format: "physical",
    rating: 5,
    review:
      "Not a system. A voice I trust when the week has been noisy. I keep the bookmark near the morning pages.",
    isbn: "9780140449334",
    status: "available",
    created_at: "2024-09-18T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000020",
    title: "Man's Search for Meaning",
    author: "Viktor Frankl",
    synopsis:
      "A psychiatrist writes about the camps and the idea that a person can choose the stance they take toward suffering.",
    genre: "Self-Help",
    format: "physical",
    rating: 5,
    review:
      "I don't lend this lightly. When I do, I want it back with the pencil marks still in it.",
    isbn: "9780807014295",
    status: "available",
    created_at: "2024-10-02T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000021",
    title: "Atomic Habits",
    author: "James Clear",
    synopsis:
      "A practical book about making small changes easier to repeat than to negotiate with.",
    genre: "Self-Help",
    format: "physical",
    rating: 4,
    review:
      "Less literature than the rest of this shelf, and useful on purpose. I stole the habit-stacking page for my own notebook.",
    isbn: "9780735211292",
    status: "available",
    created_at: "2024-10-16T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000022",
    title: "Deep Work",
    author: "Cal Newport",
    synopsis:
      "An argument for protecting long, undistracted stretches of attention, and a set of ways to defend them.",
    genre: "Self-Help",
    format: "epub",
    rating: 4,
    review:
      "I argue with the austerity and still close the laptop when it tells me to. The file lives on the reading tablet.",
    isbn: "9781455586691",
    status: "available",
    created_at: "2024-11-01T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000023",
    title: "The War of Art",
    author: "Steven Pressfield",
    synopsis:
      "A blunt little book about the resistance that shows up the moment a person tries to do the work they mean to do.",
    genre: "Self-Help",
    format: "physical",
    rating: 4.5,
    review:
      "I reread it in an afternoon when I am stalling. It does not comfort me. That is the point.",
    isbn: "9781936891023",
    status: "available",
    created_at: "2024-11-15T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000024",
    title: "Four Thousand Weeks",
    author: "Oliver Burkeman",
    synopsis:
      "A refusal of the fantasy that a well-run life will eventually contain everything. Time is short, so choose.",
    genre: "Self-Help",
    format: "epub",
    rating: 5,
    review:
      "The self-help book I trust because it declines to optimize me. I underlined half of it and felt lighter.",
    isbn: "9780374159122",
    status: "available",
    created_at: "2024-12-02T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000025",
    title: "SPQR",
    author: "Mary Beard",
    synopsis:
      "A history of Rome that prefers citizens, rumors, and evidence over the marble version of the empire.",
    genre: "History",
    format: "physical",
    rating: 5,
    review:
      "Beard is good company for a long evening. I come away less impressed by emperors and more interested in the crowd.",
    isbn: "9781631492228",
    status: "available",
    created_at: "2025-01-10T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000026",
    title: "The Silk Roads",
    author: "Peter Frankopan",
    synopsis:
      "A retelling of world history that starts from the routes between Asia and the Mediterranean instead of from the north Atlantic.",
    genre: "History",
    format: "physical",
    rating: 4.5,
    review:
      "Out with a friend who is traveling. I want the maps back as much as the prose.",
    isbn: "9781101912379",
    status: "lent",
    created_at: "2025-01-24T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000027",
    title: "The Guns of August",
    author: "Barbara Tuchman",
    synopsis:
      "The first month of the First World War, told so that the catastrophe feels like a sequence of choices.",
    genre: "History",
    format: "physical",
    rating: 5,
    review:
      "The narrative pull is almost unfair. I sat down to sample a chapter and left the lamp on until the end.",
    isbn: "9780345476098",
    status: "available",
    created_at: "2025-02-08T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000028",
    title: "A Distant Mirror",
    author: "Barbara Tuchman",
    synopsis:
      "The fourteenth century, seen through one noble house, as plague, war, and spectacle rearrange Europe.",
    genre: "History",
    format: "physical",
    rating: 4.5,
    review:
      "Heavier than Guns of August and just as alive. I read it in winter and the room felt correctly old.",
    isbn: "9780345349576",
    status: "available",
    created_at: "2025-02-22T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000029",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    synopsis:
      "A brisk history of our species that trades caution for a very wide lens.",
    genre: "History",
    format: "epub",
    rating: 3.5,
    review:
      "I enjoyed the sweep and distrusted the certainty. Worth the argument it started with a friend. Not a book I treat as settled.",
    isbn: "9780062316097",
    status: "available",
    created_at: "2025-03-09T15:00:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000030",
    title: "The Warmth of Other Suns",
    author: "Isabel Wilkerson",
    synopsis:
      "The Great Migration told through three lives, with the scale of an epic and the patience of a reported portrait.",
    genre: "History",
    format: "physical",
    rating: 5,
    review:
      "The book on this wall I most want someone to sit down with. I still remember where I was when I finished it.",
    isbn: "9780679763888",
    status: "available",
    created_at: "2025-03-28T15:00:00.000Z",
  },
];

export const SEED_BOOKS: Book[] = rows.map((row) => ({
  ...row,
  owner_id: owner,
  cover_url: cover(row.isbn),
}));
