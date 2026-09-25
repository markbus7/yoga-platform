// Nederlandse teksten voor routines, het 30-dagenplan, de gids, de lenigheidstest,
// video's, lichaamsdelen en mijlpalen. Gekoppeld aan de ids in src/js/data/.

export const ROUTINES_NL = {
  wakeup: { name: 'Soepel wakker', tagline: 'Maak elk gewricht los voordat de dag begint', about: 'Rustige bewegende stretches van je nek tot je heupen. Maakt je wakker zonder dat het een workout is.' },
  gravity: { name: 'Zwaarte\u00ADkracht', tagline: 'Lange, rustige houdingen waarin je gewicht het werk doet', about: 'De kern van je oefening. Kom in elke houding, stop dan met werken en laat de zwaarte\u00ADkracht je rekken terwijl je langzaam ademt.' },
  gravitybasics: { name: 'Zwaarte\u00ADkracht basis', tagline: 'Een korte eerste kennis\u00ADmaking met zwaarte\u00ADkracht\u00ADhoudingen', about: 'De vriendelijkste zwaarte\u00ADkracht\u00ADhoudingen met kortere tijden. Een goed begin in week één.' },
  desk: { name: 'Bureaupauze', tagline: 'Vijf minuten op je stoel, geen mat nodig', about: 'Voor als je al uren zit. Nek, schouders, rug en heupen, allemaal vanaf een stoel.' },
  neck: { name: 'Nek & schouders', tagline: 'Waar stress zich het eerst verstopt', about: 'Begint met rustig ademen en maakt daarna je nek, schouders en bovenrug los.' },
  hipsback: { name: 'Heupen & onderrug', tagline: 'Maak een dag zitten ongedaan', about: 'Rustige bewegingen voor je onderrug, en daarna houdingen die de heupen openen die door zitten stijf worden.' },
  legs: { name: 'Benen & hamstrings', tagline: 'Kuiten, dijen en de achterkant van je benen', about: 'Eerst staande stretches, dan houdingen op de vloer voor de achterkant van je benen. Je knieën blijven de hele tijd zacht.' },
  upper: { name: 'Bovenlijf ontspannen', tagline: 'Zwaarte\u00ADkracht\u00ADhoudingen voor een gebogen rug', about: 'Lange houdingen voor je borst, schouders en bovenrug. De borstopener op blokken is de ster.' },
  hipopener: { name: 'Diepe heup\u00ADontspanning', tagline: 'Langere houdingen voor koppige heupen', about: 'Gebruikt al je blokken. Bewaar deze voor als je een week of twee aan het oefenen bent.' },
  winddown: { name: 'Tot rust komen', tagline: 'Alles vertragen voor het slapen', about: 'Ademhaling en rustgevende houdingen om je lichaam en je hoofd uit te zetten. Doe het gerust in je pyjama.' },
  deep: { name: 'Heel je lijf, diep', tagline: 'De lange weekend\u00ADsessie', about: 'Alles, van top tot teen, met lange houdingen. Zet wat muziek op en neem je tijd.' },
  breathe: { name: 'Even ademen', tagline: 'Drie minuten om rustig te worden, waar je ook bent', about: 'Geen stretches, alleen ademen. Gebruik het als de stress oploopt, voor een vergadering, of als je niet kunt slapen.' },
};

export const STYLES_NL = {
  moving: 'Bewegende stretches',
  gravity: 'Zwaarte\u00ADkracht\u00ADhoudingen',
  mix: 'Bewegen + houdingen',
  breath: 'Ademhaling',
};

