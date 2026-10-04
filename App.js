import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  computeSessionPoints,
  countCorrect,
  getEmptyAssignments,
  getNextExercise,
  heartsString,
  shuffle,
} from './game-logic.mjs';

const AVATARS = ['🦊', '🐼', '🐸', '🦁', '🐙', '🐯', '🐻', '🦄'];

const CATEGORY_OPTIONS = [
  { key: 'subject', label: 'Soggetto' },
  { key: 'predicato_verbale', label: 'Predicato verbale' },
  { key: 'predicato_nominale', label: 'Predicato nominale' },
  { key: 'object', label: 'Complemento oggetto' },
  { key: 'termine', label: 'Complemento di termine' },
  { key: 'spec', label: 'Complemento di specificazione' },
  { key: 'moto_a_luogo', label: 'Complemento di moto a luogo' },
  { key: 'moto_da_luogo', label: 'Complemento di moto da luogo' },
  { key: 'moto_per_luogo', label: 'Complemento di moto per luogo' },
  { key: 'stato_in_luogo', label: 'Complemento di stato in luogo' },
  { key: 'modo', label: 'Complemento di modo' },
  { key: 'tempo_determinato', label: 'Complemento di tempo determinato' },
  { key: 'tempo_continuato', label: 'Complemento di tempo continuato' },
  { key: 'causa', label: 'Complemento di causa' },
  { key: 'fine', label: 'Complemento di fine' },
  { key: 'mezzo', label: 'Complemento di mezzo' },
  { key: 'agente', label: 'Complemento d’agente' },
  { key: 'causa_efficiente', label: 'Complemento di causa efficiente' },
  { key: 'predicativo_soggetto', label: 'Predicativo del soggetto' },
];

const LABELS = Object.fromEntries(CATEGORY_OPTIONS.map((c) => [c.key, c.label]));

const GUIDE_TEXT = `L’analisi logica serve a capire che funzione ha ogni parola o gruppo di parole nella frase.

Metodo pratico:
1. trova il verbo
2. capisci se è predicato verbale o nominale
3. trova il soggetto
4. cerca i complementi facendo le domande giuste

Soggetto
È chi compie l’azione o di chi si parla.

Predicato verbale
Indica un’azione o uno stato espresso da un verbo con significato pieno.

Predicato nominale
È formato dal verbo essere o simili più una parte nominale che dice com’è o che cos’è il soggetto.

Complemento oggetto
Risponde alla domanda “chi?” o “che cosa?” dopo un verbo transitivo.

Complemento di termine
Indica a chi o a che cosa è diretta l’azione.

Complemento di specificazione
Precisa meglio un nome, spesso introdotto da “di”.

Complemento di moto a luogo
Indica verso dove si va.

Complemento di moto da luogo
Indica da dove si parte.

Complemento di moto per luogo
Indica il luogo attraverso cui si passa.

Complemento di stato in luogo
Indica il luogo in cui qualcuno o qualcosa si trova.

Complemento di modo
Indica il modo in cui si compie l’azione.

Complemento di tempo determinato
Indica quando succede qualcosa.

Complemento di tempo continuato
Indica per quanto tempo dura qualcosa.

Complemento di causa
Indica il motivo di un fatto.

Complemento di fine
Indica lo scopo.

Complemento di mezzo
Indica lo strumento o il mezzo usato.

Complemento d’agente
Nella frase passiva indica da chi è compiuta l’azione.

Complemento di causa efficiente
Nella frase passiva indica da che cosa è compiuta l’azione.

Predicativo del soggetto
È una parola o espressione riferita al soggetto, collegata al verbo.

Consiglio finale:
non partire dai complementi a memoria. Parti sempre dal verbo e dal senso della frase.`;

const LEGACY_EXERCISES = [
  {
    id: 1,
    sentence: 'Il gatto mangia il pesce',
    chunks: ['Il gatto', 'mangia', 'il pesce'],
    correct: {
      'Il gatto': 'subject',
      'mangia': 'predicato_verbale',
      'il pesce': 'object',
    },
  },
  {
    id: 2,
    sentence: 'Sara prende il quaderno di Luca',
    chunks: ['Sara', 'prende', 'il quaderno', 'di Luca'],
    correct: {
      'Sara': 'subject',
      'prende': 'predicato_verbale',
      'il quaderno': 'object',
      'di Luca': 'spec',
    },
  },
  {
    id: 3,
    sentence: 'Paolo va a scuola',
    chunks: ['Paolo', 'va', 'a scuola'],
    correct: {
      'Paolo': 'subject',
      'va': 'predicato_verbale',
      'a scuola': 'moto_a_luogo',
    },
  },
  {
    id: 4,
    sentence: 'Marta esce da casa',
    chunks: ['Marta', 'esce', 'da casa'],
    correct: {
      'Marta': 'subject',
      'esce': 'predicato_verbale',
      'da casa': 'moto_da_luogo',
    },
  },
  {
    id: 5,
    sentence: 'Il cane corre per il parco',
    chunks: ['Il cane', 'corre', 'per il parco'],
    correct: {
      'Il cane': 'subject',
      'corre': 'predicato_verbale',
      'per il parco': 'moto_per_luogo',
    },
  },
  {
    id: 6,
    sentence: 'Luca parla con calma',
    chunks: ['Luca', 'parla', 'con calma'],
    correct: {
      'Luca': 'subject',
      'parla': 'predicato_verbale',
      'con calma': 'modo',
    },
  },
  {
    id: 7,
    sentence: 'Domani Giulia studia matematica',
    chunks: ['Domani', 'Giulia', 'studia', 'matematica'],
    correct: {
      'Domani': 'tempo_determinato',
      'Giulia': 'subject',
      'studia': 'predicato_verbale',
      'matematica': 'object',
    },
  },
  {
    id: 8,
    sentence: 'Marco ha studiato per tre ore',
    chunks: ['Marco', 'ha studiato', 'per tre ore'],
    correct: {
      'Marco': 'subject',
      'ha studiato': 'predicato_verbale',
      'per tre ore': 'tempo_continuato',
    },
  },
  {
    id: 9,
    sentence: 'Laura trema per la paura',
    chunks: ['Laura', 'trema', 'per la paura'],
    correct: {
      'Laura': 'subject',
      'trema': 'predicato_verbale',
      'per la paura': 'causa',
    },
  },
  {
    id: 10,
    sentence: 'Anna compra i fiori per la festa',
    chunks: ['Anna', 'compra', 'i fiori', 'per la festa'],
    correct: {
      'Anna': 'subject',
      'compra': 'predicato_verbale',
      'i fiori': 'object',
      'per la festa': 'fine',
    },
  },
  {
    id: 11,
    sentence: 'Davide scrive con la penna',
    chunks: ['Davide', 'scrive', 'con la penna'],
    correct: {
      'Davide': 'subject',
      'scrive': 'predicato_verbale',
      'con la penna': 'mezzo',
    },
  },
  {
    id: 12,
    sentence: 'Il ladro è stato arrestato dai carabinieri',
    chunks: ['Il ladro', 'è stato arrestato', 'dai carabinieri'],
    correct: {
      'Il ladro': 'subject',
      'è stato arrestato': 'predicato_verbale',
      'dai carabinieri': 'agente',
    },
  },
  {
    id: 13,
    sentence: 'La finestra è stata rotta dal vento',
    chunks: ['La finestra', 'è stata rotta', 'dal vento'],
    correct: {
      'La finestra': 'subject',
      'è stata rotta': 'predicato_verbale',
      'dal vento': 'causa_efficiente',
    },
  },
  {
    id: 14,
    sentence: 'Marco è stanco',
    chunks: ['Marco', 'è stanco'],
    correct: {
      'Marco': 'subject',
      'è stanco': 'predicato_nominale',
    },
  },
  {
    id: 15,
    sentence: 'La casa è grande',
    chunks: ['La casa', 'è grande'],
    correct: {
      'La casa': 'subject',
      'è grande': 'predicato_nominale',
    },
  },
];




