import type { Book } from "./types";
import { OWNER_ID } from "./owner";

const owner = OWNER_ID;

function cover(isbn: string): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

type Draft = {
  title: string;
  author: string;
  genre: string;
  synopsis: string;
  isbn?: string;
};


const books: Draft[] = [
  { title: "Steve Jobs", author: "Walter Isaacson", genre: "Memoir", synopsis: "A business biography written with the cooperation of its subject, and the arguments that came with that access.", isbn: "9781451648539" },
  { title: "The Diary of a Young Girl", author: "Anne Frank", genre: "Memoir", synopsis: "A Holocaust diary. The annex, the handwriting, and the ordinary days inside an extraordinary hiding.", isbn: "9780553296983" },
  { title: "The Rugmaker of Mazar-e-Sharif", author: "Najaf Mazari", genre: "Memoir", synopsis: "A refugee memoir. A rugmaker's account of Afghanistan and the long way to another country." },
  { title: "In My Mother's Footsteps", author: "Mona Hajjar Halaby", genre: "Memoir", synopsis: "A memoir of family history and the Palestinian diaspora. A daughter walking a city her mother had to leave." },
  { title: "Before the Coffee Gets Cold", author: "Toshikazu Kawaguchi", genre: "East Asian", synopsis: "Japanese magical realism. A café where you may return to the past, if you finish the coffee in time.", isbn: "9781335430991" },
  { title: "Days at the Morisaki Bookshop", author: "Satoshi Yagisawa", genre: "East Asian", synopsis: "Japanese contemporary fiction. A young woman hides in her uncle's bookshop and slowly starts reading.", isbn: "9780063278677" },
  { title: "I Want to Die but I Want to Eat Tteokbokki", author: "Baek Se-hee", genre: "East Asian", synopsis: "A Korean memoir in sessions with a psychiatrist. Depression, written down between ordinary appetites.", isbn: "9781635579383" },
  { title: "Putting the Power of Your Subconscious Mind to Work", author: "Joseph Murphy", genre: "Mind", synopsis: "Self-help in the New Thought line. A practical book about habits, imagination, and the stories you repeat." },
  { title: "The Artist's Way", author: "Julia Cameron", genre: "Mind", synopsis: "A creative recovery course. Morning pages, walks, and the idea that making things is a practice.", isbn: "9781585421466" },
  { title: "Are Men Obsolete?", author: "Camille Paglia and Caitlin Moran", genre: "Mind", synopsis: "A debate on gender, listed under Camila Paglia. Camille Paglia and Caitlin Moran argue the question in public.", isbn: "9781770894611" },
  { title: "Urdu Dictionary", author: "Reference", genre: "Reference", synopsis: "A language dictionary. The shelf for looking a word up, not for finishing a plot." },
  { title: "University publication magazine", author: "University publication", genre: "Reference", synopsis: "A student magazine from a university press run. Kept with the other things that are not quite books and not quite papers." },
];

export const SEED_REVISION = 2;

function toBook(draft: Draft, index: number): Book {
  return {
    id: `10000000-0000-4000-8000-${(index + 1).toString(16).padStart(12, "0")}`,
    owner_id: owner,
    title: draft.title,
    author: draft.author,
    cover_url: draft.isbn ? cover(draft.isbn) : null,
    synopsis: draft.synopsis,
    genre: draft.genre,
    format: "physical",
    rating: null,
    review: null,
    isbn: draft.isbn ?? null,
    status: "available",
    created_at: new Date(Date.UTC(2024, 0, 1) + index * 86_400_000).toISOString(),
  };
}