export const PROGRAM_NL = {
  about: 'Dertig dagen, één korte sessie per dag. In week één leer je de bewegingen, daarna worden de houdingen langzaam langer.',
  weeks: [
    { name: 'Wakker worden', about: 'Korte sessies om de bewegingen te leren. Blijf op een 4 op 10.' },
    { name: 'Losser worden', about: 'Standaard houdtijden. De meeste houdingen ken je nu.' },
    { name: 'Loslaten', about: 'De houdingen worden iets langer. Gebruik blokken om ontspannen te blijven.' },
    { name: 'Los', about: 'Je langste houdingen. Merk op hoe anders ze voelen dan in week één.' },
  ],
  tips: [
    ['Ga tot een 4 op 10', 'Rek tot je een duidelijke trek voelt, ongeveer een 4 op een schaal van 10. Nooit pijn. Stijve spieren laten los als ze zich veilig voelen, niet als je ze forceert.'],
    ['De zwaarte\u00ADkracht doet het werk', 'In een zwaarte\u00ADkrachthouding kom je in positie en dan stop je met werken. Je lichaamsgewicht doet het rekken terwijl jij ademt. Hetzelfde idee als de gravity-cursus die je eerder deed.'],
    ['Je adem is de uitknop', 'Langer uitademen dan inademen vertraagt je hart en vertelt je lichaam dat het mag ontspannen. Gebruik het in elke houding.'],
    ['Gebruik je blokken', 'Blokken brengen de vloer dichter bij je. Het is geen valsspelen. Je kunt er ontspannen mee in een houding blijven in plaats van je in te spannen om hem vast te houden.'],
    ['Kort en dagelijks wint van lang en af en toe', 'Tien minuten per dag verandert meer dan een uur per week. Je bouwt net zo goed aan een gewoonte als aan lenigheid.'],
    ['Buig je knieën', 'Stijve hamstrings trekken aan je onderrug. Als je je knieën buigt in voorover\u00ADbuigingen, kan je rug eerst loslaten. Gestrekte benen komen later.'],
    ['Rust hoort erbij', 'Een beetje gevoelig na nieuwe stretches is normaal. Scherpe, stekende of aanhoudende pijn niet. Sla die houding dan een tijdje over.'],
    ['Blijf iets langer', 'De eerste 30 seconden van een houding zijn je spieren op hun hoede. Daarna beginnen ze los te laten. Daarom duren zwaarte\u00ADkracht\u00ADhoudingen een minuut of langer.'],
    ["'s Ochtends bewegen, 's avonds houdingen", "Bewegende stretches maken je wakker. Zwaarte\u00ADkracht\u00ADhoudingen maken je rustig. Doe als het kan 's ochtends een korte sessie en 's avonds een langere."],
    ['Maak het voorover hangen ongedaan', 'Schermen en telefoons trekken je schouders de hele dag naar voren. Borstopeners en houdingen voor je bovenrug zetten ze terug waar ze horen.'],
    ['Zitten maakt de voorkant van je heupen stijf', 'Uren op een stoel verkorten de spieren aan de voorkant van je heupen, en die trekken aan je onderrug. De lage uitval en de sfinx maken dat ongedaan.'],
    ['Kaak, schouders, buik', 'Stress verstopt zich op drie plekken. Check ze in elke houding: ontspan je kaak, laat je schouders zakken, maak je buik zacht.'],
    ['Een beetje trillen mag', 'Kleine trillingen in een houding zijn je spieren die loslaten. Adem door en doe iets minder als het intens wordt.'],
    ['Merk op, oordeel niet', 'Op sommige dagen voel je je stijver dan op andere. Slaap, stress en hoeveel je hebt gezeten maken allemaal verschil. Kom gewoon opdagen.'],
    ['Halverwege: bekijk je vooruitgang', 'Twee weken onderweg. Doe vandaag opnieuw de lenigheids\u00ADtest en vergelijk hem met dag één.'],
    ['Heupen houden veel vast', 'Diepe heuphoudingen kunnen je onrustig of emotioneel maken. Dat is normaal. Blijf bij je adem en gebruik meer steun.'],
    ['Leg je telefoon weg', 'Leg je telefoon buiten handbereik tijdens de houdingen. De stem en het belletje vertellen je wanneer je verder moet.'],
    ['Adem naar de stijve plek', 'Stel je voor dat elke uitademing naar de plek stroomt die vastzit. Het klinkt vreemd, maar het werkt.'],
    ['Warm gaat makkelijker', 'Rekken na een douche of een wandeling voelt makkelijker. Je spieren en pezen zijn dan warmer en meegaander.'],
    ['Stress zit in je nek', 'Merk je dat je schouders overdag omhoog kruipen? Doe dan de Bureaupauze of twee minuten ademen.'],
    ['Beter slapen', 'Veel mensen vallen sneller in slaap na een paar minuten benen tegen de muur en rustig ademen.'],
    ['De langste houdingen tot nu toe', 'Week vier. De houdingen zijn ongeveer 30% langer dan standaard. Gebruik blokken en kussens, zodat je helemaal kunt ontspannen.'],
    ['Wandel en drink water', 'Elke dag wandelen en genoeg drinken houden je soepeler tussen de sessies door.'],
    ['Check je bureau', 'Scherm op ooghoogte, voeten plat op de vloer, en sta elke 45 minuten even op. Voorkomen is makkelijker dan loslaten.'],
    ['Wees lief voor je knieën', 'Leg altijd iets zachts onder je knieën. Een opgevouwen handdoek of het uiteinde van je mat maakt knielende houdingen veel prettiger.'],
    ['Je grens verschuift', 'Het punt waar je een 4 op 10 voelt, verschuift in de loop van de weken. Volg het rustig, jaag het nooit na.'],
    ['Stel je eigen sessie samen', 'Zit één plek vast? Gebruik dan "Stel mijn sessie samen" op het scherm Vandaag om een sessie speciaal daarvoor te maken.'],
    ['Eén minuut telt', 'Op een drukke dag is één houding beter dan niets. Eén keer de kindhouding houdt de gewoonte levend.'],
    ['Bijna klaar', 'Morgen is dag 30. Merk op hoe je lichaam voelt vergeleken met dag één.'],
    ['Je zit niet meer vast', 'Doe de laatste lenigheids\u00ADtest en vergelijk. Ga daarna door met de routines die je het fijnst vond.'],
  ],
};