const LEGACY_EXERCISES_2 = [
  {
    id: 16,
    sentence: 'Giulia è una studentessa',
    chunks: ['Giulia', 'è una studentessa'],
    correct: {
      'Giulia': 'subject',
      'è una studentessa': 'predicato_nominale',
    },
  },
  {
    id: 17,
    sentence: 'Il cielo è sereno',
    chunks: ['Il cielo', 'è sereno'],
    correct: {
      'Il cielo': 'subject',
      'è sereno': 'predicato_nominale',
    },
  },
  {
    id: 18,
    sentence: 'Il fratello di Luca corre nel parco',
    chunks: ['Il fratello', 'di Luca', 'corre', 'nel parco'],
    correct: {
      'Il fratello': 'subject',
      'di Luca': 'spec',
      'corre': 'predicato_verbale',
      'nel parco': 'stato_in_luogo',
    },
  },
  {
    id: 19,
    sentence: 'Per due giorni Marta ha riposato con tranquillità',
    chunks: ['Per due giorni', 'Marta', 'ha riposato', 'con tranquillità'],
    correct: {
      'Per due giorni': 'tempo_continuato',
      'Marta': 'subject',
      'ha riposato': 'predicato_verbale',
      'con tranquillità': 'modo',
    },
  },
  {
    id: 20,
    sentence: 'Il foglio è bianco',
    chunks: ['Il foglio', 'è bianco'],
    correct: {
      'Il foglio': 'subject',
      'è bianco': 'predicato_nominale',
    },
  },
  {
    id: 21,
    sentence: 'Luca scrive a Marco',
    chunks: ['Luca', 'scrive', 'a Marco'],
    correct: {
      'Luca': 'subject',
      'scrive': 'predicato_verbale',
      'a Marco': 'termine',
    },
  },
  {
    id: 22,
    sentence: 'Io ho dato il libro a Giulia',
    chunks: ['Io', 'ho dato', 'il libro', 'a Giulia'],
    correct: {
      'Io': 'subject',
      'ho dato': 'predicato_verbale',
      'il libro': 'object',
      'a Giulia': 'termine',
    },
  },
  {
    id: 23,
    sentence: 'Maria racconta una storia ai bambini',
    chunks: ['Maria', 'racconta', 'una storia', 'ai bambini'],
    correct: {
      'Maria': 'subject',
      'racconta': 'predicato_verbale',
      'una storia': 'object',
      'ai bambini': 'termine',
    },
  },
  {
    id: 24,
    sentence: 'Il nonno parla ai nipoti',
    chunks: ['Il nonno', 'parla', 'ai nipoti'],
    correct: {
      'Il nonno': 'subject',
      'parla': 'predicato_verbale',
      'ai nipoti': 'termine',
    },
  },
];

const ALL_LEGACY_EXERCISES = [...LEGACY_EXERCISES, ...LEGACY_EXERCISES_2];

const ADVANCED_SEEDS = [
  {
    sentence: 'Il professore ha spiegato la lezione con grande chiarezza agli studenti.',
    chunks: ['Il professore', 'ha spiegato', 'la lezione', 'con grande chiarezza', 'agli studenti'],
    correct: {
      'Il professore': 'subject',
      'ha spiegato': 'predicato_verbale',
      'la lezione': 'object',
      'con grande chiarezza': 'modo',
      'agli studenti': 'termine',
    },
  },
  {
    sentence: 'Per tutta la notte, il vento soffiò con violenza tra le montagne.',
    chunks: ['Per tutta la notte', 'il vento', 'soffiò', 'con violenza', 'tra le montagne'],
    correct: {
      'Per tutta la notte': 'tempo_continuato',
      'il vento': 'subject',
      'soffiò': 'predicato_verbale',
      'con violenza': 'modo',
      'tra le montagne': 'moto_per_luogo',
    },
  },
  {
    sentence: 'La delegazione è partita da Roma ieri mattina per raggiungere Bruxelles.',
    chunks: ['La delegazione', 'è partita', 'da Roma', 'ieri mattina', 'per raggiungere Bruxelles'],
    correct: {
      'La delegazione': 'subject',
      'è partita': 'predicato_verbale',
      'da Roma': 'moto_da_luogo',
      'ieri mattina': 'tempo_determinato',
      'per raggiungere Bruxelles': 'fine',
    },
  },
  {
    sentence: "Il libro fu scritto dall'autore in pochi mesi di intensa ispirazione.",
    chunks: ['Il libro', 'fu scritto', "dall'autore", 'in pochi mesi', 'di intensa ispirazione'],
    correct: {
      'Il libro': 'subject',
      'fu scritto': 'predicato_verbale',
      "dall'autore": 'agente',
      'in pochi mesi': 'tempo_continuato',
      'di intensa ispirazione': 'spec',
    },
  },
  {
    sentence: 'I bambini correvano felici attraverso i campi fioriti del villaggio.',
    chunks: ['I bambini', 'correvano', 'felici', 'attraverso i campi fioriti', 'del villaggio'],
    correct: {
      'I bambini': 'subject',
      'correvano': 'predicato_verbale',
      'felici': 'predicativo_soggetto',
      'attraverso i campi fioriti': 'moto_per_luogo',
      'del villaggio': 'spec',
    },
  },
  {
    sentence: 'La torre medievale fu eretta dalla comunità locale nel XIII secolo per difesa.',
    chunks: ['La torre medievale', 'fu eretta', 'dalla comunità locale', 'nel XIII secolo', 'per difesa'],
    correct: {
      'La torre medievale': 'subject',
      'fu eretta': 'predicato_verbale',
      'dalla comunità locale': 'agente',
      'nel XIII secolo': 'tempo_determinato',
      'per difesa': 'fine',
    },
  },
  {
    sentence: "L'atleta si allenò strenuamente per mesi al fine di partecipare alle olimpiadi.",
    chunks: ["L'atleta", 'si allenò', 'strenuamente', 'per mesi', 'al fine di partecipare alle olimpiadi'],
    correct: {
      "L'atleta": 'subject',
      'si allenò': 'predicato_verbale',
      'strenuamente': 'modo',
      'per mesi': 'tempo_continuato',
      'al fine di partecipare alle olimpiadi': 'fine',
    },
  },
  {
    sentence: "La notizia dell'incidente fu diffusa dai giornalisti tramite i social media.",
    chunks: ['La notizia', "dell'incidente", 'fu diffusa', 'dai giornalisti', 'tramite i social media'],
    correct: {
      'La notizia': 'subject',
      "dell'incidente": 'spec',
      'fu diffusa': 'predicato_verbale',
      'dai giornalisti': 'agente',
      'tramite i social media': 'mezzo',
    },
  },
  {
    sentence: 'Chiunque abbia buona volontà può imparare una nuova lingua straniera.',
    chunks: ['Chiunque abbia buona volontà', 'può imparare', 'una nuova lingua straniera'],
    correct: {
      'Chiunque abbia buona volontà': 'subject',
      'può imparare': 'predicato_verbale',
      'una nuova lingua straniera': 'object',
    },
  },
  {
    sentence: "Il treno espresso arrivò alla stazione di Milano con mezz'ora di ritardo.",
    chunks: ['Il treno espresso', 'arrivò', 'alla stazione di Milano', "con mezz'ora di ritardo"],
    correct: {
      'Il treno espresso': 'subject',
      'arrivò': 'predicato_verbale',
      'alla stazione di Milano': 'moto_a_luogo',
      "con mezz'ora di ritardo": 'tempo_continuato',
    },
  },
];

