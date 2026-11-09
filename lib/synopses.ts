const SYNOPSES: Record<string, string> = {
  "Harry Potter and the Half-Blood Prince":
    "In his sixth year at Hogwarts, Harry is pulled out of ordinary schoolwork and into Dumbledore's private lessons about the childhood of Lord Voldemort. A new potions teacher, a cursed piece of jewelry, and a romance he cannot quite manage all run alongside that history. The year ends with a choice on the Astronomy Tower that the school cannot undo.",
  "Harry Potter and the Deathly Hallows":
    "Harry leaves school without a plan except to find and destroy the objects that keep Voldemort alive. He, Ron, and Hermione move through a country at war, hunted, short of food, and increasingly unsure of one another. The search leads back to Hogwarts, and to three objects from an old children's story that offer another way to face death.",
  "Fantastic Beasts: The Original Screenplay":
    "Newt Scamander arrives in 1926 New York with a suitcase full of magical creatures, and several of them get out. While he tries to recover them, a darker force is attacking the city and the wizarding world is blaming everything it does not understand. The screenplay follows the chase through speakeasies, a newspaper, and a family that has been taught to hate magic.",
  "Six of Crows":
    "Kaz Brekker is offered a fortune to break a prisoner out of the Ice Court, the most guarded place in a hostile country. He assembles five criminals who do not trust him or each other: a gambler, a runaway, a soldier, a demolitions expert, and a spy. The plan depends on timing, disguises, and the hope that none of them will sell the others out before the job is done.",
  "The Mark of Athena":
    "Seven demigods from the Greek and Roman camps sail together toward an ancient goal, already half ready to fight one another. Annabeth is sent alone into Rome to follow the mark of Athena, a trail left for a child of wisdom. Above ground the crew tries to keep the ship in one piece. Below it, she has to walk a path that was built to kill her.",
  "The Cruel Prince":
    "Jude and her sisters are raised in the High Court of Faerie by the man who killed their parents. She cannot do magic, so she studies swordplay, poison, and the court's rules instead. A place beside Prince Cardan looks like humiliation until she realizes the throne is weaker than it pretends, and that a mortal who understands the game can take a piece of it.",
  "The Queen of Nothing":
    "Jude is exiled to the mortal world after being betrayed, while Cardan remains on the throne she helped him take. A sister's plea pulls her back into Faerie, where a curse is spreading and the court still prefers a beautiful lie to a plain truth. She has to decide what she is willing to become in order to hold a kingdom that was never meant to be hers.",
  "The Fellowship of the Ring":
    "A hobbit inherits a ring that wants to return to its maker, and the quiet of the Shire cannot protect him once its servants know where it is. Frodo sets out with companions who agree, for a while, to walk the same road: men, a dwarf, an elf, a wizard, and other hobbits. The company breaks on the journey toward Mordor, and the smallest of them has to go on without the protection he started with.",
  "The Lord of the Rings":
    "The whole story of the Ring, from the Shire to the War of the Ring, in a single volume. Frodo carries the Ring toward the one fire that can unmake it, while his friends fight a war meant to give him time. The book is as interested in the long walk home, and in what power costs the people who refuse it, as it is in the battles.",
  "Crooked Kingdom":
    "The Ice Court job is over, and Ketterdam wants its money back. Kaz's crew is scattered, injured, and holding a prisoner too valuable to keep and too dangerous to release. To survive the city's merchants, gangs, and their own bargains, they have to run a second scheme in the place they supposedly know best.",
  "Prince Caspian":
    "A thousand years after they left, the Pevensie children are pulled back into Narnia and find the land under a Telmarine king who has tried to erase its talking beasts and old stories. Prince Caspian, the rightful heir, is in hiding with the creatures who still remember. The children have to help him take the country back before the old Narnia is gone for good.",
  "The Ballad of Never After":
    "Evangeline Fox made a bargain that was supposed to save the boy she loves, and it left him married to someone else and unable to tell her the truth. The story she is trapped in keeps rewriting itself, with knives, curses, and a fate that treats her hope as a plot device. She has to learn which version of Jacks, and of herself, is the one the story cannot kill.",
  "The Alchemist":
    "Santiago, an Andalusian shepherd, dreams of a treasure buried near the Egyptian pyramids and sells his sheep to follow it. On the road he meets a king, a crystal merchant, an Englishman, and an alchemist, each of whom gives him a different lesson about desire and fear. The journey keeps turning him back toward the life he already had the means to notice.",
  Valkyries:
    "Paulo, a writer whose marriage is strained, travels into the Mojave Desert with his wife, Chris, to keep a promise he made on the road to Santiago. There he meets the Valkyries, a group of women who travel the desert and speak about breaking with the past. The book is a spiritual journey about jealousy, courage, and whether a person can actually change the agreements they have made with themselves.",
  "The Little Prince":
    "A pilot stranded in the Sahara meets a small boy who says he has come from an asteroid, where he looks after a single rose. The boy describes the grown-ups he met on the way, each obsessed with numbers, power, or ownership. What he wants from the pilot is not rescue so much as a promise to remember that the important things are invisible.",
  "Harry Potter and the Cursed Child":
    "Years after the war, Harry is a tired father and Albus is a son who does not want his father's story. A conversation with Amos Diggory and a stolen Time-Turner send Albus and Scorpius Malfoy back into the past to save Cedric. Each change they make unravels the world they came from, and Harry has to face the part of himself he has been asking his son to carry.",
  "Lord of Shadows":
    "Emma Carstairs and Julian Blackthorn are in love, which the Law of the Clave treats as a crime because they were raised as parabatai. The Blackthorn family is trying to protect a secret about Mark and Kieran, and about Ty's grief, while a threat from Faerie moves closer to Los Angeles. The more Julian schemes to keep his family safe, the more he begins to resemble the coldness he is fighting.",
  "The Dark Artifices":
    "This is the Los Angeles sequence about Emma Carstairs and the Blackthorns: a group of young Shadowhunters raising one another after a massacre, on the edge of a war with Faerie. Emma is bound to Julian as a parabatai and in love with him anyway, which the Clave would punish with madness or death. The set follows that forbidden love through sea demons, the Unseelie Court, and the question of how far Julian will go for the children in his care.",
  "City of Ashes":
    "After Clary Fray learns that her father is Valentine and that Jace may be her brother, the Shadowhunter world stops treating either of them as ordinary teenagers. Valentine steals the second Mortal Instrument and raises demons over New York, while the Clave closes in on Jace. Clary has to decide whom she believes, and what her new ability to create runes is for.",
  Twilight:
    "Bella Swan moves to Forks, Washington, to live with her father and finds herself drawn to Edward Cullen, a boy whose family never eats, never seems to sleep, and avoids the sunlight. He is a vampire who has chosen not to hunt humans, and he wants her anyway. The attachment puts her in the path of a tracker who does not share the Cullens' restraint.",
  "New Moon":
    "Edward leaves Bella, convinced he is the danger in her life, and the departure hollows her out. She finds a dangerous kind of comfort with Jacob Black, whose family is hiding a change of its own. When a misunderstanding puts Edward in the path of the Volturi, Bella has to cross into the vampire world again to stop him from a decision he cannot take back.",
  Eclipse:
    "Victoria is building an army of newborn vampires to take Bella, while Edward and Jacob both want a future with her and cannot share it. The treaty between the Cullens and the wolves frays as they prepare to fight on the same side. Bella, who has asked to be changed, has to choose a life, and a war, before her graduation.",
  Divergent:
    "In a walled Chicago, sixteen-year-olds choose a faction that will define their virtue for life: honesty, selflessness, bravery, kindness, or learning. Beatrice Prior leaves her selfless family for Dauntless and learns that her test result was Divergent, a mind the system cannot classify. The people who run the factions have a use for anyone who cannot be controlled.",
  Allegiant:
    "The faction system has fallen, and Tris and Tobias leave the city to find out who built it. Beyond the fence is a bureau that has been watching Chicago as an experiment in genetic damage and repair. The people inside the experiment and the people running it do not agree on what should happen next, and Tris is asked to pick a side that will cost her either way.",
  "Four: A Divergent Collection":
    "Four stories from Tobias Eaton's life before and alongside Divergent: his escape from his father's abusive house, his choice of Dauntless, his rise inside that faction, and his first notice of Tris. Together they show how he learned to distrust the system he is very good at surviving. The pieces are his, not Tris's, and they fill in the years the novel left offstage.",
  "The Hunger Games":
    "In Panem, each district must send a boy and a girl to fight to the death on television. When her younger sister is chosen, Katniss Everdeen volunteers in her place and enters the arena with Peeta Mellark, a boy who once kept her family from starving. The Games are designed to make the districts watch one another die. Katniss's refusal to play them cleanly becomes a problem for the Capitol.",
  "Catching Fire":
    "Katniss and Peeta's act of defiance has made them symbols, and President Snow wants the performance corrected on a Victory Tour. Resistance is already catching in the districts. For the 75th Games, the Capitol sends previous victors back into the arena, and Katniss has to decide whether she is willing to be the spark other people will burn for.",
  Mockingjay:
    "Rescued from the arena and taken to District 13, Katniss is asked to become the face of a revolution she did not design. Peeta is in the Capitol's hands, and the footage of him is being used against her. The war that follows asks what a symbol owes the people who carry it, and what remains of a person once the war has used her up.",
  "The Ballad of Songbirds and Snakes":
    "Years before he is president, Coriolanus Snow is a student assigned to mentor a tribute from District 12, Lucy Gray Baird, in the early and still unstable Hunger Games. His family's status depends on her survival, and he begins to care about her in a way he can turn into strategy. The book follows the choices that teach him to treat affection, and other people, as threats to be managed.",
  "Sunrise on the Reaping":
    "This is Haymitch Abernathy's story of the 50th Hunger Games, the Second Quarter Quell, in which twice the usual number of children were sent into the arena. It returns to the reaping that made him District 12's victor and to the way the Capitol shaped what the country was allowed to remember about him. The novel is interested in the cost of surviving a story someone else gets to edit.",
  "In Half":
    "Also published as In/Half. Twenty-five years after a collapse of global communications, three childhood friends approach their fiftieth birthdays in a world that can no longer speak to itself. Evan is staging a play in Tokyo, Kras is a former war minister surrounded by his family in a fortified Europe, and Zoja is preparing to read her poems in Brooklyn. The novel cuts between them as each tries to find a way back to a life that the broken world will not reassemble.",
  "The Handmaid's Tale":
    "In the Republic of Gilead, fertile women are assigned to powerful men as Handmaids and stripped of their names, work, and right to read. Offred, placed in the Commander's house, remembers the daughter, the husband, and the ordinary life taken from her. Small violations of the rules, a market, a ceremony, a forbidden game of Scrabble, become the only room she has in which to remain a person.",
  "1984":
    "Winston Smith works at the Ministry of Truth, rewriting old newspapers so the past always agrees with the Party. He begins a secret diary and an affair with Julia, both of which are crimes against a government that watches through the telescreen. The novel follows what happens when he looks for a resistance and finds that the state wants not only his obedience but the contents of his mind.",
  "Animal Farm":
    "The animals of Manor Farm drive out their farmer and write seven commandments for a society in which no animal will oppress another. The pigs, who appoint themselves the planners, begin to edit those commandments as soon as power is comfortable. The fable follows how a revolution spoken in the language of equality turns into a new version of the farmhouse it overthrew.",
  "Lord of the Flies":
    "A plane crash leaves a group of British schoolboys alone on an island with no adults. They elect a leader, keep a signal fire, and try to hold a meeting, and then fear, hunting, and a painted face begin to organize them more effectively than the rules do. The book watches a society invent its own monster and then become it.",
  "I Who Have Never Known Men":
    "A girl grows up in an underground cage with thirty-nine older women and male guards who never explain the rules. She has no memory of the world before the cage. When the guards disappear, the women walk out into an empty country, and she spends the rest of her life trying to read a civilization that seems to have ended without leaving her a way to ask why.",
  "The Elite":
    "America Singer has made it to the final group of the Selection, a televised competition for Prince Maxon's hand and the crown. The palace is narrower and more dangerous at this stage: the remaining girls are rivals, the rebels outside are closer, and Maxon is no longer only a prize. America has to decide whether the life being offered is one she can stand to win.",
  "The One":
    "The Selection is down to its last choices, and the country is watching America as if the outcome were a wedding rather than a political arrangement. Rebels, a rival prince, and the girls still in the palace make the final weeks a question of loyalty as much as love. America has to choose what she will owe Maxon, and what she will refuse the crown, if she stays.",
  "If You Could See the Sun":
    "Alice Sun is a scholarship student at an elite Beijing boarding school, working constantly to justify a place her classmates were born into. She discovers she can turn invisible, and invisibility turns out to be something other students will pay for. The favors get larger, and the cost of staying unseen starts to include the people she is trying not to lose.",
  "Nothing Like the Movies":
    "The list said Nothing Like the Sun by Lin Painter. The novel on this shelf is Nothing Like the Movies by Lynn Painter, a romantic comedy about a second chance. Liz and Wes had a movie-shaped love story that broke, and a later meeting asks whether they can want each other without the script that made the first version look easy.",
  "Book Lovers":
    "Nora Stephens is a New York literary agent who has been cast, more than once, as the cold city girlfriend in someone else's small-town romance. A month in North Carolina with her sister puts her across the table from Charlie Lastra, an editor she already dislikes. The book is about two people who know the tropes and still have to find out what they want when the story will not follow them.",
  "Before I Go":
    "Daisy has terminal cancer and becomes convinced that her husband, Jack, will not manage their life, or their dog, without her. She sets out to find him a new wife before she dies. The plan forces her to look at the marriage she is trying to replace herself in, and at the difference between loving someone and arranging them.",
  "Slow Burn":
    "Listed under Julia Garwood; the romantic suspense of this title is Julie Garwood's. Kate MacKenna, who has built a fragrance business near Charleston, survives an explosion and then learns that her late mother left the company in debt. A second attempt on her life brings Dylan Buchanan, a Boston detective and her best friend's brother, into her house. He is there to find out who wants her dead, and neither of them is good at pretending that is all he is there for.",
  "Can You Keep a Secret?":
    "Emma Corrigan, convinced the plane is going down, tells a sympathetic stranger every secret she has, including what she thinks of her job. He turns out to be Jack Harper, the head of the company she works for, and he remembers all of it. The comedy is what happens when the person who knows too much is also the person she has to face on Monday.",
  "Every Breath":
    "Hope Anderson is at her family's cottage on Sunset Beach, trying to decide whether to marry the man waiting at home, when she meets Tru Walls beside a mailbox where strangers leave letters for the future. The days they spend together make the decision she came to settle feel less settled. The novel is about a brief meeting that rearranges two lives, and about the stories people tell so they can bear the ending.",
  "Fine Things":
    "Bernie Fine leaves the New York fashion office he knows and takes over a department store in San Francisco, where he falls in love with Liz and builds a family he did not expect. Loss, a child, and the people who depend on him keep rearranging the life he thought he was assembling. The novel follows him through the ordinary work of raising children and the blows that make that work the point.",
  "The Seven Husbands of Evelyn Hugo":
    "The reclusive film star Evelyn Hugo agrees to tell her life story to an unknown magazine reporter, Monique Grant, and no one can see why she has chosen her. Across seven marriages, Evelyn describes the career, the studio system, and the woman she actually loved. The interview is also a reckoning: Evelyn has picked Monique because their stories are already joined.",
  "Better Than the Movies":
    "Liz Buxbaum has planned her romantic life around her late mother's favorite films, and the boy she wants is supposed to follow the script. The boy next door, Wes, is the person she has spent years treating as an obstacle. A bargain that throws them together forces her to notice that the person who knows her least convenient self is not the one the movies would have cast.",
  "Love from A to Z":
    "Adam and Zayneb meet in Doha and begin keeping the same kind of notebook, listing the marvels and the oddities of their days. She is a Muslim girl who has just been suspended for challenging an Islamophobic teacher. He is hiding a multiple sclerosis diagnosis from his father. The correspondence becomes a way of telling the truth before they are ready to say it aloud.",
  "Love Letters to the Dead":
    "For a school assignment, Laurel writes a letter to Kurt Cobain and then keeps writing, to one dead artist after another, about the sister she lost and the things she has not told the living. The letters let her approach a secret about May and about herself without having to look at it directly. The book is about grief that borrows other people's voices until it can stand to use its own.",
  "Am I Normal Yet?":
    "Evie wants a clean start at sixth form: friends, a boyfriend, and no one who knows she has OCD. The recovery she is performing gets harder to maintain as the rituals return and the romance she wanted turns out to be another thing she has to manage. The novel treats getting well as uneven, and it is as interested in her female friendships as in the boy.",
  "A Good Girl's Guide to Murder":
    "For a school project, Pip Fitz-Amobi reopens the closed case of Andie Bell, the girl everyone believes was killed by her boyfriend Sal Singh. Pip starts with a spreadsheet and a polite doubt. Interviews, threatening notes, and the Singh family's ruined name push the project past what a classroom assignment is supposed to cost.",
  "Deception Point":
    "NASA announces that it has found a meteorite in the Arctic containing proof of extraterrestrial life, and the discovery arrives just in time to rescue a president's campaign. Intelligence analyst Rachel Sexton is sent to verify the find. What she and a small team uncover on the ice is less about science than about who needs the stone to be real.",
  Lolita:
    "Humbert Humbert, a middle-aged scholar and a narrator who cannot be trusted, tells the story of his obsession with twelve-year-old Dolores Haze and of the captivity he calls a love affair. He marries her mother to stay near the child, and after the mother's death he takes Dolores on a long drive across America. The prose is designed to seduce the reader into forgetting whose body the journey is built on.",
  "The Double":
    "Yakov Golyadkin, a minor civil servant in St. Petersburg, meets a man who looks exactly like him, shares his name, and begins to live his life more successfully than he does. The double charms Golyadkin's colleagues and takes his place while Golyadkin protests in a way that makes him sound less and less sane. The novella is about a self that splits under humiliation and cannot persuade anyone that the split is real.",
  "The Midwife's Daughter":
    "In a Cornish town before and during the First World War, Violet Dimond is the local handywoman who delivers babies the doctor does not bother with. Her twin brings her a dying child from an orphanage, a Black girl who resembles the daughter Violet lost, and Violet raises her as Grace. The novel moves among Violet, her sister, and Grace as the town's prejudice and the war press on a household that had looked settled.",
  "Rumi's Daughter":
    "The list named Muriel Maffrey. The novel is Muriel Maufroy's story of Kimya, a girl in thirteenth-century Anatolia who is drawn into the circle of Rumi and his teacher Shams of Tabriz. Kimya is married into that household and has to make a spiritual life inside a love, and a jealousy, that the men around her treat as destiny. The book imagines the daughter and the wife at the edge of a story usually told only about the poet.",
  "Best of Friends":
    "Maryam and Zahra grow up in Karachi as inseparable girls and meet again as powerful women in London, one in politics and one in finance. A secret from a single night in their teens has shaped what each of them thinks the other owes her. The novel follows a friendship across class, migration, and the moment when private loyalty collides with public power.",
  "The Bee Sting":
    "The Barnes family, once comfortable in an Irish town, starts to come apart as Dickie's car business fails and each of them tells a different story about why. Imelda is keeping the household together by charm and bargains, Cass is drinking through the end of school, and PJ is young enough to take the adults at their word. A secret in a car, and a bee sting on a wedding day, sit under the comedy until the book stops being funny.",
  "Blue Sisters":
    "Three sisters, Avery, Bonnie, and Lucky, return to one another after the death of their fourth sister, Nicky. Each has built a life that keeps the family at a distance: a lawyer in London, a boxer, a model. The year that follows asks them to look at the addiction and the grief they divided among themselves, and at whether they can be a family with one of them gone.",
  "The Old Man and the Sea":
    "Santiago, an old Cuban fisherman who has gone eighty-four days without a catch, rows out alone and hooks a giant marlin. The fight lasts for days and takes him far past the place where anyone could help him. What he brings back to the village is not the fish he fought for, and the story stays with the dignity of the fight rather than the market.",
  "To the Lighthouse":
    "The Ramsay family and their guests spend a summer on the Isle of Skye, where a promised trip to the lighthouse is always about to happen and a painter, Lily Briscoe, is trying to finish a picture. A war and ten years pass in a short, brutal stretch of pages. When some of them return, the unfinished picture and the unfinished errand are still there, changed by who is missing.",
  "A Farewell to Arms":
    "Frederic Henry, an American ambulance driver on the Italian front in the First World War, falls in love with Catherine Barkley, an English nurse. The war is rain, injury, and a retreat that stops pretending to be orderly. They try to leave it for Switzerland, and the book stays inside the plain sentences of a happiness that the war has already made fragile.",
  "White Nights":
    "A lonely man in St. Petersburg meets a young woman, Nastenka, on a bridge and spends four evenings listening to her wait for someone else. He offers her a feeling she is grateful for and cannot quite return. The novella is about a tenderness that knows, almost from the first night, that it is temporary.",
  "Notes from Underground":
    "A retired civil servant addresses the reader from a basement in St. Petersburg and argues, at length, with the idea that people can be improved by reason. He then tells the story of a dinner he forced his way into and a woman he tried to rescue in order to feel powerful. The book is a confession that keeps insulting the person who might have sympathized with it.",
  "The Bell Jar":
    "Esther Greenwood wins a placement at a New York magazine and finds that the prizes she was promised do not make a life she can stand. The city, the men, and the plans other people make for her all start to look like the same glass closing overhead. The novel follows her breakdown and the slow, uneven work of coming back, without pretending the glass was a mood.",
  "The Metamorphosis":
    "Gregor Samsa wakes up as a giant insect and worries first about missing the train to work. His family, which has depended on his salary, has to decide what they owe a son they can no longer bear to see. The story stays inside the household: the food left at the door, the sister's violin, and the relief that arrives when the inconvenience ends.",
  "The Catcher in the Rye":
    "Holden Caulfield has just been expelled from another prep school and spends a few days in New York rather than go home and explain. He hires a cab, goes to bars, calls old friends, and keeps thinking about his younger sister Phoebe and about a brother who died. The novel is his voice for those days, funny and furious about every adult performance he can see through.",
  "The Picture of Dorian Gray":
    "Dorian Gray wishes that a portrait of him would age in his place, and the wish is granted. He pursues pleasure, cruelty, and a life with no visible consequence, while the painting in the locked room records what he has done. The book asks what a person becomes when beauty is allowed to escape the bill.",
  "Anne of Green Gables":
    "Matthew and Marilla Cuthbert send for a boy to help on the farm and receive Anne Shirley, an orphan who talks without stopping and refuses to be sent back. Anne names the scenery, makes a fierce friend, and keeps getting into trouble that is mostly imagination meeting a strict household. The novel is about a child talking her way into a home that did not know it needed her.",
  "To Kill a Mockingbird":
    "Scout Finch tells the story of the summer in Maycomb when her father, Atticus, defends a Black man, Tom Robinson, against a false charge. She and her brother Jem watch the trial, their neighbors, and the recluse Boo Radley from a child's height. The book is about what a town is willing to know, and about the people it has agreed not to see.",
  "The Canterbury Tales":
    "A group of pilgrims on the road to Canterbury agrees to tell stories to pass the time, with the Host as judge. Knights, a miller, a wife from Bath, a pardoner, and the rest take turns, and each tale is a way of showing off, settling a score, or preaching. Chaucer's poem is a portrait of medieval England told by people who cannot resist interrupting one another.",
  "Romeo and Juliet":
    "The children of two feuding Verona families meet at a party, marry in secret, and have almost no time before the feud catches up with them. A friar's plan involving a sleeping potion depends on a message that does not arrive. The play is a tragedy about speed: love, anger, and bad news all move faster than anyone can correct.",
  "Wuthering Heights":
    "Lockwood rents a house on the Yorkshire moors and hears, from the housekeeper, the story of Heathcliff and Catherine Earnshaw. Their attachment survives childhood, a bad marriage, and Catherine's death, and it curdles into a revenge that takes in the next generation. The novel is a gothic romance in which love is not a remedy for anything.",
  "Pride and Prejudice":
    "Mrs. Bennet is determined to marry off five daughters before her husband's estate passes away from them. Elizabeth Bennet dislikes the proud Mr. Darcy on sight, and he gives her several good reasons to keep disliking him. The novel is a comedy of misreading, money, and the slow correction of two people who are both sure they are the perceptive one.",
  Persuasion:
    "Eight years before the book opens, Anne Elliot was persuaded to refuse Captain Wentworth because he had no fortune. He returns rich, and still angry, while Anne's vain family is forced to rent out their house. The novel follows a quiet woman who has spent the interval being useful to other people, and a second chance that arrives without announcing itself.",
  Emma:
    "Emma Woodhouse, handsome, clever, and rich, appoints herself the matchmaker of Highbury and is wrong with great confidence. Her project for Harriet Smith collides with the feelings of the people closest to her, including Mr. Knightley, who has always told her the truth. The comedy is about a woman learning that charm is not the same thing as sight.",
  "Jane Eyre":
    "Jane, an orphan who survives a cruel aunt and a harsher school, takes a post as governess at Thornfield Hall and falls in love with her employer, Mr. Rochester. The house is keeping a secret on the third floor. When that secret comes out, Jane refuses a marriage that would cost her self-respect, and the novel follows her until she can come back on her own terms.",
  "Anna Karenina":
    "Anna leaves her husband and son for an affair with Count Vronsky, and Petersburg makes sure she pays for it in public. Alongside that descent, the novel follows Levin, a landowner trying to work out how to live decently with his wife, his farm, and his faith. Tolstoy sets a society love story and a domestic one in the same seasons, and lets them answer each other.",
  "The Sun Also Rises":
    "A group of American and British expatriates drifts between Paris cafés and the bullfights at Pamplona in the years after the First World War. Jake Barnes loves Lady Brett Ashley and cannot be her lover. The novel is about people filling the days with drink, travel, and wit because the war has already decided what kind of life they get to have.",
  "Train to Pakistan":
    "In the summer of 1947, the village of Mano Majra, where Sikhs and Muslims have lived together, is pulled into the violence of Partition. A local dacoit, a Western-educated social worker, and a police officer each fail the moment in a different way. The trains that begin to arrive full of the dead turn a border into something the village can no longer pretend is elsewhere.",
  "The Bastard of Istanbul":
    "Asya Kazanci is a young woman in a chaotic Istanbul household of women, and Armanoush is an Armenian-American girl who comes to stay with the Turkish family her stepfather came from. Their meeting opens a history the Kazancis have managed not to discuss. The novel braids a family comedy with the Armenian genocide and with the silence that let one household go on eating breakfast.",
  "The Ministry of Utmost Happiness":
    "Anjum, a hijra, builds a guest house in a Delhi graveyard, and the people who come to her are the ones no ministry intends to count. A second story follows Tilo, Musa, and a child through Kashmir and the mainland's wars. Roy's novel gathers the abandoned, the militant, and the merely heartbroken into one long argument about who gets to be called Indian.",
  "The Kite Runner":
    "Amir grows up in Kabul with Hassan, the servant's son who is braver than he is and loyal in a way Amir does not repay. A betrayal in an alley, and Amir's silence afterward, follows him to America. The novel is about going back, years later, to do a hard thing for Hassan's child in a country that is no longer the one they flew kites in.",
  "The God of Small Things":
    "In Ayemenem, Kerala, the twins Estha and Rahel grow up inside a family that is proud, fearful, and careful about caste. A visit from their English cousin and their mother's love for a Dalit man, Velutha, break the rules the household is organized to protect. The novel moves between the week everything happens and the adult lives of the twins, who never quite get out of that week.",
  "Discontent and Its Civilizations":
    "Mohsin Hamid's essays on Pakistan, identity, and the stories countries tell about who belongs. He writes as a novelist stepping outside the novel, skeptical of nationalism and of the demand that a person pick one civilization and stay there. The pieces move among Lahore, New York, and London, and they argue for a self that is allowed to be more than one thing.",
  "Rogue States":
    "Noam Chomsky's essays on American foreign policy and the habit of calling other countries rogue while exempting one's own. He reads interventions, sanctions, and official language against the record of what those policies did to the people on the receiving end. The book is political argument, kept on this shelf with the South Asian political writing rather than with the novels.",
  Blasphemy:
    "Tehmina Durrani's novel, drawn from a woman's account of life inside a feudal shrine in Pakistan. The narrator is married to a pir who uses religious authority to control the women and the tenants around him. The book describes violence that the community agrees not to name, and a woman's slow decision to speak anyway.",
  "Dastan-e Mujahid":
    "Naseem Hijazi's first Urdu historical novel, set in the Umayyad period, when Muslim armies were moving at once into Spain, Sindh, Central Asia, and North Africa. It follows the campaigns associated with Tariq ibn Ziyad, Muhammad ibn Qasim, and Qutayba ibn Muslim. The book treats the soldier's faith, discipline, and hardship as the story, rather than a single household.",
  Ariel:
    "Sylvia Plath's last poems, written in a blaze in the months before her death and published after it. They take on a father, a beekeeper, a birth, a ride on a horse, and a fury that the earlier work had held more carefully. The collection is the one readers mean when they talk about her as a confessional poet.",
  "The Colossus":
    "Plath's first book of poems, published in 1960, before the voice of Ariel. The poems are formally held, full of myth, fathers, and landscapes, and they show her building the control that the later work would break. It is the doorway into the poems, not the storm itself.",
  "An Anthology of English Poetry":
    "An Oxford anthology of English verse, the shelf's collection of other people's poems rather than a single poet's book. It runs from the older tradition through the voices a university press decided were the ones to keep. It could have lived with the reference books. It lives here because it is still a book of poems.",
  "The Soul of Rumi":
    "Coleman Barks's selection and English rendering of poems by Jalaluddin Rumi. The verses are about longing, friendship with the divine, and the kind of love that undoes the person who feels it. This is a reading version of Rumi rather than a scholarly edition, meant to be opened at random and read aloud.",
  "Rumi: Swallowing the Sun":
    "Franklin Lewis's book on Rumi as both poet and historical figure, with translations set beside an account of how the poems were made and later remade. It is for a reader who wants the verses and also the context: the teacher Shams, the Mevlevi tradition, and the distance between the Persian and the versions in English. Scholarship and poetry share the same pages.",
  "The Nectar of Pain":
    "Najwa Zebian's poems about heartbreak, self-worth, and the unglamorous work of leaving a love that asked her to disappear. The voice is direct, closer to a letter than to a formal ode, and it is written for someone in the middle of repairing herself. The book is contemporary poetry about healing, not a novel that happens to be short.",
  "The Sun and Her Flowers":
    "Rupi Kaur's second collection, arranged as a life moving through wilting, falling, rooting, rising, and blooming. The poems talk about assault, mothers, immigration, and the slow decision to treat one's own body as home. They are short, illustrated, and meant to be read as a sequence rather than as separate lyrics.",
  "The Forty Rules of Love":
    "This is a novel, not a book of verse. Ella Rubinstein, an unhappy American housewife, begins reading a manuscript about Rumi and Shams of Tabriz and starts a correspondence with its author. The novel alternates her suburban life with the thirteenth-century story of the poet and the wandering dervish who upended it.",
  "The Prophet":
    "Kahlil Gibran's book of prose poems, not a novel about a mystic. Before Almustafa leaves the city of Orphalese, the people ask him for talks on love, work, children, pain, and death, and he answers. The chapters are short enough to read as speeches, and they have been treated for a century as advice rather than as plot.",
  "Steve Jobs":
    "Walter Isaacson's biography, written with Jobs's cooperation and with access to the people he admired and the people he wounded. It follows him from a California childhood through Apple, the years in exile, Pixar, and the return, and it does not separate the products from the way he treated the teams that made them. The portrait is of a man who believed taste was a moral position and often used that belief as a weapon.",
  "The Diary of a Young Girl":
    "Anne Frank's diary, kept in the secret annex in Amsterdam where her family hid from the Nazis from 1942 until they were found. She writes about the people in the rooms, her mother, her changing body, and the person she is trying to become, often with a sharpness that the hiding cannot dull. The book ends when the diary does, at the arrest, and the reader has to bring the rest of the history to the last page.",
  "The Rugmaker of Mazar-e-Sharif":
    "Najaf Mazari's memoir of a boyhood in Afghanistan, a life as a rugmaker, and the flight from the Taliban that eventually brought him to Australia. He tells the story of learning a craft that is also a language of pattern and patience, and of a refugee system that did not know what to do with either. The book is an account of making a life again in a country that began as a detention center.",
  "In My Mother's Footsteps":
    "Mona Hajjar Halaby, raised in the diaspora, returns to Jerusalem and walks the city her mother had to leave. The memoir is a daughter's attempt to match family stories to streets, checkpoints, and the neighbors who remained. It is about Palestinian memory carried by someone who did not live the original departure and cannot visit it as a tourist.",
  "Before the Coffee Gets Cold":
    "In a small Tokyo café, customers may return to a moment in the past if they sit in one particular chair and finish their coffee before it cools. The rules are strict: you cannot change the present, and you cannot leave the seat. Four visitors try anyway, each of them hoping that a conversation they failed to have might still be worth having.",
  "Days at the Morisaki Bookshop":
    "Takako loses her job and her boyfriend in the same blow and hides in her uncle's used bookshop in Jimbocho. She sleeps among the stacks, resists reading, and slowly begins to pick up the books and the regulars. The novel is a quiet story about a young woman coming back to life in a shop that has been doing the same work for a long time.",
  "I Want to Die but I Want to Eat Tteokbokki":
    "Baek Se-hee's record of her sessions with a psychiatrist, written from the notes she kept afterward. She describes a depression that does not cancel out ordinary appetites: she wants to die, and she also wants to eat tteokbokki, and both sentences are true on the same day. The book is a memoir of treatment, self-observation, and the awkward work of saying these things out loud.",
  "Putting the Power of Your Subconscious Mind to Work":
    "Joseph Murphy's practical book on using the ideas in The Power of Your Subconscious Mind in ordinary work: habits, money, imagination, and the sentences a person repeats to themselves. It belongs to the New Thought tradition and treats the mind as something that can be aimed. The shelf keeps it as a self-help book, not as a novel.",
  "The Artist's Way":
    "Julia Cameron's twelve-week course for people who have stopped making things. The method is concrete: morning pages, a weekly walk alone, and a series of tasks meant to loosen the grip of perfection and other people's opinions. It is a workbook as much as an essay, and it asks the reader to do the assignments rather than agree with them.",
  "Are Men Obsolete?":
    "The list said Camila Paglia. The book is a public debate between Camille Paglia and Caitlin Moran, two essays answering the question in the title and then answering each other. One argues from a long view of sex, art, and danger. The other argues from the daily politics of feminism now. It is an argument, not a verdict.",
  "Urdu Dictionary":
    "A language dictionary, kept for looking a word up rather than for reading through. It sits with the other books that are tools: no plot, no narrator, and a different kind of use. The shelf treats it as part of the collection because it is in the room and it gets opened.",
  "University publication magazine":
    "A student magazine from a university press run, more pamphlet than book. It is here because it was kept, not because it belongs to a genre. The open page can only describe it as an academic publication, a record of whatever issue this copy happens to be.",
};

export function synopsisFor(title: string, copy: number): string {
  const text = SYNOPSES[title] ?? `${title} is on this shelf with the rest of the collection.`;
  if (copy < 2) return text;
  return `${text} This is the second copy.`;
}