export const GUIDE_NL = [
  {
    id: 'what',
    title: 'Is dit yoga?',
    body: ['Gedeeltelijk. Unstuck combineert drie eenvoudige dingen, en je hoeft er niets van yoga voor te weten.'],
    list: [
      ['Bewegende stretches', 'Langzame bewegingen die je gewrichten wakker maken: schouders rollen, kat-koe, heupcirkels. Fijn in de ochtend of als je stijf bent van het zitten.'],
      ['Zwaarte\u00ADkracht\u00ADhoudingen', 'Lange, passieve stretches van één tot drie minuten. Je komt in positie, stopt dan met werken en laat je lichaamsgewicht het rekken doen. De gravity-cursus die je eerder deed werkt ook zo. In yoga heet deze stijl Yin.'],
      ['Ademhaling', 'Langzaam ademen met een langere uitademing. Het is de snelste manier om de scherpe randjes van stress af te halen, en het maakt elke houding effectiever.'],
    ],
    after: 'Elke oefening heeft een gewone Nederlandse naam. De yoganaam staat er klein onder, voor als je hem ooit wilt opzoeken.',
  },
  {
    id: 'rules',
    title: 'De drie regels',
    list: [
      ['Ga tot een 4 op 10', 'Rek tot je een duidelijke trek voelt en blijf daar. Het hoort te voelen als een fijne, doffe spanning. Scherp, brandend, knellend, tintelend of verdoofd betekent: kom eruit.'],
      ['Adem langer uit dan in', 'Bijvoorbeeld 4 tellen in, 6 tellen uit. Een lange uitademing vertelt je lichaam dat het veilig is om te ontspannen.'],
      ['Laat los', 'Zodra je in positie bent, stop je met jezelf ophouden. Denk aan een slappe sliert spaghetti. Ontspan je kaak, schouders en buik.'],
    ],
  },
  {
    id: 'why',
    title: 'Waarom dit helpt als je vastzit',
    body: [
      'Stress houdt je spieren de hele dag een beetje aan: je schouders kruipen omhoog, je kaak klemt, je ademhaling wordt oppervlakkig. Lang zitten doet de rest: de voorkant van je heupen wordt stijf en je bovenrug wordt rond.',
      'Langzaam ademen en makkelijke, lange houdingen verlagen die achtergrondspanning. Door het dagelijks te doen leert je zenuwstelsel ook dat deze bewegingen veilig zijn. Dat is een groot deel van de reden dat mensen zich binnen een paar weken losser voelen, ruim voordat de weefsels zelf veranderen.',
      'Veel mensen voelen zich binnen een paar weken minder stijf. Grotere veranderingen in hoe ver je kunt reiken duren meestal één tot twee maanden van regelmatig oefenen. Met de lenigheids\u00ADtest zie je het gebeuren.',
    ],
  },
  {
    id: 'blocks',
    title: 'Je blokken gebruiken',
    body: ['Een yogablok heeft drie hoogtes: plat (laagst), op zijn zijkant (midden) en rechtop op zijn kop (hoogst). Je hebt er vier, genoeg voor elke houding in Unstuck.'],
    list: [
      ['Onder je billen', 'Op de rand van een blok zitten kantelt je bekken naar voren, zodat je rug lang kan blijven. De vlinder, zittende voorover\u00ADbuigingen en kleermakerszit worden er veel comfortabeler door.'],
      ['Onder je handen', 'Brengt de vloer dichterbij in uitvallen, halve spagaten en voorover\u00ADbuigingen.'],
      ['Onder je knieën', 'Laat je benen rusten in de vlinder en de liggende vlinder, zodat je kunt ontspannen in plaats van je in te spannen.'],
      ['Onder je rug en hoofd', 'Twee blokken maken een borstopener die urenlang voorover hangen ongedaan maakt.'],
      ['Onder je voorhoofd', 'Maakt de kindhouding en het smeltend hart rustgevend.'],
    ],
    after: 'Blokken gebruiken is geen valsspelen. Een houding waarin je kunt ontspannen werkt beter dan een diepere waartegen je moet vechten.',
  },
  {
    id: 'plan',
    title: 'Jouw plan',
    body: ['Je vertelde dat je overal vastzit, door stress en weinig bewegen, dat je nog niet lenig bent, en dat je het fijn vond hoe de gravity-cursus de zwaarte\u00ADkracht het werk liet doen. Daarom leunt je plan op zwaarte\u00ADkracht\u00ADhoudingen, met korte bewegende sessies om je lichaam wakker te maken.'],
    list: [
      ['Elke dag 10 tot 25 minuten', 'Volg Unstuck 30. Elke dag is voor je gekozen en de houdingen worden in vier weken langzaam langer.'],
      ["'s Avonds is het best voor zwaarte\u00ADkracht\u00ADhoudingen", "Ze maken je rustig en helpen je slapen. Doe als het kan 's ochtends een korte Soepel wakker of tijdens je werk een Bureaupauze."],
      ['Elke twee weken een lenigheids\u00ADtest', 'Vijf korte zelftests. Doe er een op dag 1, dag 15 en dag 30.'],
      ['Lang en stijf?', 'Met 180 cm heb je lange benen, en de achterkant van je benen is meestal het stijfste deel. Ga bij elke zittende houding op een blok zitten en houd je knieën gebogen in voorover\u00ADbuigingen.'],
    ],
  },
  {
    id: 'safety',
    title: 'Wanneer je stopt',
    body: [
      'Kom meteen uit een houding als je scherpe of schietende pijn, een doof gevoel, tintelingen of duizeligheid voelt. Een beetje spierpijn de volgende dag is normaal. Pijn die blijft niet.',
      'Overleg eerst met een huisarts of fysiotherapeut als je een recente blessure of operatie hebt, aanhoudende rug- of gewrichtspijn, of een medische aandoening die invloed heeft op bewegen. Unstuck is een oefengids, geen medisch advies.',
    ],
  },
];