const ADVANCED_EXERCISES = [
  ...ADVANCED_SEEDS.map((exercise, index) => ({ id: `advanced-${index + 1}`, ...exercise })),
  ...ALL_LEGACY_EXERCISES.map((exercise) => ({ ...exercise, id: `base-${exercise.id}` })),
];

const DAILY_CHALLENGE = {
  id: 'daily-1',
  sentence: 'Durante la mattina Giulia ha consegnato il quaderno al professore con cura.',
  chunks: ['Durante la mattina', 'Giulia', 'ha consegnato', 'il quaderno', 'al professore', 'con cura'],
  correct: {
    'Durante la mattina': 'tempo_determinato',
    'Giulia': 'subject',
    'ha consegnato': 'predicato_verbale',
    'il quaderno': 'object',
    'al professore': 'termine',
    'con cura': 'modo',
  },
};




const DETECTIVE_DATASET = [
  {
    id: 'det-1',
    sentence: 'Gli studenti ha terminato il compito ieri.',
    choices: ['Gli studenti', 'ha terminato', 'il compito', 'ieri'],
    correctIndex: 1,
    explanation: 'Il soggetto plurale richiede “hanno terminato”.',
  },
  {
    id: 'det-2',
    sentence: 'Le ragazze è arrivate presto.',
    choices: ['Le ragazze', 'è arrivate', 'presto', 'nessun errore'],
    correctIndex: 1,
    explanation: 'Il soggetto plurale richiede “sono arrivate”.',
  },
  {
    id: 'det-3',
    sentence: 'I bambini gioca nel cortile.',
    choices: ['I bambini', 'gioca', 'nel cortile', 'nessun errore'],
    correctIndex: 1,
    explanation: 'Il verbo deve concordare con il soggetto plurale: “giocano”.',
  },
  {
    id: 'det-4',
    sentence: 'Maria ha consegnato il modulo al segreteria.',
    choices: ['Maria', 'ha consegnato', 'il modulo', 'al segreteria'],
    correctIndex: 3,
    explanation: 'La forma corretta è “alla segreteria”.',
  },
  {
    id: 'det-5',
    sentence: 'Il professore spiegano la lezione con calma.',
    choices: ['Il professore', 'spiegano', 'la lezione', 'con calma'],
    correctIndex: 1,
    explanation: 'Il soggetto singolare richiede “spiega”.',
  },
  {
    id: 'det-6',
    sentence: 'La finestra sono state chiuse dal custode.',
    choices: ['La finestra', 'sono state chiuse', 'dal custode', 'nessun errore'],
    correctIndex: 1,
    explanation: 'La forma corretta è “è stata chiusa”.',
  },
  {
    id: 'det-7',
    sentence: 'Paolo e Luca è partito da Roma.',
    choices: ['Paolo e Luca', 'è partito', 'da Roma', 'nessun errore'],
    correctIndex: 1,
    explanation: 'Il soggetto composto richiede “sono partiti”.',
  },
  {
    id: 'det-8',
    sentence: 'Anna scrive con la matita ai quaderno.',
    choices: ['Anna', 'scrive', 'con la matita', 'ai quaderno'],
    correctIndex: 3,
    explanation: 'La forma corretta è “sul quaderno”.',
  },
  {
    id: 'det-9',
    sentence: 'Il cane corrono velocemente nel parco.',
    choices: ['Il cane', 'corrono', 'velocemente', 'nel parco'],
    correctIndex: 1,
    explanation: 'Il soggetto singolare richiede “corre”.',
  },
  {
    id: 'det-10',
    sentence: 'Le chiavi si trova sul tavolo.',
    choices: ['Le chiavi', 'si trova', 'sul tavolo', 'nessun errore'],
    correctIndex: 1,
    explanation: 'Il soggetto plurale richiede “si trovano”.',
  },
  {
    id: 'det-11',
    sentence: 'I turisti ha fotografato il monumento.',
    choices: ['I turisti', 'ha fotografato', 'il monumento', 'nessun errore'],
    correctIndex: 1,
    explanation: 'Il soggetto plurale richiede “hanno fotografato”.',
  },
  {
    id: 'det-12',
    sentence: 'La nonna preparano la cena per i nipoti.',
    choices: ['La nonna', 'preparano', 'la cena', 'per i nipoti'],
    correctIndex: 1,
    explanation: 'Il soggetto singolare richiede “prepara”.',
  },
];

function buildMcqGameQuestions() {
  const allLabels = CATEGORY_OPTIONS.map((category) => category.label);

  return shuffle(ALL_LEGACY_EXERCISES).slice(0, 12).map((exercise) => {
    const entries = Object.entries(exercise.correct);
    const [chunk, key] = entries[Math.floor(Math.random() * entries.length)];
    const correctLabel = LABELS[key];
    const distractors = shuffle(allLabels.filter((label) => label !== correctLabel)).slice(0, 3);
    const options = shuffle([correctLabel, ...distractors]);

    return {
      id: `mcq-${exercise.id}`,
      prompt: exercise.sentence.replace(chunk, chunk.toUpperCase()),
      options,
      correctIndex: options.indexOf(correctLabel),
    };
  });
}

