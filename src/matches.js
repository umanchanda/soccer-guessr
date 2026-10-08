// Each match is one puzzle. `home` is the team listed first in the official result.
// Goals are credited to the player who scored them; own goals set `ownGoal: true`
// and are listed under the team that benefited.
// Lineups, scores and managers are taken from each match's Wikipedia article
// (Bundesliga 2022 lineups from bundesliga.com).

export const COMPETITION_TYPES = [
  { id: 'domestic-league', label: 'Domestic league', example: 'Premier League, La Liga, Bundesliga' },
  { id: 'continental-club', label: 'Continental club competition', example: 'Champions League, Copa Libertadores' },
  { id: 'continental-trophy', label: 'Continental international trophy', example: 'Euros, Copa América, AFCON' },
  { id: 'world-cup', label: 'World Cup', example: 'FIFA World Cup' },
]

export const MATCHES = [
  {
    id: 'wc-2014-final',
    year: 2014,
    competition: 'world-cup',
    competitionName: '2014 FIFA World Cup final',
    venue: 'Maracanã, Rio de Janeiro',
    extraTime: true,
    image: {
      src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/C%C3%A1maras_-_Acci%C3%B3n_-_140713-8653-jikatu_%2814479326838%29.jpg/1280px-C%C3%A1maras_-_Acci%C3%B3n_-_140713-8653-jikatu_%2814479326838%29.jpg',
      page: 'https://commons.wikimedia.org/wiki/File:C%C3%A1maras_-_Acci%C3%B3n_-_140713-8653-jikatu_(14479326838).jpg',
      author: 'Jimmy Baikovicius',
      license: 'CC BY-SA 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
    },
    home: {
      name: 'Germany',
      aliases: ['Deutschland'],
      manager: 'Joachim Löw',
      startingXI: ['Manuel Neuer', 'Philipp Lahm', 'Jérôme Boateng', 'Mats Hummels', 'Benedikt Höwedes', 'Bastian Schweinsteiger', 'Christoph Kramer', 'Toni Kroos', 'Mesut Özil', 'Thomas Müller', 'Miroslav Klose'],
    },
    away: {
      name: 'Argentina',
      aliases: [],
      manager: 'Alejandro Sabella',
      startingXI: ['Sergio Romero', 'Pablo Zabaleta', 'Martín Demichelis', 'Ezequiel Garay', 'Marcos Rojo', 'Javier Mascherano', 'Lucas Biglia', 'Enzo Pérez', 'Lionel Messi', 'Ezequiel Lavezzi', 'Gonzalo Higuaín'],
    },
    goals: [
      { team: 'home', player: 'Mario Götze', minute: '113' },
    ],
  },
  {
    id: 'wc-2018-final',
    year: 2018,
    competition: 'world-cup',
    competitionName: '2018 FIFA World Cup final',
    venue: 'Luzhniki Stadium, Moscow',
    image: {
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0a/2018_World_Cup_Final_%282018-07-15%29_02.jpg/1280px-2018_World_Cup_Final_%282018-07-15%29_02.jpg',
      page: 'https://commons.wikimedia.org/wiki/File:2018_World_Cup_Final_(2018-07-15)_02.jpg',
      author: 'Alexey Nikolsky / Press-service of the President of Russia',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    },
    home: {
      name: 'France',
      aliases: [],
      manager: 'Didier Deschamps',
      startingXI: ['Hugo Lloris', 'Benjamin Pavard', 'Raphaël Varane', 'Samuel Umtiti', 'Lucas Hernandez', 'Paul Pogba', "N'Golo Kanté", 'Kylian Mbappé', 'Antoine Griezmann', 'Blaise Matuidi', 'Olivier Giroud'],
    },
    away: {
      name: 'Croatia',
      aliases: ['Hrvatska'],
      manager: 'Zlatko Dalić',
      startingXI: ['Danijel Subašić', 'Šime Vrsaljko', 'Dejan Lovren', 'Domagoj Vida', 'Ivan Strinić', 'Ivan Rakitić', 'Marcelo Brozović', 'Ante Rebić', 'Luka Modrić', 'Ivan Perišić', 'Mario Mandžukić'],
    },
    goals: [
      { team: 'home', player: 'Mario Mandžukić', minute: '18', ownGoal: true },
      { team: 'away', player: 'Ivan Perišić', minute: '28' },
      { team: 'home', player: 'Antoine Griezmann', minute: '38', penalty: true },
      { team: 'home', player: 'Paul Pogba', minute: '59' },
      { team: 'home', player: 'Kylian Mbappé', minute: '65' },
      { team: 'away', player: 'Mario Mandžukić', minute: '69' },
    ],
  },
  {
    id: 'ucl-2018-final',
    year: 2018,
    competition: 'continental-club',
    competitionName: '2018 UEFA Champions League final',
    venue: 'NSC Olimpiyskiy, Kyiv',
    image: {
      src: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/%D0%9C%D0%B0%D1%82%D1%87_%C2%AB%D0%A0%D0%B5%D0%B0%D0%BB%C2%BB_-_%C2%AB%D0%9B%D0%B8%D0%B2%D0%B5%D1%80%D0%BF%D1%83%D0%BB%D1%8C%C2%BB_3-1._26_%D0%BC%D0%B0%D1%8F_2018_%D0%B3%D0%BE%D0%B4%D0%B0_%E2%80%94_873406.jpg',
      page: 'https://commons.wikimedia.org/wiki/File:%D0%9C%D0%B0%D1%82%D1%87_%C2%AB%D0%A0%D0%B5%D0%B0%D0%BB%C2%BB_-_%C2%AB%D0%9B%D0%B8%D0%B2%D0%B5%D1%80%D0%BF%D1%83%D0%BB%D1%8C%C2%BB_3-1._26_%D0%BC%D0%B0%D1%8F_2018_%D0%B3%D0%BE%D0%B4%D0%B0_%E2%80%94_873406.jpg',
      author: 'Olga Shcherbytska',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    },
    home: {
      name: 'Real Madrid',
      aliases: ['Real Madrid CF', 'Real'],
      manager: 'Zinedine Zidane',
      startingXI: ['Keylor Navas', 'Dani Carvajal', 'Raphaël Varane', 'Sergio Ramos', 'Marcelo', 'Casemiro', 'Luka Modrić', 'Toni Kroos', 'Isco', 'Karim Benzema', 'Cristiano Ronaldo'],
    },
    away: {
      name: 'Liverpool',
      aliases: ['Liverpool FC'],
      manager: 'Jürgen Klopp',
      startingXI: ['Loris Karius', 'Trent Alexander-Arnold', 'Dejan Lovren', 'Virgil van Dijk', 'Andy Robertson', 'James Milner', 'Jordan Henderson', 'Georginio Wijnaldum', 'Mohamed Salah', 'Roberto Firmino', 'Sadio Mané'],
    },
    goals: [
      { team: 'home', player: 'Karim Benzema', minute: '51' },
      { team: 'away', player: 'Sadio Mané', minute: '55' },
      { team: 'home', player: 'Gareth Bale', minute: '63' },
      { team: 'home', player: 'Gareth Bale', minute: '83' },
    ],
  },
  {
    id: 'copa-2019-final',
    year: 2019,
    competition: 'continental-trophy',
    competitionName: '2019 Copa América final',
    venue: 'Maracanã, Rio de Janeiro',
    image: {
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a7/2019_Final_da_Copa_Am%C3%A9rica_2019_-_48225121666.jpg/1280px-2019_Final_da_Copa_Am%C3%A9rica_2019_-_48225121666.jpg',
      page: 'https://commons.wikimedia.org/wiki/File:2019_Final_da_Copa_Am%C3%A9rica_2019_-_48225121666.jpg',
      author: 'Palácio do Planalto',
      license: 'CC BY 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    },
    home: {
      name: 'Brazil',
      aliases: ['Brasil'],
      manager: 'Tite',
      startingXI: ['Alisson', 'Dani Alves', 'Marquinhos', 'Thiago Silva', 'Alex Sandro', 'Arthur', 'Casemiro', 'Gabriel Jesus', 'Philippe Coutinho', 'Everton', 'Roberto Firmino'],
    },
    away: {
      name: 'Peru',
      aliases: ['Perú'],
      manager: 'Ricardo Gareca',
      startingXI: ['Pedro Gallese', 'Luis Advíncula', 'Carlos Zambrano', 'Luis Abram', 'Miguel Trauco', 'Renato Tapia', 'Yoshimar Yotún', 'Edison Flores', 'Christian Cueva', 'André Carrillo', 'Paolo Guerrero'],
    },
    goals: [
      { team: 'home', player: 'Everton', minute: '15' },
      { team: 'away', player: 'Paolo Guerrero', minute: '44', penalty: true },
      { team: 'home', player: 'Gabriel Jesus', minute: '45+3' },
      { team: 'home', player: 'Richarlison', minute: '90', penalty: true },
    ],
  },
  {
    id: 'bundesliga-2022-klassiker',
    year: 2022,
    competition: 'domestic-league',
    competitionName: 'Bundesliga 2021–22, matchday 31',
    venue: 'Allianz Arena, Munich',
    image: {
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1c/Fu%C3%9Fball-Bundesliga_2021-2022_-_FC_Bayern_M%C3%BCnchen_vs_Borussia_Dortmund_001.jpg/1280px-Fu%C3%9Fball-Bundesliga_2021-2022_-_FC_Bayern_M%C3%BCnchen_vs_Borussia_Dortmund_001.jpg',
      page: 'https://commons.wikimedia.org/wiki/File:Fu%C3%9Fball-Bundesliga_2021-2022_-_FC_Bayern_M%C3%BCnchen_vs_Borussia_Dortmund_001.jpg',
      author: 'UNTERMVIERENBERGE-2',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    },
    home: {
      name: 'Bayern Munich',
      aliases: ['Bayern München', 'FC Bayern', 'Bayern', 'FC Bayern München'],
      manager: 'Julian Nagelsmann',
      startingXI: ['Manuel Neuer', 'Benjamin Pavard', 'Dayot Upamecano', 'Lucas Hernández', 'Alphonso Davies', 'Joshua Kimmich', 'Leon Goretzka', 'Serge Gnabry', 'Thomas Müller', 'Kingsley Coman', 'Robert Lewandowski'],
    },
    away: {
      name: 'Borussia Dortmund',
      aliases: ['Dortmund', 'BVB'],
      manager: 'Marco Rose',
      startingXI: ['Marwin Hitz', 'Marius Wolf', 'Manuel Akanji', 'Dan-Axel Zagadou', 'Raphaël Guerreiro', 'Emre Can', 'Jude Bellingham', 'Reinier', 'Julian Brandt', 'Marco Reus', 'Erling Haaland'],
    },
    goals: [
      { team: 'home', player: 'Serge Gnabry', minute: '15' },
      { team: 'home', player: 'Robert Lewandowski', minute: '34' },
      { team: 'away', player: 'Emre Can', minute: '52', penalty: true },
      { team: 'home', player: 'Jamal Musiala', minute: '83' },
    ],
  },
  {
    id: 'pl-2012-city-qpr',
    year: 2012,
    competition: 'domestic-league',
    competitionName: 'Premier League 2011–12, final day',
    venue: 'City of Manchester Stadium, Manchester',
    image: {
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Manchester_City_pitch_invasion.JPG/1280px-Manchester_City_pitch_invasion.JPG',
      page: 'https://commons.wikimedia.org/wiki/File:Manchester_City_pitch_invasion.JPG',
      author: 'Oldelpaso',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    },
    home: {
      name: 'Manchester City',
      aliases: ['Man City', 'Manchester City FC', 'City'],
      manager: 'Roberto Mancini',
      startingXI: ['Joe Hart', 'Pablo Zabaleta', 'Vincent Kompany', 'Joleon Lescott', 'Gaël Clichy', 'Samir Nasri', 'Yaya Touré', 'Gareth Barry', 'David Silva', 'Carlos Tevez', 'Sergio Agüero'],
    },
    away: {
      name: 'Queens Park Rangers',
      aliases: ['QPR', 'Queens Park Rangers FC'],
      manager: 'Mark Hughes',
      startingXI: ['Paddy Kenny', 'Nedum Onuoha', 'Anton Ferdinand', 'Clint Hill', 'Taye Taiwo', 'Jamie Mackie', 'Shaun Derry', 'Joey Barton', 'Shaun Wright-Phillips', 'Djibril Cissé', 'Bobby Zamora'],
    },
    goals: [
      { team: 'home', player: 'Pablo Zabaleta', minute: '39' },
      { team: 'away', player: 'Djibril Cissé', minute: '48' },
      { team: 'away', player: 'Jamie Mackie', minute: '66' },
      { team: 'home', player: 'Edin Džeko', minute: '90+2' },
      { team: 'home', player: 'Sergio Agüero', minute: '90+4' },
    ],
  },
  {
    id: 'ucl-2012-final',
    year: 2012,
    competition: 'continental-club',
    competitionName: '2012 UEFA Champions League final',
    venue: 'Allianz Arena, Munich',
    extraTime: true,
    penalties: { home: 3, away: 4 },
    image: {
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/Bosingwa_Ribery.jpg/960px-Bosingwa_Ribery.jpg',
      page: 'https://commons.wikimedia.org/wiki/File:Bosingwa_Ribery.jpg',
      author: 'rayand',
      license: 'CC BY 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    },
    home: {
      name: 'Bayern Munich',
      aliases: ['Bayern München', 'FC Bayern', 'Bayern', 'FC Bayern München'],
      manager: 'Jupp Heynckes',
      startingXI: ['Manuel Neuer', 'Philipp Lahm', 'Jérôme Boateng', 'Anatoliy Tymoshchuk', 'Diego Contento', 'Bastian Schweinsteiger', 'Toni Kroos', 'Arjen Robben', 'Thomas Müller', 'Franck Ribéry', 'Mario Gómez'],
    },
    away: {
      name: 'Chelsea',
      aliases: ['Chelsea FC'],
      manager: 'Roberto Di Matteo',
      startingXI: ['Petr Čech', 'José Bosingwa', 'David Luiz', 'Gary Cahill', 'Ashley Cole', 'Mikel John Obi', 'Frank Lampard', 'Salomon Kalou', 'Juan Mata', 'Ryan Bertrand', 'Didier Drogba'],
    },
    goals: [
      { team: 'home', player: 'Thomas Müller', minute: '83' },
      { team: 'away', player: 'Didier Drogba', minute: '88' },
    ],
  },
  {
    id: 'euro-2012-final',
    year: 2012,
    competition: 'continental-trophy',
    competitionName: 'UEFA Euro 2012 final',
    venue: 'Olympic Stadium, Kyiv',
    image: {
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c2/%D0%A4%D1%96%D0%BD%D0%B0%D0%BB_%D0%84%D0%B2%D1%80%D0%BE-2012._1-%D0%B9_%D1%82%D0%B0%D0%B9%D0%BC.JPG/1280px-%D0%A4%D1%96%D0%BD%D0%B0%D0%BB_%D0%84%D0%B2%D1%80%D0%BE-2012._1-%D0%B9_%D1%82%D0%B0%D0%B9%D0%BC.JPG',
      page: 'https://commons.wikimedia.org/wiki/File:%D0%A4%D1%96%D0%BD%D0%B0%D0%BB_%D0%84%D0%B2%D1%80%D0%BE-2012._1-%D0%B9_%D1%82%D0%B0%D0%B9%D0%BC.JPG',
      author: 'Ahonc',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    },
    home: {
      name: 'Spain',
      aliases: ['España'],
      manager: 'Vicente del Bosque',
      startingXI: ['Iker Casillas', 'Álvaro Arbeloa', 'Gerard Piqué', 'Sergio Ramos', 'Jordi Alba', 'Sergio Busquets', 'Xavi', 'Xabi Alonso', 'Cesc Fàbregas', 'David Silva', 'Andrés Iniesta'],
    },
    away: {
      name: 'Italy',
      aliases: ['Italia'],
      manager: 'Cesare Prandelli',
      startingXI: ['Gianluigi Buffon', 'Ignazio Abate', 'Andrea Barzagli', 'Leonardo Bonucci', 'Giorgio Chiellini', 'Andrea Pirlo', 'Claudio Marchisio', 'Riccardo Montolivo', 'Daniele De Rossi', 'Mario Balotelli', 'Antonio Cassano'],
    },
    goals: [
      { team: 'home', player: 'David Silva', minute: '14' },
      { team: 'home', player: 'Jordi Alba', minute: '41' },
      { team: 'home', player: 'Fernando Torres', minute: '84' },
      { team: 'home', player: 'Juan Mata', minute: '88' },
    ],
  },
  {
    id: 'wc-1974-final',
    year: 1974,
    competition: 'world-cup',
    competitionName: '1974 FIFA World Cup final',
    venue: 'Olympiastadion, Munich',
    image: {
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bd/Finale_wereldkampioenschap_voetbal_1974_in_Munchen%2C_West_Duitsland_tegen_Nederla%2C_Bestanddeelnr_927-3110.jpg/1280px-Finale_wereldkampioenschap_voetbal_1974_in_Munchen%2C_West_Duitsland_tegen_Nederla%2C_Bestanddeelnr_927-3110.jpg',
      page: 'https://commons.wikimedia.org/wiki/File:Finale_wereldkampioenschap_voetbal_1974_in_Munchen,_West_Duitsland_tegen_Nederla,_Bestanddeelnr_927-3110.jpg',
      author: 'Bert Verhoeff / Anefo (Nationaal Archief)',
      license: 'CC0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0',
    },
    home: {
      name: 'Netherlands',
      aliases: ['Holland', 'Nederland'],
      manager: 'Rinus Michels',
      startingXI: ['Jan Jongbloed', 'Wim Suurbier', 'Wim Rijsbergen', 'Arie Haan', 'Ruud Krol', 'Wim Jansen', 'Johan Neeskens', 'Willem van Hanegem', 'Johnny Rep', 'Rob Rensenbrink', 'Johan Cruyff'],
    },
    away: {
      name: 'West Germany',
      aliases: ['FRG', 'BRD', 'Germany FR'],
      manager: 'Helmut Schön',
      startingXI: ['Sepp Maier', 'Franz Beckenbauer', 'Berti Vogts', 'Hans-Georg Schwarzenbeck', 'Paul Breitner', 'Rainer Bonhof', 'Wolfgang Overath', 'Uli Hoeneß', 'Jürgen Grabowski', 'Bernd Hölzenbein', 'Gerd Müller'],
    },
    goals: [
      { team: 'home', player: 'Johan Neeskens', minute: '2', penalty: true },
      { team: 'away', player: 'Paul Breitner', minute: '25', penalty: true },
      { team: 'away', player: 'Gerd Müller', minute: '43' },
    ],
  },
  {
    id: 'wc-2026-final',
    year: 2026,
    competition: 'world-cup',
    competitionName: '2026 FIFA World Cup final',
    venue: 'MetLife Stadium, East Rutherford',
    extraTime: true,
    image: {
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Rodri_Enzo_Fernandez_Argentina_v_Spain_19_July_2026-185.jpg/1280px-Rodri_Enzo_Fernandez_Argentina_v_Spain_19_July_2026-185.jpg',
      page: 'https://commons.wikimedia.org/wiki/File:Rodri_Enzo_Fernandez_Argentina_v_Spain_19_July_2026-185.jpg',
      author: 'Bryan Berlin',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    },
    home: {
      name: 'Spain',
      aliases: ['España'],
      manager: 'Luis de la Fuente',
      startingXI: ['Unai Simón', 'Pedro Porro', 'Pau Cubarsí', 'Aymeric Laporte', 'Marc Cucurella', 'Rodri', 'Dani Olmo', 'Fabián Ruiz', 'Lamine Yamal', 'Mikel Oyarzabal', 'Álex Baena'],
    },
    away: {
      name: 'Argentina',
      aliases: [],
      manager: 'Lionel Scaloni',
      startingXI: ['Emiliano Martínez', 'Gonzalo Montiel', 'Cristian Romero', 'Lisandro Martínez', 'Nicolás Tagliafico', 'Rodrigo De Paul', 'Enzo Fernández', 'Alexis Mac Allister', 'Nicolás González', 'Lionel Messi', 'Julián Alvarez'],
    },
    goals: [
      { team: 'home', player: 'Ferran Torres', minute: '106' },
    ],
  },
]

// Extra names for the autocomplete lists so the correct answers aren't the only suggestions.
const EXTRA_TEAMS = ['Spain', 'Netherlands', 'England', 'Italy', 'Portugal', 'Belgium', 'Uruguay', 'Colombia', 'Chile', 'Mexico', 'Barcelona', 'Manchester United', 'Manchester City', 'Chelsea', 'Arsenal', 'Juventus', 'AC Milan', 'Inter Milan', 'Atlético Madrid', 'Paris Saint-Germain', 'Ajax', 'Benfica', 'Porto', 'Boca Juniors', 'River Plate', 'Flamengo']
const EXTRA_MANAGERS = ['Pep Guardiola', 'José Mourinho', 'Carlo Ancelotti', 'Diego Simeone', 'Vicente del Bosque', 'Louis van Gaal', 'Gareth Southgate', 'Roberto Mancini', 'Lionel Scaloni', 'Fernando Santos', 'Alex Ferguson', 'Arsène Wenger', 'Antonio Conte', 'Thomas Tuchel', 'Hansi Flick', 'Mauricio Pochettino', 'Óscar Tabárez', 'Jorge Sampaoli']
const EXTRA_PLAYERS = ['Neymar', 'Sergio Agüero', 'Ángel Di María', 'Gareth Bale', 'Jamal Musiala', 'Richarlison', 'Andrés Iniesta', 'Xavi', 'Wayne Rooney', 'Harry Kane', 'Eden Hazard', 'Kevin De Bruyne', 'Luis Suárez', 'Edinson Cavani', 'Zlatan Ibrahimović', 'Arjen Robben', 'Franck Ribéry', 'Sami Khedira', 'André Schürrle', 'Sergio Busquets', 'Gerard Piqué', 'Iker Casillas', 'Mario Götze', 'Rodrigo De Paul', 'Paulo Dybala', 'Antoine Griezmann']

const unique = (names) => [...new Set(names)].sort((a, b) => a.localeCompare(b))

export const TEAM_OPTIONS = unique([...MATCHES.flatMap((match) => [match.home.name, match.away.name]), ...EXTRA_TEAMS])
export const MANAGER_OPTIONS = unique([...MATCHES.flatMap((match) => [match.home.manager, match.away.manager]), ...EXTRA_MANAGERS])
export const PLAYER_OPTIONS = unique([...MATCHES.flatMap((match) => [...match.home.startingXI, ...match.away.startingXI, ...match.goals.map((goal) => goal.player)]), ...EXTRA_PLAYERS])