const listed: Draft[] = [
  { title: "Harry Potter and the Half-Blood Prince", author: "J.K. Rowling", genre: "Fantasy", synopsis: "YA magical-school fantasy. The sixth year, when a teacher's past starts to matter more than the classes.", isbn: "9780439785969" },
  { title: "Harry Potter and the Deathly Hallows", author: "J.K. Rowling", genre: "Fantasy", synopsis: "YA epic fantasy. The last hunt, away from the school, for the objects keeping someone alive.", isbn: "9780545139700" },
  { title: "Fantastic Beasts: The Original Screenplay", author: "J.K. Rowling", genre: "Fantasy", synopsis: "A fantasy screenplay. A wizard, a case of creatures, and a city unprepared for both.", isbn: "9781338109061" },
  { title: "Six of Crows", author: "Leigh Bardugo", genre: "Fantasy", synopsis: "YA heist fantasy, and a dark one. Six people who do not trust each other agree to steal a locked thing.", isbn: "9781627792127" },
  { title: "The Mark of Athena", author: "Rick Riordan", genre: "Fantasy", synopsis: "YA fantasy from Greek myth, in the Heroes of Olympus sequence. A quest that needs the ship to hold.", isbn: "9781423140603" },
  { title: "The Cruel Prince", author: "Holly Black", genre: "Fantasy", synopsis: "YA faerie fantasy, political at the edges. A mortal girl learns the court by refusing to be ornamental.", isbn: "9780316310277" },
  { title: "The Queen of Nothing", author: "Holly Black", genre: "Fantasy", synopsis: "YA faerie fantasy. The last bargain, in a court that prefers a beautiful lie.", isbn: "9780316310383" },
  { title: "The Fellowship of the Ring", author: "J.R.R. Tolkien", genre: "Fantasy", synopsis: "High fantasy. The road out of the Shire, and the company that agrees to walk it.", isbn: "9780547928210" },
  { title: "The Fellowship of the Ring", author: "J.R.R. Tolkien", genre: "Fantasy", synopsis: "Second copy. The same high-fantasy novel, kept twice on the shelf.", isbn: "9780547928210" },
  { title: "The Lord of the Rings", author: "J.R.R. Tolkien", genre: "Fantasy", synopsis: "High fantasy in a single volume. Someone small carries a thing that must not be used.", isbn: "9780618640157" },
  { title: "Crooked Kingdom", author: "Leigh Bardugo", genre: "Fantasy", synopsis: "YA heist fantasy. The job is finished and the city still expects to be paid.", isbn: "9781627792134" },
  { title: "Prince Caspian", author: "C.S. Lewis", genre: "Fantasy", synopsis: "Children's fantasy with a high-fantasy kingdom. The land has forgotten who used to rule it.", isbn: "9780064471053" },
  { title: "The Ballad of Never After", author: "Stephanie Garber", genre: "Fantasy", synopsis: "YA romantic fantasy. Also the romance shelf's claim. A story that will not stay finished.", isbn: "9781250268419" },
  { title: "The Alchemist", author: "Paulo Coelho", genre: "Fantasy", synopsis: "Philosophical fiction as an allegory. A shepherd follows a dream past the edge of the map.", isbn: "9780062315007" },
  { title: "Valkyries", author: "Paulo Coelho", genre: "Fantasy", synopsis: "Spiritual fiction with magical realism. A desert journey and the women who ride above it." },
  { title: "The Little Prince", author: "Antoine de Saint-Exupéry", genre: "Fantasy", synopsis: "A philosophical children's book, and an allegory. A pilot meets a boy who is serious about one rose.", isbn: "9780156012195" },
  { title: "Harry Potter and the Cursed Child", author: "J.K. Rowling, John Tiffany, and Jack Thorne", genre: "Fantasy", synopsis: "A fantasy stage play. The next generation finds the part of the story that was left unfinished.", isbn: "9781338099133" },
  { title: "Lord of Shadows", author: "Cassandra Clare", genre: "Fantasy", synopsis: "YA urban fantasy. A paranormal court under the ordinary streets of Los Angeles.", isbn: "9781442468405" },
  { title: "The Dark Artifices", author: "Cassandra Clare", genre: "Fantasy", synopsis: "YA urban fantasy. The Los Angeles sequence, shelved as the set you own it as." },
  { title: "City of Ashes", author: "Cassandra Clare", genre: "Fantasy", synopsis: "YA urban fantasy. The family secret stops being theoretical.", isbn: "9781416914297" },
  { title: "Twilight", author: "Stephenie Meyer", genre: "Fantasy", synopsis: "YA paranormal romance. A new girl in a town where the beautiful people avoid the sun.", isbn: "9780316015844" },
  { title: "New Moon", author: "Stephenie Meyer", genre: "Fantasy", synopsis: "YA paranormal romance. After the vampires leave, the wolves are still in the trees.", isbn: "9780316160193" },
  { title: "Eclipse", author: "Stephenie Meyer", genre: "Fantasy", synopsis: "YA paranormal romance. Two loyalties, and a fight that is coming either way.", isbn: "9780316160209" },
  { title: "Divergent", author: "Veronica Roth", genre: "Speculative", synopsis: "YA dystopian science fiction. A city divided by virtue, and a girl who tests as more than one.", isbn: "9780062024039" },
  { title: "Allegiant", author: "Veronica Roth", genre: "Speculative", synopsis: "YA dystopian science fiction. Outside the wall, the experiment is still being run.", isbn: "9780062024060" },
  { title: "Four: A Divergent Collection", author: "Veronica Roth", genre: "Speculative", synopsis: "Companion stories from the same dystopia, told by someone who already knew the factions.", isbn: "9780062345219" },
  { title: "The Hunger Games", author: "Suzanne Collins", genre: "Speculative", synopsis: "YA dystopian fiction. A televised game, and a volunteer who should not have had to raise her hand.", isbn: "9780439023481" },
  { title: "Catching Fire", author: "Suzanne Collins", genre: "Speculative", synopsis: "YA dystopian fiction. The victory tour is a threat, and the arena wants another season.", isbn: "9780439023498" },
  { title: "Mockingjay", author: "Suzanne Collins", genre: "Speculative", synopsis: "YA dystopian fiction. The symbol has to become a person again.", isbn: "9780439023511" },
  { title: "The Ballad of Songbirds and Snakes", author: "Suzanne Collins", genre: "Speculative", synopsis: "YA dystopian fiction as a political thriller. The games, in the years before they looked inevitable.", isbn: "9781338635171" },
  { title: "Sunrise on the Reaping", author: "Suzanne Collins", genre: "Speculative", synopsis: "YA dystopian fiction. Another reaping morning, and another story the Capitol would rather direct." },
  { title: "In Half", author: "Jasmin B. Frelih", genre: "Speculative", synopsis: "Literary speculative fiction. A dystopia more interested in how people talk than in the machinery." },
  { title: "The Handmaid's Tale", author: "Margaret Atwood", genre: "Speculative", synopsis: "Feminist dystopian fiction. A woman kept for one use, remembering a life she is not allowed to write down.", isbn: "9780385490818" },
  { title: "1984", author: "George Orwell", genre: "Speculative", synopsis: "Political dystopian fiction. A language redesigned so that some thoughts can no longer be had.", isbn: "9780451524935" },
  { title: "Animal Farm", author: "George Orwell", genre: "Speculative", synopsis: "Political satire as an allegory. A revolution that learns the old commandments too quickly.", isbn: "9780451526342" },
  { title: "Lord of the Flies", author: "William Golding", genre: "Speculative", synopsis: "A psychological allegory and a small dystopia. Boys, an island, and rules that do not last the week.", isbn: "9780399501487" },
  { title: "I Who Have Never Known Men", author: "Jacqueline Harpman", genre: "Speculative", synopsis: "Literary speculative fiction. Raised in a cage, a woman tries to read a world that has already stopped." },
  { title: "The Elite", author: "Kiera Cass", genre: "Romance", synopsis: "YA dystopian romance. The selection gets smaller, and the palace does not get kinder.", isbn: "9780062059963" },
  { title: "The One", author: "Kiera Cass", genre: "Romance", synopsis: "YA dystopian romance. The end of a competition that was never only about being chosen.", isbn: "9780062059994" },
  { title: "If You Could See the Sun", author: "Ann Liang", genre: "Romance", synopsis: "YA contemporary romance with a streak of magical realism. A scholarship student who begins to vanish." },
  { title: "Nothing Like the Movies", author: "Lynn Painter", genre: "Romance", synopsis: "Romantic comedy. Your note said Nothing Like the Sun by Lin Painter; this is Lynn Painter's novel of that shelf.", isbn: "9781665947138" },
  { title: "Book Lovers", author: "Emily Henry", genre: "Romance", synopsis: "Contemporary romantic comedy. A sharp editor and a man who wants the small-town ending she edits out of other people's books.", isbn: "9780593440872" },
  { title: "Before I Go", author: "Colleen Oakley", genre: "Romance", synopsis: "Contemporary women's fiction. She tries to arrange a life she will not be here to supervise." },
  { title: "Slow Burn", author: "Julie Garwood", genre: "Romance", synopsis: "Romantic suspense. Listed as Julia Garwood; the suspense novels under this title are Julie Garwood's." },
  { title: "Can You Keep a Secret?", author: "Sophie Kinsella", genre: "Romance", synopsis: "Romantic comedy. Secrets told to a stranger on a plane, who turns out to sign the paychecks.", isbn: "9780440241537" },
  { title: "Every Breath", author: "Nicholas Sparks", genre: "Romance", synopsis: "Contemporary romantic drama. Two people on a coastline with a choice that will not stay theoretical." },
  { title: "Fine Things", author: "Danielle Steel", genre: "Romance", synopsis: "Women's fiction. Work, family, and the losses that rearrange both." },
  { title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid", genre: "Romance", synopsis: "Historical and contemporary fiction. A star tells the love story the studio would not print.", isbn: "9781501161933" },
  { title: "Better Than the Movies", author: "Lynn Painter", genre: "Romance", synopsis: "YA romantic comedy. She has the script. The boy next door will not say the line.", isbn: "9781534467637" },
  { title: "Love from A to Z", author: "S.K. Ali", genre: "Romance", synopsis: "YA contemporary romance. A shared notebook, a city, and two people comparing what they are afraid of.", isbn: "9781534442726" },
  { title: "Love Letters to the Dead", author: "Ava Dellaira", genre: "Romance", synopsis: "YA coming-of-age fiction. Letters addressed to people who cannot write back." },
  { title: "Am I Normal Yet?", author: "Holly Bourne", genre: "Romance", synopsis: "YA feminist fiction. She wants an ordinary life, and ordinary turns out to be a political demand." },
  { title: "A Good Girl's Guide to Murder", author: "Holly Jackson", genre: "Mystery", synopsis: "YA crime thriller. A school project that treats a closed murder as if the file were still warm.", isbn: "9781984896391" },
  { title: "Deception Point", author: "Dan Brown", genre: "Mystery", synopsis: "A political techno-thriller. Something under the ice, and institutions that need the find to be real.", isbn: "9780671027384" },
  { title: "Lolita", author: "Vladimir Nabokov", genre: "Mystery", synopsis: "Psychological literary fiction. A beautifully managed narrator, which is a reason to doubt him.", isbn: "9780679723165" },
  { title: "The Double", author: "Fyodor Dostoevsky", genre: "Mystery", synopsis: "Existential psychological fiction. A clerk meets a man who is living his life more successfully." },
  { title: "The Midwife's Daughter", author: "Patricia Ferguson", genre: "Literary", synopsis: "Historical literary fiction. Birth, class, and the women who know the version that never gets written down." },
  { title: "Rumi's Daughter", author: "Muriel Maufroy", genre: "Literary", synopsis: "Historical fiction. Your list had Muriel Maffrey; the novel of a girl near Rumi is Muriel Maufroy's." },
  { title: "Best of Friends", author: "Kamila Shamsie", genre: "Literary", synopsis: "Literary fiction about friendship, class, and the politics that enter a private room.", isbn: "9781526647704" },
  { title: "The Bee Sting", author: "Paul Murray", genre: "Literary", synopsis: "A family saga with a dark comic streak. Money, weather, and a secret in the car.", isbn: "9780374600303" },
  { title: "Blue Sisters", author: "Coco Mellors", genre: "Literary", synopsis: "Contemporary family drama. Three sisters and a grief none of them is holding in the same place." },
  { title: "The Old Man and the Sea", author: "Ernest Hemingway", genre: "Literary", synopsis: "Existential fiction. An old man, a great fish, and the row back to a village that will see the bones.", isbn: "9780684801223" },
  { title: "To the Lighthouse", author: "Virginia Woolf", genre: "Literary", synopsis: "Modernist psychological fiction. A house by the sea, a painting, and years that pass in a corridor.", isbn: "9780156907392" },
  { title: "A Farewell to Arms", author: "Ernest Hemingway", genre: "Literary", synopsis: "A war romance in plain sentences. Love between rain, hospitals, and the front.", isbn: "9780684801469" },
  { title: "White Nights", author: "Fyodor Dostoevsky", genre: "Literary", synopsis: "A romantic novella. Four bright nights in Petersburg and a loneliness with good manners.", isbn: "9780140445562" },
  { title: "Notes from Underground", author: "Fyodor Dostoevsky", genre: "Literary", synopsis: "Philosophical fiction. A man in a basement arguing with his century, and losing on purpose.", isbn: "9780679734529" },
  { title: "The Bell Jar", author: "Sylvia Plath", genre: "Literary", synopsis: "Semi-autobiographical psychological fiction. A glittering internship, then the glass coming down.", isbn: "9780060837020" },
  { title: "The Metamorphosis", author: "Franz Kafka", genre: "Literary", synopsis: "Absurdist fiction. He wakes changed, and the family calculates what they can still ask of him.", isbn: "9780553213690" },
  { title: "The Catcher in the Rye", author: "J.D. Salinger", genre: "Literary", synopsis: "A coming-of-age novel that declines the moral. A few days loose in the city.", isbn: "9780316769488" },
  { title: "The Picture of Dorian Gray", author: "Oscar Wilde", genre: "Literary", synopsis: "Gothic philosophical fiction. The portrait keeps the bill, and the man spends the credit.", isbn: "9780141439570" },
  { title: "Anne of Green Gables", author: "L.M. Montgomery", genre: "Literary", synopsis: "Children's literary fiction. An orphan with opinions arrives where a boy was ordered.", isbn: "9780553213133" },
  { title: "To Kill a Mockingbird", author: "Harper Lee", genre: "Literary", synopsis: "Social justice fiction seen from a child's street. A trial, a town, and a neighbor nobody visits.", isbn: "9780061120084" },
  { title: "The Canterbury Tales", author: "Geoffrey Chaucer", genre: "Classics", synopsis: "Medieval narrative poetry. Pilgrims shortening the road by telling on one another." },
  { title: "Romeo and Juliet", author: "William Shakespeare", genre: "Classics", synopsis: "A romantic tragedy on a very short clock. Two households, and a timetable with no spare day.", isbn: "9780743477116" },
  { title: "Wuthering Heights", author: "Emily Brontë", genre: "Classics", synopsis: "Gothic romance. The moor, two houses, and a devotion that does not improve anyone.", isbn: "9780141439556" },
  { title: "Pride and Prejudice", author: "Jane Austen", genre: "Classics", synopsis: "Regency romance and social satire. Two proud people, wrong about each other with great style.", isbn: "9780141439518" },
  { title: "Pride and Prejudice", author: "Jane Austen", genre: "Classics", synopsis: "Second copy of the same Regency novel.", isbn: "9780141439518" },
  { title: "Persuasion", author: "Jane Austen", genre: "Classics", synopsis: "Regency romance. A love given up too early, met again on a seaside walk.", isbn: "9780141439686" },
  { title: "Emma", author: "Jane Austen", genre: "Classics", synopsis: "Regency social comedy. She is talented at matchmaking, which is not the same as being right.", isbn: "9780141439587" },
  { title: "Jane Eyre", author: "Charlotte Brontë", genre: "Classics", synopsis: "A gothic novel of education. A governess who will not call gratitude a marriage.", isbn: "9780141441146" },
  { title: "Anna Karenina", author: "Leo Tolstoy", genre: "Classics", synopsis: "Realist psychological fiction. An affair, a marriage, and a country in the same weather.", isbn: "9780143035008" },
  { title: "The Sun Also Rises", author: "Ernest Hemingway", genre: "Classics", synopsis: "Modernist fiction, also at home with the literary shelf. Exiles after the war, counting the days in cafés.", isbn: "9780743297332" },
  { title: "Train to Pakistan", author: "Khushwant Singh", genre: "South Asian", synopsis: "Partition literature. One village as the border hardens and the trains begin to arrive wrong.", isbn: "9780802132215" },
  { title: "The Bastard of Istanbul", author: "Elif Shafak", genre: "South Asian", synopsis: "Turkish literary fiction, shelved with the political histories. Two families and a silence about what happened.", isbn: "9780143112716" },
  { title: "The Ministry of Utmost Happiness", author: "Arundhati Roy", genre: "South Asian", synopsis: "Indian political fiction. A graveyard in Delhi and the people a ministry would rather not count.", isbn: "9781524733155" },
  { title: "The Kite Runner", author: "Khaled Hosseini", genre: "South Asian", synopsis: "Afghan historical fiction. A childhood in Kabul and a debt carried into another country.", isbn: "9781594631931" },
  { title: "The God of Small Things", author: "Arundhati Roy", genre: "South Asian", synopsis: "Postcolonial family fiction. Kerala, twins, and the laws about who is allowed to love.", isbn: "9780812979657" },
  { title: "Discontent and Its Civilizations", author: "Mohsin Hamid", genre: "South Asian", synopsis: "Essays in cultural and political criticism, from a novelist stepping outside the novel." },
  { title: "Rogue States", author: "Noam Chomsky", genre: "South Asian", synopsis: "Political nonfiction on international power. Shelved with the political writing, beside the South Asian books.", isbn: "9780896086111" },
  { title: "Blasphemy", author: "Tehmina Durrani", genre: "South Asian", synopsis: "Pakistani social realism. Feudal power, religious authority, and the women living under both." },
  { title: "Dastan-e Mujahid", author: "Naseem Hijazi", genre: "South Asian", synopsis: "Urdu historical fiction. An Islamic historical novel, kept as its own book rather than folded into the classics." },
  { title: "Ariel", author: "Sylvia Plath", genre: "Poetry", synopsis: "Confessional modernist poetry. The late poems, exact and unbearable.", isbn: "9780060931728" },
  { title: "The Colossus", author: "Sylvia Plath", genre: "Poetry", synopsis: "Earlier confessional poems. The voice gathering itself before Ariel.", isbn: "9780679720731" },
  { title: "An Anthology of English Poetry", author: "Oxford University Press", genre: "Poetry", synopsis: "An Oxford anthology. It also belongs with the reference shelf; the poems won." },
  { title: "The Soul of Rumi", author: "Coleman Barks", genre: "Poetry", synopsis: "Sufi poetry in Coleman Barks's selections. Ecstatic verse carried into English." },
  { title: "Rumi: Swallowing the Sun", author: "Franklin D. Lewis", genre: "Poetry", synopsis: "Scholarship and Sufi poetry together. A reader for how Rumi's verses are built." },
  { title: "The Nectar of Pain", author: "Najwa Zebian", genre: "Poetry", synopsis: "Contemporary poetry about love, hurt, and the unglamorous work of healing.", isbn: "9781449492892" },
  { title: "The Sun and Her Flowers", author: "Rupi Kaur", genre: "Poetry", synopsis: "Contemporary free verse, in the order of a life: wilting, falling, rooting, rising, blooming.", isbn: "9781449486792" },
  { title: "The Forty Rules of Love", author: "Elif Shafak", genre: "Poetry", synopsis: "A novel, not a verse collection. Spiritual historical fiction wound through Rumi and Shams of Tabriz.", isbn: "9780141047188" },
  { title: "The Prophet", author: "Khalil Gibran", genre: "Poetry", synopsis: "Philosophical prose poetry, which is not the same thing as a novel about a mystic. Answers given on the way to a ship.", isbn: "9780394404288" },
  ...books,
];

export const SEED_BOOKS: Book[] = listed.map(toBook);