function ColorfulTitle() {
  const letters = [
    { t: 'L', c: '#D94B3D' },
    { t: 'o', c: '#E8872E' },
    { t: 'g', c: '#D5A51D' },
    { t: 'i', c: '#4C9B58' },
    { t: 'c', c: '#248B78' },
    { t: ' ', c: '#173D2C' },
    { t: 'F', c: '#397CAB' },
    { t: 'l', c: '#4F63A8' },
    { t: 'o', c: '#8C52A3' },
    { t: 'w', c: '#B9497A' },
  ];

  return (
    <View style={styles.colorfulTitleWrap}>
      {letters.map((item, index) => (
        <Text key={`${item.t}-${index}`} style={[styles.colorfulLetter, { color: item.c }]}>
          {item.t}
        </Text>
      ))}
    </View>
  );
}

function HomeScreen({ profile, points, dailyCompleted, setScreen }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.homeWrap}>
        <View style={styles.homeTopBar}>
          <TouchableOpacity
            accessibilityLabel="Apri profilo e guida"
            style={styles.settingsCircle}
            onPress={() => setScreen('settings')}
          >
            <Text style={styles.settingsCircleText}>☰</Text>
          </TouchableOpacity>

          <View style={styles.reputationCard}>
            <Text style={styles.reputationAvatar}>{profile.avatar}</Text>
            <View>
              <Text style={styles.reputationLabel}>Punti della sessione</Text>
              <Text style={styles.reputationValue}>{points}</Text>
            </View>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <ColorfulTitle />
          <Text style={styles.homeSubtitle}>
            Scomponi la frase, assegna una funzione a ogni parte e controlla il risultato.
          </Text>
        </View>

        <TouchableOpacity style={styles.bigPlayButton} onPress={() => setScreen('game')}>
          <Text style={styles.bigPlayButtonText}>Inizia una partita</Text>
          <Text style={styles.bigPlayButtonSub}>2 minuti · 3 vite · frasi senza ripetizioni</Text>
        </TouchableOpacity>

        <View style={styles.secondaryButtonsGrid}>
          <TouchableOpacity style={styles.secondaryCard} onPress={() => setScreen('daily')}>
            <Text style={styles.secondaryCardTitle}>Sfida singola</Text>
            <Text style={styles.secondaryCardText}>
              {dailyCompleted ? 'Completata in questa sessione.' : 'Una frase più difficile, un solo tentativo.'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryCard} onPress={() => setScreen('minigames')}>
            <Text style={styles.secondaryCardTitle}>Minigiochi</Text>
            <Text style={styles.secondaryCardText}>Quiz sulle funzioni e caccia agli errori.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryCard} onPress={() => setScreen('guide')}>
            <Text style={styles.secondaryCardTitle}>Ripassa il metodo</Text>
            <Text style={styles.secondaryCardText}>Parti dal verbo, trova il soggetto, poi cerca i complementi.</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsScreen({ onBack, profile, setProfile, openGuide }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrapper}>
        <View style={styles.screenHeader}>
          <TouchableOpacity accessibilityLabel="Torna indietro" style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Profilo locale</Text>
          <View style={{ width: 42 }} />
        </View>

        <View style={styles.bigCard}>
          <Text style={styles.cardSectionTitle}>Come vuoi giocare?</Text>
          <Text style={styles.smallHint}>Nome, avatar e punteggi restano nel browser solo per la sessione corrente.</Text>

          <Text style={styles.inputLabel}>Nome</Text>
          <TextInput
            value={profile.nickname}
            onChangeText={(text) => setProfile((previous) => ({ ...previous, nickname: text.slice(0, 24) }))}
            placeholder="Il tuo nome"
            placeholderTextColor="#7A8D80"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Avatar</Text>
          <View style={styles.avatarRow}>
            {AVATARS.map((avatar) => (
              <TouchableOpacity
                accessibilityLabel={`Scegli avatar ${avatar}`}
                key={avatar}
                style={[styles.avatarButton, profile.avatar === avatar && styles.avatarButtonSelected]}
                onPress={() => setProfile((previous) => ({ ...previous, avatar }))}
              >
                <Text style={styles.avatarButtonText}>{avatar}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.menuItem} onPress={openGuide}>
          <Text style={styles.menuItemText}>Come si fa l’analisi logica</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function GuideScreen({ onBack }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrapper}>
        <View style={styles.screenHeader}>
          <TouchableOpacity accessibilityLabel="Torna indietro" style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Metodo rapido</Text>
          <View style={{ width: 42 }} />
        </View>
        <View style={styles.bigCard}>
          <Text style={styles.longText}>{GUIDE_TEXT}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DailyChallengeScreen({
  onBack,
  dailyCompleted,
  setDailyCompleted,
  dailyFailed,
  setDailyFailed,
}) {
  const [assignments, setAssignments] = useState(getEmptyAssignments(DAILY_CHALLENGE.chunks));
  const [selectedChunk, setSelectedChunk] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);

  function openCategoryChooser(chunk) {
    if (dailyCompleted || dailyFailed) return;
    setSelectedChunk(chunk);
    setModalVisible(true);
  }

  function assignCategory(categoryKey) {
    if (!selectedChunk) return;
    setAssignments((prev) => ({
      ...prev,
      [selectedChunk]: categoryKey,
    }));
    setModalVisible(false);
    setSelectedChunk(null);
  }

  function removeAssignment(chunk) {
    if (dailyCompleted || dailyFailed) return;
    setAssignments((previous) => ({ ...previous, [chunk]: null }));
  }

  function handleCheck() {
    if (dailyCompleted || dailyFailed) return;

    const total = DAILY_CHALLENGE.chunks.length;
    const assignedCount = DAILY_CHALLENGE.chunks.filter((chunk) => assignments[chunk] !== null).length;

    if (assignedCount < total) {
      Alert.alert('Frase incompleta', 'Completa tutte le assegnazioni.');
      return;
    }

    const correctCount = countCorrect(assignments, DAILY_CHALLENGE.correct);

    if (correctCount === total) {
      setDailyCompleted(true);
    } else {
      setDailyFailed(true);
    }
  }

  const assignedChunks = DAILY_CHALLENGE.chunks.filter((chunk) => assignments[chunk] !== null);
  const unassignedChunks = DAILY_CHALLENGE.chunks.filter((chunk) => assignments[chunk] === null);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrapper}>
        <View style={styles.screenHeader}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Sfida singola</Text>
          <View style={{ width: 42 }} />
        </View>

        <View style={styles.bigCard}>
          <Text style={styles.dailyBadge}>Una frase, un tentativo</Text>
          <Text style={styles.smallHint}>Completa tutte le assegnazioni prima di verificare.</Text>
        </View>

        <View style={styles.sentenceCard}>
          <Text style={styles.sentenceText}>{DAILY_CHALLENGE.sentence}</Text>
        </View>

        {!showCorrection && (
          <>
            <Text style={styles.sectionLabel}>Pezzi di frase</Text>
            <View style={styles.chunksWrap}>
              {unassignedChunks.map((chunk) => (
                <TouchableOpacity key={chunk} style={styles.chunkButton} onPress={() => openCategoryChooser(chunk)}>
                  <Text style={styles.chunkButtonText}>{chunk}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Le tue scelte</Text>
            <View style={styles.answersCard}>
              {assignedChunks.length === 0 ? (
                <Text style={styles.emptyText}>Le assegnazioni compariranno qui.</Text>
              ) : (
                assignedChunks.map((chunk) => (
                  <TouchableOpacity key={chunk} style={styles.answerRow} onPress={() => removeAssignment(chunk)}>
                    <Text style={styles.answerChunk}>{chunk}</Text>
                    <Text style={styles.answerArrow}>→</Text>
                    <Text style={styles.answerLabel}>{LABELS[assignments[chunk]]}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, (dailyCompleted || dailyFailed) && styles.disabledButton]}
              onPress={handleCheck}
            >
              <Text style={styles.primaryButtonText}>
                {dailyCompleted ? 'Completata' : dailyFailed ? 'Tentativo terminato' : 'Verifica'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {dailyFailed && (
          <View style={styles.bigCard}>
            <Text style={styles.errorBigText}>Nooo, sbagliato.</Text>
            <TouchableOpacity style={styles.secondaryActionButton} onPress={() => setShowCorrection(true)}>
              <Text style={styles.secondaryActionText}>Vedi l’errore</Text>
            </TouchableOpacity>
          </View>
        )}

        {dailyCompleted && (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Analisi corretta</Text>
            <Text style={styles.longText}>Hai completato la sfida della sessione e ottenuto 15 punti.</Text>
          </View>
        )}

        {showCorrection && (
          <View style={styles.bigCard}>
            <Text style={styles.cardSectionTitle}>Analisi corretta</Text>
            {Object.entries(DAILY_CHALLENGE.correct).map(([chunk, key]) => (
              <View key={chunk} style={styles.answerRow}>
                <Text style={styles.answerChunk}>{chunk}</Text>
                <Text style={styles.answerArrow}>→</Text>
                <Text style={styles.answerLabel}>{LABELS[key]}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Scegli la funzione logica</Text>
            {selectedChunk && <Text style={styles.modalSubtitle}>Pezzo selezionato: “{selectedChunk}”</Text>}
          </View>

          <ScrollView contentContainerStyle={styles.modalOptionsWrap}>
            {CATEGORY_OPTIONS.map((option) => (
              <TouchableOpacity key={option.key} style={styles.modalOption} onPress={() => assignCategory(option.key)}>
                <Text style={styles.modalOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseButtonText}>Chiudi</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function MinigamesHome({ onBack, onStartQuiz, onStartDetective }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrapper}>
        <View style={styles.screenHeader}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Minigiochi</Text>
          <View style={{ width: 42 }} />
        </View>

        <TouchableOpacity style={styles.bigCard} onPress={onStartQuiz}>
          <Text style={styles.cardSectionTitle}>Quiz rapido</Text>
          <Text style={styles.longText}>
            Una frase, una sola parte in maiuscolo, quattro opzioni. Ogni risposta esatta vale 1 punto.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bigCard} onPress={onStartDetective}>
          <Text style={styles.cardSectionTitle}>Detective della lingua</Text>
          <Text style={styles.longText}>
            Trova il segmento sbagliato in dodici frasi con errori verificabili.
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}




function MultipleChoiceQuiz({ onBack, onStatsUpdate }) {
  const [questions] = useState(buildMcqGameQuestions());
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [flash, setFlash] = useState(null);
  const [finished, setFinished] = useState(false);

  const current = questions[index];

  function handleAnswer(optionIndex) {
    const isCorrect = optionIndex === current.correctIndex;

    setFlash({
      text: isCorrect ? 'GIUSTO' : 'SBAGLIATO',
      color: isCorrect ? '#1E8E3E' : '#D93025',
    });

    const nextAnswers = [
      ...answers,
      { question: current, selectedIndex: optionIndex, isCorrect },
    ];

    setAnswers(nextAnswers);

    setTimeout(() => {
      setFlash(null);

      if (index === questions.length - 1) {
        const correctCount = nextAnswers.filter((a) => a.isCorrect).length;
        onStatsUpdate((prev) => ({
          ...prev,
          miniGames: prev.miniGames + 1,
          mcqCorrect: prev.mcqCorrect + correctCount,
          mcqQuestions: prev.mcqQuestions + nextAnswers.length,
        }));
        setFinished(true);
      } else {
        setIndex((prev) => prev + 1);
      }
    }, 600);
  }

  if (finished) {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const wrongCount = answers.length - correctCount;
    const grade = Math.max(2, Math.round((correctCount / answers.length) * 10));

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.wrapper}>
          <View style={styles.screenHeader}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Risultati quiz</Text>
            <View style={{ width: 42 }} />
          </View>

          <View style={styles.resultsSummaryCard}>
            <Text style={styles.resultsSummaryTitle}>Quiz veloce</Text>
            <Text style={styles.resultsLine}>Numero di domande: {answers.length}</Text>
            <Text style={styles.resultsLine}>Risposte corrette: {correctCount}</Text>
            <Text style={styles.resultsLine}>Risposte errate: {wrongCount}</Text>
            <Text style={styles.resultsVote}>+{correctCount} punti</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrapper}>
        <View style={styles.screenHeader}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Quiz rapido</Text>
          <View style={{ width: 42 }} />
        </View>

        <View style={styles.bigCard}>
          <Text style={styles.cardSectionTitle}>Domanda {index + 1} / {questions.length}</Text>
          <Text style={styles.longText}>Le frasi non si ripetono nella stessa partita.</Text>
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{current.prompt}</Text>
        </View>

        {current.options.map((option, optionIndex) => (
          <TouchableOpacity
            key={optionIndex}
            style={styles.mcqOption}
            onPress={() => handleAnswer(optionIndex)}
          >
            <Text style={styles.mcqLetter}>{String.fromCharCode(65 + optionIndex)}</Text>
            <Text style={styles.mcqText}>{option}</Text>
          </TouchableOpacity>
        ))}

        {flash && (
          <View style={styles.flashOverlay}>
            <Text style={[styles.flashText, { color: flash.color }]}>{flash.text}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetectiveGame({ onBack, onStatsUpdate }) {
  const [questions] = useState(() => [...DETECTIVE_DATASET].sort(() => Math.random() - 0.5).slice(0, 20));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [flash, setFlash] = useState(null);
  const [finished, setFinished] = useState(false);

  const current = questions[index];

  function handleChoice(choiceIndex) {
    const isCorrect = choiceIndex === current.correctIndex;

    setFlash({
      text: isCorrect ? 'GIUSTO' : 'SBAGLIATO',
      color: isCorrect ? '#1E8E3E' : '#D93025',
    });

    const nextAnswers = [
      ...answers,
      { question: current, selectedIndex: choiceIndex, isCorrect },
    ];

    setAnswers(nextAnswers);

    setTimeout(() => {
      setFlash(null);

      if (index === questions.length - 1) {
        const correctCount = nextAnswers.filter((a) => a.isCorrect).length;
        onStatsUpdate((prev) => ({
          ...prev,
          detectiveGames: prev.detectiveGames + 1,
          detectiveCorrect: prev.detectiveCorrect + correctCount,
          detectiveQuestions: prev.detectiveQuestions + nextAnswers.length,
        }));
        setFinished(true);
      } else {
        setIndex((prev) => prev + 1);
      }
    }, 650);
  }

  if (finished) {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const wrongCount = answers.length - correctCount;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.wrapper}>
          <View style={styles.screenHeader}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Risultati detective</Text>
            <View style={{ width: 42 }} />
          </View>

          <View style={styles.resultsSummaryCard}>
            <Text style={styles.resultsSummaryTitle}>Detective della lingua</Text>
            <Text style={styles.resultsLine}>Domande: {answers.length}</Text>
            <Text style={styles.resultsLine}>Corrette: {correctCount}</Text>
            <Text style={styles.resultsLine}>Errate: {wrongCount}</Text>
            <Text style={styles.resultsVote}>+{correctCount * 2} punti</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrapper}>
        <View style={styles.screenHeader}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Detective della lingua</Text>
          <View style={{ width: 42 }} />
        </View>

        <View style={styles.bigCard}>
          <Text style={styles.cardSectionTitle}>Domanda {index + 1} / {questions.length}</Text>
          <Text style={styles.longText}>Trova la parte sbagliata. Le frasi non si ripetono nella stessa partita.</Text>
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{current.sentence}</Text>
        </View>

        {current.choices.map((choice, choiceIndex) => (
          <TouchableOpacity
            key={choiceIndex}
            style={styles.mcqOption}
            onPress={() => handleChoice(choiceIndex)}
          >
            <Text style={styles.mcqLetter}>{String.fromCharCode(65 + choiceIndex)}</Text>
            <Text style={styles.mcqText}>{choice}</Text>
          </TouchableOpacity>
        ))}

        {flash && (
          <View style={styles.flashOverlay}>
            <Text style={[styles.flashText, { color: flash.color }]}>{flash.text}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}




function MainGame({ onBack, onStatsUpdate }) {
  const [timeLeft, setTimeLeft] = useState(120);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [correctCount, setCorrectCount] = useState(0);
  const [errorsThisGame, setErrorsThisGame] = useState(0);

  const [usedExerciseIds, setUsedExerciseIds] = useState([]);
  const [exercise, setExercise] = useState(ADVANCED_EXERCISES[0]);
  const [assignments, setAssignments] = useState(getEmptyAssignments(ADVANCED_EXERCISES[0].chunks));

  const [selectedChunk, setSelectedChunk] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [skipUsedForCurrent, setSkipUsedForCurrent] = useState(false);
  const [result, setResult] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordedFinish = useRef(false);

  useEffect(() => {
    const first = getNextExercise(ADVANCED_EXERCISES, [], null) || ADVANCED_EXERCISES[0];
    setUsedExerciseIds([first.id]);
    setExercise(first);
    setAssignments(getEmptyAssignments(first.chunks));
  }, []);

  useEffect(() => {
    let interval = null;

    if (timeLeft > 0 && lives > 0 && !result) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    if (timeLeft === 0 && !recordedFinish.current) {
      recordedFinish.current = true;
      onStatsUpdate((prev) => ({
        ...prev,
        classicGames: prev.classicGames + 1,
        classicCorrect: prev.classicCorrect + correctCount,
        classicErrors: prev.classicErrors + errorsThisGame,
      }));
      setResult({ title: 'Tempo finito', score, bestCombo });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeLeft, lives, score, bestCombo, result, onStatsUpdate, correctCount, errorsThisGame]);

  useEffect(() => {
    if (lives <= 0 && !recordedFinish.current) {
      recordedFinish.current = true;
      onStatsUpdate((prev) => ({
        ...prev,
        classicGames: prev.classicGames + 1,
        classicCorrect: prev.classicCorrect + correctCount,
        classicErrors: prev.classicErrors + errorsThisGame,
        classicLosses: prev.classicLosses + 1,
      }));
      setResult({ title: 'Partita terminata', score, bestCombo });
    }
  }, [lives, score, bestCombo, onStatsUpdate, correctCount, errorsThisGame]);

  useEffect(() => {
    if (timeLeft <= 30 && timeLeft > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 450,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 450,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [timeLeft, pulseAnim]);

  function moveToNextExercise() {
    const next = getNextExercise(ADVANCED_EXERCISES, usedExerciseIds, exercise.id);

    if (!next) {
      if (!recordedFinish.current) {
        recordedFinish.current = true;
        onStatsUpdate((prev) => ({
          ...prev,
          classicGames: prev.classicGames + 1,
          classicCorrect: prev.classicCorrect + correctCount,
          classicErrors: prev.classicErrors + errorsThisGame,
        }));
        setResult({ title: 'Hai completato tutte le frasi', score, bestCombo });
      }
      return;
    }

    setExercise(next);
    setUsedExerciseIds((prev) => [...prev, next.id]);
    setAssignments(getEmptyAssignments(next.chunks));
    setSelectedChunk(null);
    setModalVisible(false);
    setFeedback(null);
  }

  function openCategoryChooser(chunk) {
    setSelectedChunk(chunk);
    setModalVisible(true);
  }

  function assignCategory(categoryKey) {
    if (!selectedChunk) return;
    setAssignments((prev) => ({
      ...prev,
      [selectedChunk]: categoryKey,
    }));
    setModalVisible(false);
    setSelectedChunk(null);
  }

  function removeAssignment(chunk) {
    setAssignments((prev) => ({
      ...prev,
      [chunk]: null,
    }));
  }

  function handlePass() {
    if (skipUsedForCurrent) {
      Alert.alert('Cambio già usato', 'Puoi cambiare una frase una sola volta.');
      return;
    }
    setSkipUsedForCurrent(true);
    setCombo(0);
    moveToNextExercise();
  }

  function handleNext() {
    const total = exercise.chunks.length;
    const assignedCount = exercise.chunks.filter((chunk) => assignments[chunk] !== null).length;

    if (assignedCount < total) {
      Alert.alert('Frase incompleta', 'Assegna una funzione logica a tutti i pezzi oppure usa “Passa”.');
      return;
    }

    const correct = countCorrect(assignments, exercise.correct);

    if (correct === total) {
      const newCombo = combo + 1;
      const gained = 10;
      setScore((prev) => prev + gained);
      setCombo(newCombo);
      setBestCombo((prev) => Math.max(prev, newCombo));
      setCorrectCount((prev) => prev + 1);
      setFeedback('correct');

      setTimeout(() => {
        moveToNextExercise();
      }, 350);
    } else {
      setLives((prev) => prev - 1);
      setCombo(0);
      setErrorsThisGame((prev) => prev + 1);
      setFeedback('wrong');

      Alert.alert('Sbagliato', 'La combo si azzera e perdi una vita. I punti partita restano invariati.');

      setTimeout(() => {
        setFeedback(null);
      }, 350);
    }
  }

  const assignedChunks = useMemo(
    () => exercise.chunks.filter((chunk) => assignments[chunk] !== null),
    [exercise, assignments]
  );

  const unassignedChunks = useMemo(
    () => exercise.chunks.filter((chunk) => assignments[chunk] === null),
    [exercise, assignments]
  );

  const urgent = timeLeft <= 30;

  if (result) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.wrapper}>
          <View style={styles.resultsSummaryCard}>
            <Text style={styles.resultsSummaryTitle}>{result.title}</Text>
            <Text style={styles.resultsLine}>Punti: {result.score}</Text>
            <Text style={styles.resultsLine}>Combo migliore: x{result.bestCombo}</Text>
            <Text style={styles.resultsLine}>Frasi corrette: {correctCount}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={onBack}>
              <Text style={styles.primaryButtonText}>Torna alla home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrapper}>
        <View style={styles.screenHeader}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Modalità classica</Text>
          <View style={{ width: 42 }} />
        </View>

        <View style={styles.topRow}>
          <Animated.View
            style={[
              styles.statCard,
              urgent && styles.statCardUrgent,
              urgent && { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Text style={[styles.statLabel, urgent && styles.statLabelUrgent]}>Tempo</Text>
            <Text style={[styles.statValue, urgent && styles.statValueUrgent]}>{timeLeft}s</Text>
          </Animated.View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Punti partita</Text>
            <Text style={styles.statValue}>{score}</Text>
          </View>
        </View>

        <View style={styles.topRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Vite</Text>
            <Text style={styles.statValue}>{heartsString(lives)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Combo</Text>
            <Text style={styles.statValue}>x{combo}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Frase</Text>
        <View style={styles.sentenceCard}>
          <Text style={styles.sentenceText}>{exercise.sentence}</Text>
        </View>

        <Text style={styles.sectionLabel}>Pezzi di frase</Text>
        <View style={styles.chunksWrap}>
          {unassignedChunks.map((chunk) => (
            <TouchableOpacity key={chunk} style={styles.chunkButton} onPress={() => openCategoryChooser(chunk)}>
              <Text style={styles.chunkButtonText}>{chunk}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.helperText}>Ogni analisi corretta vale 10 punti. Le frasi non si ripetono nella stessa partita.</Text>

        <Text style={styles.sectionLabel}>Le tue scelte</Text>
        <View
          style={[
            styles.answersCard,
            feedback === 'correct' && styles.answersCardCorrect,
            feedback === 'wrong' && styles.answersCardWrong,
          ]}
        >
          {assignedChunks.length === 0 ? (
            <Text style={styles.emptyText}>Le assegnazioni compariranno qui.</Text>
          ) : (
            assignedChunks.map((chunk) => (
              <TouchableOpacity key={chunk} style={styles.answerRow} onPress={() => removeAssignment(chunk)}>
                <Text style={styles.answerChunk}>{chunk}</Text>
                <Text style={styles.answerArrow}>→</Text>
                <Text style={styles.answerLabel}>{LABELS[assignments[chunk]]}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.passButton, skipUsedForCurrent && styles.passButtonDisabled]}
            onPress={handlePass}
          >
            <Text style={styles.passButtonText}>{skipUsedForCurrent ? 'Cambio usato' : 'Cambia frase'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Prossima</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Scegli la funzione logica</Text>
            {selectedChunk && <Text style={styles.modalSubtitle}>Pezzo selezionato: “{selectedChunk}”</Text>}
          </View>

          <ScrollView contentContainerStyle={styles.modalOptionsWrap}>
            {CATEGORY_OPTIONS.map((option) => (
              <TouchableOpacity key={option.key} style={styles.modalOption} onPress={() => assignCategory(option.key)}>
                <Text style={styles.modalOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseButtonText}>Chiudi</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}




export default function App() {
  const [screen, setScreen] = useState('home');
  const [profile, setProfile] = useState({ nickname: 'Giocatore', avatar: '🦊' });
  const [stats, setStats] = useState({
    classicGames: 0,
    classicCorrect: 0,
    classicErrors: 0,
    classicLosses: 0,
    miniGames: 0,
    mcqCorrect: 0,
    mcqQuestions: 0,
    detectiveGames: 0,
    detectiveCorrect: 0,
    detectiveQuestions: 0,
  });
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [dailyFailed, setDailyFailed] = useState(false);

  const points = useMemo(
    () => computeSessionPoints(stats, dailyCompleted),
    [stats, dailyCompleted]
  );

  let content;

  if (screen === 'settings') {
    content = (
      <SettingsScreen
        onBack={() => setScreen('home')}
        profile={profile}
        setProfile={setProfile}
        openGuide={() => setScreen('guide')}
      />
    );
  } else if (screen === 'guide') {
    content = <GuideScreen onBack={() => setScreen('home')} />;
  } else if (screen === 'daily') {
    content = (
      <DailyChallengeScreen
        onBack={() => setScreen('home')}
        dailyCompleted={dailyCompleted}
        setDailyCompleted={setDailyCompleted}
        dailyFailed={dailyFailed}
        setDailyFailed={setDailyFailed}
      />
    );
  } else if (screen === 'minigames') {
    content = (
      <MinigamesHome
        onBack={() => setScreen('home')}
        onStartQuiz={() => setScreen('mcq')}
        onStartDetective={() => setScreen('detective')}
      />
    );
  } else if (screen === 'mcq') {
    content = <MultipleChoiceQuiz onBack={() => setScreen('minigames')} onStatsUpdate={setStats} />;
  } else if (screen === 'detective') {
    content = <DetectiveGame onBack={() => setScreen('minigames')} onStatsUpdate={setStats} />;
  } else if (screen === 'game') {
    content = <MainGame onBack={() => setScreen('home')} onStatsUpdate={setStats} />;
  } else {
    content = (
      <HomeScreen
        profile={profile}
        points={points}
        dailyCompleted={dailyCompleted}
        setScreen={setScreen}
      />
    );
  }

  return (
    <View style={styles.desktopCanvas}>
      <View style={styles.appFrame}>{content}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopCanvas: {
    flex: 1,
    width: '100%',
    backgroundColor: '#DCE8DF',
    alignItems: 'center',
  },
  appFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#F4F8F4',
    shadowColor: '#173D2C',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F8F4',
  },
  wrapper: {
    padding: 18,
    paddingBottom: 40,
  },
  homeWrap: {
    padding: 20,
    paddingBottom: 40,
  },
  homeTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleBlock: {
    marginTop: 22,
    marginBottom: 22,
  },
  settingsCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D8E5D9',
  },
  settingsCircleText: {
    fontSize: 22,
  },
  reputationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D8E5D9',
  },
  reputationAvatar: {
    fontSize: 24,
    marginRight: 8,
  },
  reputationLabel: {
    fontSize: 11,
    color: '#5C7766',
  },
  reputationValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#143D2A',
  },
  colorfulTitleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorfulLetter: {
    fontSize: 42,
    fontWeight: '900',
  },
  homeSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#466454',
    marginBottom: 20,
  },
  bigPlayButton: {
    backgroundColor: '#1E8E3E',
    borderRadius: 24,
    paddingVertical: 22,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bigPlayButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  bigPlayButtonSub: {
    color: '#EAF5EC',
    fontSize: 13,
    marginTop: 6,
  },
  secondaryButtonsGrid: {
    gap: 12,
  },
  secondaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D8E5D9',
  },
  secondaryCardWide: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D8E5D9',
  },
  secondaryCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#143D2A',
    marginBottom: 6,
  },
  secondaryCardText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5C7766',
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E5D9',
  },
  backButtonText: {
    fontSize: 22,
    color: '#143D2A',
    fontWeight: '800',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#143D2A',
    flexShrink: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  bigCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D8E5D9',
  },
  cardSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#143D2A',
    marginBottom: 10,
  },
  longText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4F6958',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#365744',
    marginTop: 10,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E5D9',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#143D2A',
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F6FAF6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D8E5D9',
  },
  avatarButtonSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#E9F6EB',
  },
  avatarButtonText: {
    fontSize: 24,
  },
  smallHint: {
    fontSize: 13,
    color: '#64806D',
    marginTop: 10,
    lineHeight: 20,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D8E5D9',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 15,
    color: '#143D2A',
    fontWeight: '700',
    flex: 1,
  },
  menuItemArrow: {
    fontSize: 22,
    color: '#64806D',
    marginLeft: 12,
  },
  menuItemPremium: {
    backgroundColor: '#FFF6DD',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F2D37A',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemPremiumText: {
    fontSize: 15,
    color: '#8A5A00',
    fontWeight: '800',
    flex: 1,
  },
  menuItemArrowPremium: {
    fontSize: 18,
    color: '#8A5A00',
    marginLeft: 12,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3EE',
  },
  rankRowCurrentUser: {
    backgroundColor: '#EDF7EE',
    borderRadius: 14,
    paddingHorizontal: 10,
  },
  rankNumber: {
    width: 40,
    fontWeight: '900',
    color: '#143D2A',
  },
  rankAvatar: {
    fontSize: 22,
    marginRight: 10,
  },
  rankName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#143D2A',
  },
  rankSub: {
    fontSize: 12,
    color: '#64806D',
  },
  rankPoints: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E8E3E',
  },
  dailyBadge: {
    fontSize: 18,
    fontWeight: '900',
    color: '#143D2A',
  },
  errorBigText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#D93025',
    marginBottom: 12,
  },
  successCard: {
    backgroundColor: '#E8F5EA',
    borderColor: '#8BC596',
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
  },
  successTitle: {
    color: '#1E6B34',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  secondaryActionButton: {
    backgroundColor: '#FCEAEA',
    borderColor: '#E7BABA',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#A62B2B',
    fontSize: 15,
    fontWeight: '800',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    width: '48%',
    borderWidth: 1,
    borderColor: '#D8E5D9',
  },
  statCardUrgent: {
    borderColor: '#D93025',
    backgroundColor: '#FFF3F1',
  },
  statLabel: {
    fontSize: 13,
    color: '#64806D',
    marginBottom: 4,
  },
  statLabelUrgent: {
    color: '#D93025',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#143D2A',
  },
  statValueUrgent: {
    color: '#D93025',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#365744',
    marginTop: 6,
    marginBottom: 8,
  },
  sentenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#D8E5D9',
  },
  sentenceText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#143D2A',
  },
  chunksWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chunkButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2E7D32',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  chunkButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B5E20',
  },
  helperText: {
    fontSize: 13,
    color: '#64806D',
    marginBottom: 12,
  },
  answersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 2,
    borderColor: '#D8E5D9',
  },
  answersCardCorrect: {
    borderColor: '#2E7D32',
    backgroundColor: '#EDF7EE',
  },
  answersCardWrong: {
    borderColor: '#C62828',
    backgroundColor: '#FDEEEE',
  },
  emptyText: {
    color: '#7E9584',
    fontSize: 14,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3EE',
  },
  answerChunk: {
    fontSize: 15,
    fontWeight: '700',
    color: '#143D2A',
  },
  answerArrow: {
    marginHorizontal: 8,
    fontSize: 15,
    color: '#6E8675',
  },
  answerLabel: {
    fontSize: 15,
    color: '#1B5E20',
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.6,
  },
  passButton: {
    backgroundColor: '#FCEAEA',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    minWidth: 130,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7BABA',
  },
  passButtonDisabled: {
    opacity: 0.55,
  },
  passButtonText: {
    color: '#A62B2B',
    fontSize: 16,
    fontWeight: '800',
  },
  nextButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    minWidth: 130,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modalScreen: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    backgroundColor: '#F4F8F4',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#143D2A',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#5C7766',
  },
  modalOptionsWrap: {
    padding: 20,
    paddingBottom: 120,
  },
  modalOption: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#D8E5D9',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#143D2A',
  },
  modalFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    backgroundColor: '#F4F8F4',
    borderTopWidth: 1,
    borderTopColor: '#D8E5D9',
  },
  modalCloseButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8E5D9',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#A62B2B',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D8E5D9',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#143D2A',
  },
  mcqOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#D8E5D9',
  },
  mcqLetter: {
    fontWeight: '900',
    fontSize: 18,
    marginRight: 10,
  },
  mcqText: {
    fontSize: 16,
    flex: 1,
  },
  flashOverlay: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  flashText: {
    fontSize: 48,
    fontWeight: '900',
  },
  resultsSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D8E5D9',
  },
  resultsSummaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
  },
  resultsLine: {
    fontSize: 16,
    marginBottom: 6,
  },
  resultsVote: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 10,
    color: '#D93025',
  },
});