export const TESTS_NL = {
  fold: {
    name: 'Voorover\u00ADbuigen',
    how: 'Sta met je voeten tegen elkaar en je knieën gestrekt maar niet op slot. Adem uit en laat je bovenlichaam naar voren hangen. Niet veren. Tot waar komen je vingertoppen?',
    levels: ['Boven mijn knieën', 'Mijn knieën', 'Halverwege mijn schenen', 'Mijn enkels', 'Mijn tenen of de vloer', 'Handpalmen plat op de vloer'],
  },
  shoulder: {
    name: 'Ruggen\u00ADkrabber',
    how: 'Reik met één hand over je schouder naar beneden langs je rug. Reik met de andere hand achter je langs omhoog. Probeer beide kanten en kies de moeilijkste.',
    levels: ['Handen ver uit elkaar (meer dan een handlengte)', 'Ongeveer een handlengte uit elkaar', 'Vingers raken elkaar bijna', 'Vingertoppen raken elkaar', 'Vingers overlappen'],
  },
  hips: {
    name: 'Vlinder\u00ADknieën',
    how: 'Zit rechtop met je voetzolen tegen elkaar, hielen ongeveer een handlengte van je lichaam. Ontspan je benen. Waar rusten je knieën?',
    levels: ['Ruim boven mijn heupen', 'Ongeveer op heuphoogte', 'Halverwege de vloer', 'Een vuist boven de vloer', 'Op de vloer'],
  },
  neck: {
    name: 'Nek draaien',
    how: 'Zit rechtop en draai je hoofd langzaam om over één schouder te kijken, en dan over de andere. Kies de moeilijkste kant. Hoe ver komt je kin?',
    levels: ['Minder dan halverwege mijn schouder', 'Ongeveer halverwege', 'Bijna boven mijn schouder', 'Precies boven mijn schouder'],
  },
  squat: {
    name: 'Diepe hurkzit',
    how: 'Voeten iets breder dan je heupen, tenen een beetje naar buiten. Zak zo diep als comfortabel kan. Houd je ergens aan vast als dat nodig is.',
    levels: ['Ik kom niet verder dan halverwege', 'Diep, maar alleen met mijn hielen omhoog', 'Diep met mijn hielen op een blok', 'Diep met hielen omlaag, terwijl ik me vasthoud', 'Diep met hielen omlaag, zonder handen, 30 seconden lang'],
  },
};

export const VIDEOS_NL = {
  'ywa-beginners': { focus: 'Hele lichaam', why: 'De klassieke eerste les. Rustig, vriendelijk en legt de basis uit.' },
  'tm-beginner-v3': { focus: 'Hele lichaam', why: 'Gemaakt voor stijve mensen. Eenvoudige stretches met duidelijke houdtijden.' },
  'tm-beginner-v4': { focus: 'Hele lichaam', why: 'Een stapje verder dan de versie van 15 minuten. Fijn voor in het weekend.' },
  'yin-beginner': { focus: 'Zwaarte\u00ADkracht\u00ADhoudingen', why: 'Lange, passieve houdingen, hetzelfde idee als gravity-houdingen. Voor een rustige avond.' },
  'gravity-hips': { focus: 'Heupen', why: 'Passieve houdingen in gravity-stijl voor stijve heupen.' },
  'gravity-hams': { focus: 'Achterkant benen', why: 'Passieve houdingen in gravity-stijl voor de achterkant van je benen.' },
  'ywa-neck': { focus: 'Nek & schouders', why: 'Korter dan 20 minuten, op de vloer of op een stoel.' },
  'ywa-hipsback': { focus: 'Heupen & onderrug', why: 'Rustig tempo en geschikt voor beginners.' },
  'ywa-lowerback': { focus: 'Onderrug', why: 'Werkt aan alles wat bijdraagt aan een pijnlijke onderrug.' },
  'ywa-desk': { focus: 'Bureau', why: 'Op een stoel, voor een pauze tijdens je werkdag.' },
  'ywa-stress7': { focus: 'Stress', why: 'Kort en effectief als je hoofd vol zit.' },
  'ywa-bedtime': { focus: 'Slapen', why: 'Grotendeels zittend en liggend. Gemaakt voor vlak voor het slapengaan.' },
  'nl-yin-leonie': { focus: 'Zwaarte\u00ADkracht\u00ADhoudingen', why: 'Een rustige yinles die je zenuwstelsel kalmeert.' },
  'nl-hwy-beginners': { focus: 'Hele lichaam', why: 'Een korte, vriendelijke eerste les.' },
  'nl-hwy-yin': { focus: 'Zwaarte\u00ADkracht\u00ADhoudingen', why: 'Yin stap voor stap uitgelegd voor beginners.' },
  'nl-yin-neck': { focus: 'Nek & schouders', why: 'Een kwartier lange houdingen voor een gespannen nek en bovenrug.' },
  'nl-neck-15': { focus: 'Nek & schouders', why: 'Een les van een kwartier tegen spanning in nek en schouders.' },
  'nl-stretch-vera': { focus: 'Hele lichaam', why: 'Rustige stretches om je hele lichaam los te maken.' },
  'nl-stretch-optima': { focus: 'Hele lichaam', why: 'Een stretchroutine voor je hele lichaam van ongeveer een kwartier.' },
  'nl-lowerback-marco': { focus: 'Onderrug', why: 'Lange, rustige houdingen voor een stijve onderrug.' },
  'nl-nidra': { focus: 'Slapen', why: 'Een begeleide ontspanning terwijl je ligt. Fijn voor het slapengaan.' },
};

export const LEARN_NL = [{ title: 'De fysiologische zucht, uitgelegd' }];

export const AREAS_NL = {
  neck: 'Nek',
  shoulders: 'Schouders',
  upperBack: 'Bovenrug',
  chest: 'Borst',
  arms: 'Polsen & onderarmen',
  sides: 'Zijkanten',
  lowerBack: 'Onderrug',
  hips: 'Heupen',
  glutes: 'Billen',
  hamstrings: 'Achterkant benen',
  quads: 'Voorkant dijen',
  calves: 'Kuiten & enkels',
};

export const CARE_NL = {
  knees: 'Knieën',
  lowerBack: 'Onderrug',
  neck: 'Nek',
  wrists: 'Polsen',
  shoulders: 'Schouders',
};

export const POSITIONS_NL = {
  standing: 'Staand',
  chair: 'Op een stoel',
  allfours: 'Op handen en knieën',
  kneeling: 'Knielend',
  seated: 'Zittend op de vloer',
  back: 'Liggend op je rug',
  belly: 'Liggend op je buik',
};

export const BADGES_NL = {
  first: { name: 'Eerste stretch', desc: 'Rond je eerste sessie af' },
  streak3: { name: 'Drie op rij', desc: 'Oefen drie dagen op rij' },
  streak7: { name: 'Een hele week', desc: 'Oefen zeven dagen op rij' },
  streak14: { name: 'Twee weken sterk', desc: 'Oefen 14 dagen op rij' },
  streak30: { name: 'Dertig op rij', desc: 'Oefen 30 dagen op rij' },
  sessions10: { name: 'Tien sessies', desc: 'Rond 10 sessies af' },
  sessions50: { name: 'Vijftig sessies', desc: 'Rond 50 sessies af' },
  hour1: { name: 'Eerste uur', desc: 'In totaal 60 minuten geoefend' },
  hour10: { name: 'Tien uur', desc: 'In totaal 600 minuten geoefend' },
  gravity5: { name: 'Zwaarte\u00ADkracht\u00ADfan', desc: 'Vijf sessies met vooral zwaarte\u00ADkracht\u00ADhoudingen' },
  calm: { name: 'Spannings\u00ADtemmer', desc: 'Laat je spanning in één sessie 3 punten of meer dalen' },
  check1: { name: 'Beginpunt gezet', desc: 'Doe je eerste lenigheids\u00ADtest' },
  looser: { name: 'Meetbaar soepeler', desc: 'Ga vooruit op een van de lenigheids\u00ADtests' },
  week1: { name: 'Week één klaar', desc: 'Rond dag 1 tot en met 7 van Unstuck 30 af' },
  program: { name: 'Unstuck', desc: 'Rond alle 30 dagen van Unstuck 30 af' },
};

export const HOLDS_NL = [
  { name: 'Kort', about: 'Kortere houdingen voor drukke dagen' },
  { name: 'Standaard', about: 'De standaardtijden' },
  { name: 'Lang', about: 'Langere zwaarte\u00ADkracht\u00ADhoudingen' },
];
